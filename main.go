package main

import (
	"log"

	"github.com/egoist/mygo"
)

func main() {
	app := mygo.App
	app.SetName("Numbo")

	caller := NewCaller()
	mygo.Bind(caller)

	app.WhenReady(func() {
		// No menu bar: the app is driven by its own UI.
		app.SetMenu(nil)
		setupTray(caller)
		mygo.NewWindow(mygo.WindowOptions{
			Title:           "Numbo",
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
