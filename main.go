package main

import (
	"context"
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed all:frontend/dist
var assets embed.FS

type Response struct {
	Status  string
	Message string
	Data    interface{}
}

func main() {
	// Create instance of the app structure(s)
	app := NewApp()
	termAction := NewTerminalAction(app)

	appConfig := NewAppConfig()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "gotepad",
		Width:            820,
		Height:           650,
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: true,
		},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			termAction.startup(ctx)
			appConfig.startup(ctx)
		},
		OnDomReady:    termAction.onDomReady,
		OnBeforeClose: app.beforeClose,
		Bind: []interface{}{
			app,
			termAction,
			appConfig,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

// fileExists is a helper to determine whether the file at the given path exists
func fileExists(path string) bool {
	_, err := os.Stat(path)

	// Use whether we received a 'not exist' exist error
	// to determine if the file exists.
	// (Why doesn't Go have a better way to do this?)
	return !os.IsNotExist(err)
}
