let formidable = require("formidable");
let pathlib = require("path");
let fs = require("fs");

exports.parseBody = function(req, cb) {
	let form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		cb(err, fields, files);
	});
}

exports.getBody = function(req, cb) {
	let str = "";
	let maxSize = 1024 * 1024; //1 MB
	let errored = false;

	req
		.on("data", d => {
			if (errored) return;

			if (d.length + str.length > maxSize) {
				cb(new Error("Too long payload!"));
				errored = true;
				return;
			}

			str += d;
		})
		.on("end", () => cb(null, str))
		.on("error", err => cb(err));
}

exports.getJSON = function(req, cb) {
	getBody(req, function(err, res) {
		if (err)
			return cb(err);

		try {
			cb(null, JSON.parse(res));
		} catch (err) {
			cb(err);
		}
	});
}

exports.watchRecursive = function watch(dir, cb) {
	fs.watch(dir, cb);
	fs.readdir(dir, function(err, files) {
		if (err) {
			console.log("Couldn't watch dir "+dir);
			console.trace(err);
			return;
		}

		files.forEach(file => {
			fs.stat(pathlib.join(dir, file), (err, stat) => {
				if (stat.isDirectory())
					watch(pathlib.join(dir, file), cb)
			});
		});
	});
}

exports.debounce = function(cb) {
	let timeout;
	return function() {
		if (timeout)
			clearTimeout(timeout);

		timeout = setTimeout(cb, 100);
	}
}
