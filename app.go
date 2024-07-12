package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	defaultFilename string
	filepath        string
	fileFilters     []runtime.FileFilter
	status          docStatus
}

type docStatus struct {
	saved   bool
	content string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{defaultFilename: "*.txt"}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	runtime.EventsOn(a.ctx, "onLanguagesLoaded", a.onLanguagesLoaded)
	runtime.EventsOn(a.ctx, "onSaveStatusUpdated", a.onSaveStatusUpdated)

	runtime.OnFileDrop(a.ctx, a.onFileDropped)
}

// beforeClose is called when the app is about to quit. It returns a boolean
// to determine whether the app should be prevented from closing.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	// Close as normal if the document is already saved or empty
	if a.status.saved || (a.filepath == "" && a.status.content == "") {
		return false
	}

	// Display a dialog to alert the user the current document is unsaved
	dialog, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         "Unsaved Changes",
		Message:       "Quit without saving?",
		DefaultButton: "No",
	})

	if err != nil {
		return false
	}

	return dialog != "Yes"
}

// onLanguagesLoaded builds the file filters used in the file dialogs
func (a *App) onLanguagesLoaded(optionalData ...interface{}) {
	a.fileFilters = []runtime.FileFilter{
		{DisplayName: "All files", Pattern: "*.*"},
	}

	// Return early if the arguments are empty
	if len(optionalData) == 0 {
		return
	}

	// Assert the data to a string
	jsonStr, ok := optionalData[0].(string)
	if !ok {
		log.Println("Error: Languages value cannot be asserted to string.")
		return
	}

	languages := ParseLanguages(jsonStr)

	// Add the languages to the file filters
	for _, language := range languages {
		fileFilter := runtime.FileFilter{
			DisplayName: language.Aliases[0],
			Pattern:     "*" + strings.Join(language.Extensions, ";*"),
		}

		a.fileFilters = append(a.fileFilters, fileFilter)
	}
}

// onSaveStatusUpdated updates the app's status with the received data
func (a *App) onSaveStatusUpdated(optionalData ...interface{}) {
	if len(optionalData) == 0 {
		return
	}

	saved, ok := optionalData[0].(bool)
	if !ok {
		log.Println("Error: Status value cannot be asserted to boolean.")
		return
	}

	content, ok := optionalData[1].(string)
	if !ok {
		log.Println("Error: Content value cannot be asserted to string.")
		return
	}

	a.status = docStatus{saved, content}
}

func (a *App) onFileDropped(x, y int, paths []string) {
	fmt.Printf("Dropped at %v,%v paths: %v\n", x, y, paths)

	// Check if the current file has unsaved content
	if !a.status.saved && (a.filepath != "" || a.status.content != "") {
		// Display a dialog to alert the user the current document is unsaved
		dialog, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Type:          runtime.QuestionDialog,
			Title:         "Unsaved Changes",
			Message:       "Open new file without saving?",
			DefaultButton: "No",
		})

		if err != nil || dialog != "Yes" {
			return
		}
	}

	a.readFile(paths[0])
}

// UpdateDefaultName sets the default file name to the provided string
func (a *App) UpdateDefaultName(filename string) {
	a.defaultFilename = filename
}

// NewFile clears the file path, sets the window title, and emits an 'onNewFile' event
func (a *App) NewFile() {
	a.filepath = ""
	a.defaultFilename = "*.txt"
	a.status = docStatus{}

	runtime.WindowSetTitle(a.ctx, "gotepad")
	runtime.EventsEmit(a.ctx, "onNewFile")
}

// OpenFile opens a file dialog and reads the selected file
func (a *App) OpenFile() {
	options := runtime.OpenDialogOptions{
		Filters: a.fileFilters,
	}

	// Open the dialog
	filepathStr, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	} else if filepathStr == "" {
		return // Return early if the user cancelled
	}
	log.Printf("filepath: %v\n", filepathStr)

	a.readFile(filepathStr)
}

// readFile is a helper to read the passed in file,
// update the app's file fields
// and emit the "onFileRead" event.
func (a *App) readFile(filepathStr string) {
	// Update the app's file fields
	a.filepath = filepathStr
	a.defaultFilename = "*" + filepath.Ext(filepathStr)

	runtime.WindowSetTitle(a.ctx, "gotepad - "+filepath.Base(filepathStr))

	// Read the file
	data, err := os.ReadFile(filepathStr)
	if err != nil {
		log.Printf("Error reading file. %v\n", err)
		return
	}

	// Update the status
	a.status = docStatus{true, string(data)}

	response := Response{
		Status:  "success",
		Message: filepathStr,
		Data:    string(data),
	}

	// Emit an event with the read file text attached
	runtime.EventsEmit(a.ctx, "onFileRead", response)
}

// SaveAs opens a file dialog and saves the contents at the selected path
func (a *App) SaveAs(contents string) {
	options := runtime.SaveDialogOptions{
		DefaultFilename: a.defaultFilename,
		Filters:         a.fileFilters,
	}

	// Open the dialog
	filepathStr, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v\n", err)
		return
	} else if filepathStr == "" {
		return // Return early if the user cancelled
	}

	a.filepath = filepathStr
	a.Save(contents)
}

// Save writes the contents to the file at the app's filepath
func (a *App) Save(contents string) {
	// Check for a valid filepath
	if a.filepath == "" {
		a.SaveAs(contents)
		return
	}

	log.Printf("Save path: %v", a.filepath)
	runtime.WindowSetTitle(a.ctx, "gotepad - "+filepath.Base(a.filepath))

	var response Response

	// Save the file at the selected file path
	err := os.WriteFile(a.filepath, []byte(contents), 0666)
	if err != nil {
		response.Status = "error"
		response.Message = err.Error()
	} else {
		response.Status = "success"
		a.status.saved = true
	}

	// Emit an event to notify the save status
	runtime.EventsEmit(a.ctx, "onFileSaved", response)
}
