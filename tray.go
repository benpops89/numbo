package main

import (
	_ "embed"
	"log"

	"github.com/egoist/mygo"
)

//go:embed resources/tray.png
var trayIconPNG []byte

// setupTray adds the menu bar / notification area icon with a small menu.
func setupTray(caller *Caller) {
	if _, err := mygo.NewTray(mygo.TrayOptions{
		ID:      "main",
		Icon:    trayIconPNG,
		ToolTip: "Numbo",
		Menu: mygo.NewMenu([]*mygo.MenuItem{
			{Label: "Reset Game", Click: func(*mygo.MenuItem, *mygo.Window) { go caller.Reset() }},
			mygo.Separator(),
			{Role: mygo.RoleQuit},
		}),
	}); err != nil {
		log.Println("tray:", err)
	}
}
