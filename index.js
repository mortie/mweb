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
	}
	str = str.trim();

	clientScript = clientScript + start + str + end;
}

// Defaulut values
function defval(val, def) {
	return val === undefined ? def : val;
}

module.exports = function(options) {
	let self = {};

	options = defval(options, {});

	options.port = defval(options.port, 8080);
	options.dev = defval(options.dev, process.env.DEV === "1");
	options.host = defval(options.host, (options.dev ? "127.0.0.1" : "0.0.0.0"));
	options.session = defval(options.session, false);
	options.client_utils = defval(options.client_utils, true);

	if (options.dev)
		log.info("Dev mode active.");

	let app = express();
	let server = http.createServer(app);

	let reloader;
	if (options.dev) reloader = require("reload")(server, app);

	app.get("/webstuff.js", (req, res) => res.end(clientScript));

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
		addScriptPart("Reload",
			fs.readFileSync(__dirname+"/client-reload.js", "utf8"),
			options.dev);
	}

	// Client side utilty functions
	if (options.client_utils) {
		addScriptPart("Utils",
			fs.readFileSync(__dirname+"/client-utils.js", "utf8"),
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
