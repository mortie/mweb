# webstuff

Express-based web server, designed to eliminate boilerplate for common tasks,
and provide some quality of life improvements like automatic reloading of
static files (in dev mode).

## Usage

The server should look something like this:

	var web = require("webstuff");
	var app = web(options);

The client should contain `<script src='/webstuff.js'></script>` in the
`<body>`.

## Options

The options object may contain the following values:

* **port**: Number. The http server's port. Default: the value of the PORT env
  variable if it exists, 8080 otherwise
* **host**: String. The http server's host. Default: "127.0.0.1" when dev mode,
  "0.0.0.0" when not
* **dev**: Boolean. Devleoper mode on or off. Default: true if the DEV env
  variable is 1, false othrewise
* **session**: Boolean, or options object. Whether users should have a permanent
  session. Default: false
* **client_utils**: Boolean. Whether utility functions should be included in
  the client or not. Default: true
* **login**: Boolean. Login system on or off. Requires `client_utils`. Default: false.

## Methods

In addition to these methods, `app.express` is a reference to the native
express `app` object, which has its own properties and methods.

### app.get(path, function(req, res)), app.post(path, function(req, res))

Listen to a path, coming from a get or post request. Works like express'
app.get and app.post, with these addittions:

#### req.session

If `options.session` is true, this contains a user session object from
[express-session](https://github.com/expressjs/session).

If `options.session` is true, and `options.login` is true, req.session.loggedIn
will be true if the user is logged in, or false (or undefined) if the user
isn't logged in.

#### req.parseBody(function(err, fields, files))

Parse the request's form data. Wrapper around
[Formidable](https://github.com/felixge/node-formidable).

#### req.getBody(function(err, str))

Get the request body as a string.

#### req.getJSON(function(err, object))

Get the request body, parsed as a JSON object.

### app.static(path)

Serve the static files in a directory. If `options.dev` is true, the browser
will automatically reload once any file in the directory changes.

### app.info(str), app.notice(str), app.warn(str), app.error(str), app.die(str)

Log a message to the console and a log file. Wrapper around the methods in
[mlogger](https://www.npmjs.com/package/mlogger). If they're given an error
object instead of a string, a stack trace will be included.

## Client functions

### client_utils

These functions exist if `options.client_utils` is true.

* `$$`: Shorter name for `document.querySelector`.
* `request(method, path, payload[ , function(err, res)])`: Wrapper around `XMLHttpRequest`.
* `get(path[, function(err, res)])`: Wrapper around `request`, sending a GET request.
* `post(path, payload[, function(err, res)])`: Wrapper around `request`, sending a POST request.

### login

These functions exist if `options.login` is true.

#### verifyLogin(function(success))

Tests whether the client has cached a valid token, and logs the user in if
there's a valid token.

You must set `app.onVerified` on the server, which is called once a client's
login token is verified.

#### login(credentials, function(err))

Logs the user in if correct credentials are provided, and stores a token which
will be used by `verifyLogin`.

You must set `app.onLogin(credentials, req, function(err))` on the server, which
is called once `login` is called on the client. The `credentials` object will
be the same as the one you pass to the client side `login` function, and is
controlled entirely by you. If the credentials are valid, you should pass
`null` to the callback function, otherwise you should pass an error message.

#### Login Example

Server side:

	var app = web({ client_utils: true, session: true, login: true });

	app.onLogin = function(creds, req, cb) {
		if (creds.username === "user" &&
				creds.password === "pa$$w0rd")
			cb(null);
		else
			cb("Invalid username or password.");
	}

	app.onVerified = function(req) {
		// There's not really anything we have to do here, but you might want to
	}

Client side (using prompt to prompt for username and password, you would
probably want to use some form element, but that's not included here for
simplicity's sake):

	function loggedIn() {
		// Here, we know we're logged in, either from logging in with
		// credentials, or from the token being verified
	}

	function tryLogin() {
		var creds = {
			username: prompt("Username"),
			password: prompt("Password")
		};
		login(creds, function(err) {
			if (err) {
				alert(err);
				return tryLogin();
			}

			loggedIn();
		});
	}

	verifyLogin(function(success) {
		if (success)
			loggedIn();
		else
			tryLogin();
	});
