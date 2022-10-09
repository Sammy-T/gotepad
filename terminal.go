package main

import (
	"context"
	"log"
	"os"
	"os/exec"
	rt "runtime"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TerminalAction struct {
	ctx       context.Context
	terminals map[string]Terminal
}

type Terminal struct {
	Name    string
	CmdRoot string // The terminal command to use when executing the 'open' command
	OpenCmd []string
}

func NewTerminalAction() *TerminalAction {
	return &TerminalAction{
		terminals: getTerminals(),
	}
}

func (ta *TerminalAction) startup(ctx context.Context) {
	ta.ctx = ctx
}

func (ta *TerminalAction) onDomReady(ctx context.Context) {
	runtime.EventsEmit(ta.ctx, "onTerminalsMapped", ta.terminals)
}

// OpenTerminal opens the terminal specified by the supplied name
func (ta *TerminalAction) OpenTerminal(name string) {
	terminal := ta.terminals[name]

	// Create the command
	cmd := exec.Command(terminal.CmdRoot, terminal.OpenCmd...)

	// Run the command
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

// getTerminals determines which terminals are available
func getTerminals() map[string]Terminal {
	terminals := make(map[string]Terminal)

	switch rt.GOOS {
	case "windows":
		cmdRoot := "cmd"

		// Set Command Prompt terminal
		terminals["Command Prompt"] = Terminal{"Command Prompt", cmdRoot, []string{"/C", "start"}}

		// Set Git Bash terminal if the file is found
		if bashPath := "C:/Program Files/Git/bin/bash.exe"; fileExists(bashPath) {
			bash := Terminal{
				"Git Bash",
				cmdRoot,
				[]string{"/C", "start", "", bashPath},
			}

			terminals[bash.Name] = bash
		}
	case "linux":
		if qTerminalPath := "/usr/bin/qterminal"; fileExists(qTerminalPath) {
			qTerminal := Terminal{
				"qTerminal",
				"qterminal",
				[]string{"qterminal"},
			}

			terminals["qTerminal"] = qTerminal
		}
	default:
		log.Printf("OS %v not implemented\n", rt.GOOS)
	}

	return terminals
}

// fileExists determines whether the file at the given path exists
func fileExists(path string) bool {
	_, err := os.Stat(path)

	// Use whether we received a 'not exist' exist error
	// to determine if the file exists.
	// (Why doesn't Go have a better way to do this?)
	return !os.IsNotExist(err)
}
