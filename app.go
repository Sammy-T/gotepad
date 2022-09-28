package main

import (
	"context"
	"log"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
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

// OpenFileDialog opens a file dialog with selection filtered to text files
func (a *App) OpenFileDialog() {
	fileFilter := runtime.FileFilter{
		DisplayName: "Text files",
		Pattern:     "*.txt",
	}
	options := runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{fileFilter},
	}

	// Open the dialog
	filepath, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error retrieving file path. %v", err)
		return
	}

	// Read the file at the selected file path
	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Printf("Error reading file. %v", err)
		return
	}

	// Emit an event with the read file text attached
	runtime.EventsEmit(a.ctx, "onFileRead", string(data))
}
