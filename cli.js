#!/usr/bin/env node

var web = require(".");

var app = web({
	dev: true
});

app.static(".");
