package main

import (
	"log"

	"github.com/egoist/mygo"
)

func main() {
	app := mygo.App
	app.SetName("Bingo Caller")

	caller := NewCaller()
	mygo.Bind(caller)

	app.WhenReady(func() {
		app.SetMenu(mygo.NewMenu([]*mygo.MenuItem{
			{Role: mygo.RoleAppMenu},
			{Label: "Game", Submenu: []*mygo.MenuItem{
				{Label: "Reset", Accelerator: "CmdOrCtrl+R", Click: func(*mygo.MenuItem, *mygo.Window) {
					go caller.Reset()
				}},
				mygo.Separator(),
				{Role: mygo.RoleClose},
			}},
			{Role: mygo.RoleEditMenu},
			{Role: mygo.RoleViewMenu},
			{Role: mygo.RoleWindowMenu},
		}))
		mygo.NewWindow(mygo.WindowOptions{
			Title:           "Bingo Caller",
			Width:           980,
			Height:          720,
			MinWidth:        720,
			MinHeight:       560,
			BackgroundColor: "light-dark(#f5f5f7, #1c1c1e)",
			StateKey:        "main",
			URL:             "/",
		})
	})
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
