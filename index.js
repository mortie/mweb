let express = require("express");
let utils = require("./js/utils");
let fs = require("fs");
let http = require("http");
let crypto = require("crypto");
let log = require("mlogger");

function endpoint(func, path, cb) {
	func(path, (req, res) => {
		req.parseBody = cb => utils.parseBody(req, cb);
		req.getBody = cb => utils.getBody(req, cb);
		req.getJSON = cb => utils.getJSON(req, cb);

		cb(req, res);
	});
}

let clientScript = "";
function addScriptPart(name, str, dev) {
	let start = "(function() {\n";
	let end = "\n})();\n";

	if (dev) {
		start =
			"/*\n"+
			" * Beginning of "+name+"\n"+
			" */\n"+
			start;
		end =
			end+
			"/*\n"+
			" * End of "+name+"\n"+
			" */\n\n";

		str = str.trim();
	}

	clientScript = clientScript + start + str + end;
}

module.exports = function(options) {
	let self = {};

	options = options || {};
	options.port = options.port || 8080;
	options.dev = options.dev || false;
	options.session = options.session || false;
	options.webevents = options.webevents || false;
	options.host = options.host || (options.dev ? "127.0.0.1" : "0.0.0.0");

	let app = express();
	let server = http.createServer(app);

	let reloader;
	if (options.dev) reloader = require("reload")(server, app);

	app.get("/mweb.js", (req, res) => res.end(clientScript));

	// Session (req.session)
	if (options.session) {
		let opts = {
			resave: false,
			saveUninitialized: false,
			secret: crypto.randomBytes(16).toString("hex")
		};
		if (typeof options.session === "object") {
			for (let i in options.session) {
				opts[i] = options.session[i];
			}
		}
		app.use(require("express-session")(opts));
	}

	// Events (self.emit, events)
	if (options.webevents) {
		let events = require("webevents")();
		self.emit = events.emit;
		app.post("/webevents/*", events.handle);

		let wscript;
		try {
			wscript = fs.readFileSync(
				"node_modules/webevents/client.js",
				"utf8");
		} catch (err) {
			wscript = fs.readFileSync(
				__dirname+"/node_modules/wenbevents/client.js",
				"utf8");
		}

		addScriptPart("WebEvents Library", wscript, options.dev);
		addScriptPart("Events",
			fs.readFileSync(__dirname+"/client-events.js", "utf8"),
			options.dev);
	}

	// Handle get and post requests
	self.get = (req, res) => endpoint(app.get.bind(app), req, res);
	self.post = (req, res) => endpoint(app.post.bind(app), req, res);

	// Serve static files
	self.static = function(path) {
		app.use(express.static(path));

		if (options.dev) {
			let cb = utils.debounce(function() {
				log.info("Reloading");
				reloader.reload();
			});
			utils.watchRecursive(path, cb);
		}
	}

	// Handle reloads client side
	if (options.dev) {
		addScriptPart("Dev",
			fs.readFileSync(__dirname+"/client-dev.js", "utf8"),
			options.dev);
	}

	server.listen(options.port, options.host);
	log.info("Server listening to "+options.host+":"+options.port);

	self.info = log.info;
	self.notice = log.notice;
	self.warn = log.warn;
	self.error = log.error;
	self.die = log.die;

	return self;
}
