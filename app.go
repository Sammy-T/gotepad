package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	filePath    string
	fileFilters []runtime.FileFilter
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	runtime.EventsOn(a.ctx, "onLanguagesLoaded", a.onLanguagesLoaded)
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

// NewFile clears the file path, sets the window title, and emits an 'onNewFile' event
func (a *App) NewFile() {
	a.filePath = ""
	runtime.WindowSetTitle(a.ctx, "gotepad")
	runtime.EventsEmit(a.ctx, "onNewFile")
}

// OpenFile opens a file dialog and reads the selected file
func (a *App) OpenFile() {
	options := runtime.OpenDialogOptions{
		Filters: a.fileFilters,
	}

	// Open the dialog
	filePath, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	} else if filePath == "" {
		return // Return early if the user cancelled
	}

	a.filePath = filePath
	runtime.WindowSetTitle(a.ctx, "gotepad - "+filepath.Base(filePath))

	// Read the file at the selected file path
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading file. %v", err)
		return
	}

	// Emit an event with the read file text attached
	runtime.EventsEmit(a.ctx, "onFileRead", string(data))
}

// SaveAs opens a file dialog and saves the contents at the selected path
func (a *App) SaveAs(contents string) {
	options := runtime.SaveDialogOptions{
		DefaultFilename: "*.txt",
		Filters:         a.fileFilters,
	}

	// Open the dialog
	filePath, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	} else if filePath == "" {
		return // Return early if the user cancelled
	}

	a.filePath = filePath
	a.Save(contents)
}

// Save writes the contents to the file at the app's filepath
func (a *App) Save(contents string) {
	// Check for a valid filepath
	if a.filePath == "" {
		a.SaveAs(contents)
		return
	}

	log.Printf("Save path: %v", a.filePath)
	runtime.WindowSetTitle(a.ctx, "gotepad - "+filepath.Base(a.filePath))

	var response Response

	// Save the file at the selected file path
	err := os.WriteFile(a.filePath, []byte(contents), 0666)
	if err != nil {
		response.Status = "error"
		response.Message = err.Error()
	} else {
		response.Status = "success"
	}

	// Emit an event to notify the save status
	runtime.EventsEmit(a.ctx, "onFileSaved", response)
}
