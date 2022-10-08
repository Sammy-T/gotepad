package main

import (
	"context"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create instance of the app structure(s)
	app := NewApp()
	termAction := NewTerminalAction()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "gotepad",
		Width:            820,
		Height:           650,
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			termAction.startup(ctx)
		},
		OnDomReady: termAction.onDomReady,
		Bind: []interface{}{
			app,
			termAction,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
