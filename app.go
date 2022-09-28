package main

import (
	"context"
	"log"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var fileFilters = []runtime.FileFilter{
	{DisplayName: "Text files", Pattern: "*.txt"},
	{DisplayName: "All files (*.*)", Pattern: "*.*"},
}

// App struct
type App struct {
	ctx      context.Context
	filepath string
}

type ActionResponse struct {
	Status  string
	Message string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// NewFile emits an 'onNewFile' event
func (a *App) NewFile() {
	a.filepath = ""
	runtime.EventsEmit(a.ctx, "onNewFile")
}

// OpenFile opens a file dialog and reads the selected file
func (a *App) OpenFile() {
	options := runtime.OpenDialogOptions{
		Filters: fileFilters,
	}

	// Open the dialog
	filepath, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	} else if filepath == "" {
		return // Return early if the user cancelled
	}

	a.filepath = filepath

	// Read the file at the selected file path
	data, err := os.ReadFile(filepath)
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
		Filters:         fileFilters,
	}

	// Open the dialog
	filepath, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	} else if filepath == "" {
		return // Return early if the user cancelled
	}

	a.filepath = filepath
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

	var response ActionResponse

	// Save the file at the selected file path
	err := os.WriteFile(a.filepath, []byte(contents), 0666)
	if err != nil {
		response.Status = "error"
		response.Message = err.Error()
	} else {
		response.Status = "success"
	}

	// Emit an event to notify the save status
	runtime.EventsEmit(a.ctx, "onFileSaved", response)
}

// RequestSaveAs is a helper to notify the frontend that the app is attempting to save.
// This allows the frontend to respond with the necessary data.
func (a *App) RequestSaveAs() {
	runtime.EventsEmit(a.ctx, "onRequestSaveAs")
}

// RequestSave is a helper to notify the frontend that the app is attempting to save.
// This allows the frontend to respond with the necessary data.
func (a *App) RequestSave() {
	runtime.EventsEmit(a.ctx, "onRequestSave")
}
