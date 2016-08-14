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

## Methods

In addition to these methods, `app.express` is a reference to the native
express `app` object, which has its own properties and methods.

### app.get(path, function(req, res)), app.post(path, function(req, res))

Listen to a path, coming from a get or post request. Works like express'
app.get and app.post, with these addittions:

#### req.session

If `options.session` is true, this contains a user session object from
[express-session](https://github.com/expressjs/session).

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
