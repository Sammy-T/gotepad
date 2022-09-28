package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed all:frontend/dist
var assets embed.FS

var app *App

func main() {
	// Create an instance of the app structure
	app = NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "gotepad",
		Width:            1024,
		Height:           768,
		Menu:             createAppMenu(),
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func createAppMenu() *menu.Menu {
	appMenu := menu.NewMenu()

	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New", keys.CmdOrCtrl("n"), newFileCallback)
	fileMenu.AddText("Open", keys.CmdOrCtrl("o"), openFileCallback)

	return appMenu
}

func newFileCallback(data *menu.CallbackData) {
	app.NewFile()
}

func openFileCallback(data *menu.CallbackData) {
	app.OpenFileDialog()
}
