# mweb

Express-based web server, designed to eliminate boilerplate for common tasks,
and provide some quality of life improvements like automatic reloading of
static files (in dev mode).

## Usage

The server should look something like this:

	var mweb = require(mweb);

	var app = mweb(options);

The client should contain `<script src='/mweb.js'></script>` in the
`<body>`.

## Options

The options object may contain the following values:

* **port**: Number. The http server's port. Default: 8080
* **dev**: Boolean. Devleoper mode on or off. Default: false
* **session**: Boolean, or options object. Whether users should have a permanent
  session. Default: false
* **webevents**: Boolean. Whether the server should be able to send events to
  the client.

## Methods

### app.get(path, function(req, res)), app.post(path, function(req, res))

Listen to a path, coming from a get or post request. Works like express'
app.get and app.post, with these addittions:

#### req.session

If `options.session` is true, this contains a user session object from
[express-session](https://github.com/expressjs/session).

#### req.parseBody(function(err, fields, files))

Parse the request's form data. Wrapper around
[Formidable](https://github.com/felixge/node-formidable).

### app.static(path)

Serve the static files in a directory. If `options.dev` is true, the browser
will automatically reload once any file in the directory changes.

#### req.getBody(function(err, str))

Get the request body as a string.

#### req.getJSON(function(err, object))

Get the request body, parsed as a JSON object.

### app.emit(name, data)

If `options.webevents` is true, send an event to the client. The client can
listen to the event by doing `events.on(name, callback)`. Wrapper around
[webevents](https://www.npmjs.com/package/webevents).

### app.info(str), app.notice(str), app.warn(str), app.error(str), app.die(str)

Log a message to the console and a log file. Wrapper around the methods in
[mlogger](https://www.npmjs.com/package/mlogger).
