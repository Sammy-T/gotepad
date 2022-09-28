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

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "gotepad",
		Width:            1024,
		Height:           768,
		Menu:             createAppMenu(app),
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

func createAppMenu(app *App) *menu.Menu {
	newFileCallback := func(data *menu.CallbackData) { app.NewFile() }
	openFileCallback := func(data *menu.CallbackData) { app.OpenFile() }

	saveFileCallback := func(data *menu.CallbackData) {
		switch data.MenuItem.Label {
		case "Save":
			app.RequestSave()
		case "Save As":
			app.RequestSaveAs()
		}
	}

	appMenu := menu.NewMenu()

	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New", keys.CmdOrCtrl("n"), newFileCallback)
	fileMenu.AddText("Open", keys.CmdOrCtrl("o"), openFileCallback)
	fileMenu.AddText("Save", keys.CmdOrCtrl("s"), saveFileCallback)
	fileMenu.AddText("Save As", keys.Combo("s", keys.CmdOrCtrlKey, keys.ShiftKey), saveFileCallback)

	return appMenu
}
