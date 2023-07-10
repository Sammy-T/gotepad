package main

import (
	"context"
	"log"
	"os/exec"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TerminalAction struct {
	ctx       context.Context
	terminals map[string]Terminal
}

var app *App

func NewTerminalAction(a *App) *TerminalAction {
	app = a

	return &TerminalAction{
		terminals: getTerminals(),
	}
}

func (ta *TerminalAction) startup(ctx context.Context) {
	ta.ctx = ctx
	runtime.EventsOn(ta.ctx, "onConfigLoaded", ta.onConfigLoaded)
}

func (ta *TerminalAction) onDomReady(ctx context.Context) {
	response := Response{"success", "terminals mapped", ta.terminals}
	runtime.EventsEmit(ta.ctx, "onTerminalsMapped", response)
}

// onConfigLoaded adds additional terminals loaded from the config file
func (ta *TerminalAction) onConfigLoaded(data ...interface{}) {
	if len(data) == 0 {
		return
	}

	// Assert the data to a response
	resp, ok := data[0].(Response)
	if !ok {
		log.Println("Error: Data value cannot be asserted to Response.")
		return
	}

	if resp.Status != "success" {
		return
	}

	// Assert the response's data field to a config
	config, ok := resp.Data.(*AppConfig)
	if !ok {
		log.Println("Error: Response data cannot be asserted to AppConfig")
		return
	}

	// Add the terminals to the map
	for _, terminal := range config.ExtTerminals {
		ta.terminals[terminal.Name] = terminal
	}

	response := Response{"success", "terminals mapped", ta.terminals}
	runtime.EventsEmit(ta.ctx, "onTerminalsMapped", response)
}

// OpenTerminal opens the terminal specified by the supplied name
func (ta *TerminalAction) OpenTerminal(name string) {
	terminal := ta.terminals[name]

	// Create the command
	cmd := exec.Command(terminal.CmdRoot, terminal.OpenCmd...)

	// Set the command's working directory
	if len(app.filePath) > 0 {
		cmd.Dir = filepath.Dir(app.filePath)
	}

	// Run the command
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
