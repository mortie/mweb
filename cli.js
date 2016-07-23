#!/usr/bin/env node

var web = require("webstuff");

var app = web({
	port: 8080,
	dev: true
});

app.static(".");
