package main

import (
	"context"
	"log"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TerminalAction struct {
	ctx       context.Context
	terminals map[string]Terminal
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
	response := Response{"success", "terminals loaded on ready", ta.terminals}
	runtime.EventsEmit(ta.ctx, "onTerminalsMapped", response)
}
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
