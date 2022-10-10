package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type AppConfig struct {
	ctx          context.Context
	ExtTerminals []Terminal
}

func NewAppConfig() *AppConfig {
	return &AppConfig{}
}

func (a *AppConfig) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *AppConfig) ReadConfig(configPath string) {
	var response Response

	// Read the file at the provided path
	data, err := os.ReadFile(configPath)
	if err != nil {
		response.Status = "error"
		response.Message = err.Error()

		log.Printf("Config read error: %v\n", response)
		runtime.EventsEmit(a.ctx, "onConfigLoaded", response)
		return
	}

	// Decode the json from the file data
	err = json.Unmarshal(data, a)
	if err != nil {
		response.Status = "error"
		response.Message = err.Error()

		log.Printf("Config read error: %v\n", response)
		runtime.EventsEmit(a.ctx, "onConfigLoaded", response)
		return
	}

	// Attach the config to the response
	response.Status = "success"
	response.Message = "config loaded"
	response.Data = a

	runtime.EventsEmit(a.ctx, "onConfigLoaded", response)
}
