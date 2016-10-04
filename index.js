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
	if (
			val === undefined ||
			val === null ||
			(typeof val === "number" && isNaN(val)))
		return def;
	else
		return val;
}

module.exports = function(options) {
	let self = {};

	options = defval(options, {});

	options.port = defval(options.port, defval(parseInt(process.env.PORT), 8080));
	options.dev = defval(options.dev, process.env.DEV === "1");
	options.host = defval(options.host, (options.dev ? "0.0.0.0" : "127.0.0.1"));
	options.session = defval(options.session, false);
	options.client_utils = defval(options.client_utils, true);
	options.login = defval(options.login, false);
	options.reload = defval(options.reload, options.dev);

	if (options.dev)
		log.info("Dev mode active.");

	let app = express();
	let server = http.createServer(app);

	let reloader;
	if (options.reload) reloader = require("reload")(server, app);

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

	// Reference to the native express 'app'
	self.express = app;
	// And reference to the HTTP server as 'server'

	// Handle get and post requests
	self.get = (req, res) => endpoint(app.get.bind(app), req, res);
	self.post = (req, res) => endpoint(app.post.bind(app), req, res);

	// Serve static files
	self.static = function(path) {
		app.use(express.static(path));

		if (options.reload) {
			let cb = utils.debounce(function() {
				log.info("Reloading");
				try {
					reloader.reload();
				} catch (err) {
					console.log("Reloading error:");
					console.trace(err);
				}
			});
			utils.watchRecursive(path, cb);
		}
	}

	// Handle reloads client side
	if (options.reload) {
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

	// Login system
	if (options.login) {
		if (!options.client_utils)
			throw "options.client_utils is required for options.login.";

		addScriptPart("Login",
			fs.readFileSync(__dirname+"/client-login.js", "utf8"),
			options.login);

		self.tokens = {};

		app.post("/webstuff-login", (req, res) => {
			utils.getJSON(req, (err, creds) => {
				if (err)
					return res.json({ error: err });

				// err should be an error message if invalid login, or null
				// otherwise 
				self.onLogin(creds, req, err => {
					if (err)
						return res.json({ error: err });

					if (options.session)
						req.session.loggedIn = true;

					var token = crypto.randomBytes(32).toString("hex");
					self.tokens[token] = true;
				});
			});
		});

		app.post("/webstuff-login-verify", (req, res) => {
			utils.getJSON(req, (err, obj) => {

				// Successfully verified, set loggedIn to true
				if (obj.token && self.tokens[obj.token]) {
					if (options.session)
						req.session.loggedIn = true;

					self.onVerified(req);
					return res.json({ success: true });

				// Not verified, loggedIn is false
				} else {
					if (options.session)
						req.session.loggedIn = false;

					return res.json({ success: false });
				}
			});
		});
	}

	// Get the address (e.g http://localhost:8080)
	self.getAddress = function() {
		return "http://"+options.host+":"+options.port;
	}

	// Listen, and say the server is running
	server.listen(options.port, options.host);
	log.info("Server listening to "+options.host+":"+options.port);

	self.info = log.info;
	self.notice = log.notice;
	self.warn = log.warn;
	self.error = log.error;
	self.die = log.die;

	return self;
}
