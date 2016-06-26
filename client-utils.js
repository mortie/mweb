function request(method, path, payload, cb) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, path);
	xhr.send(payload);

	xhr.addEventListener("load", function() {
		cb(null, xhr.responseText);
	});
	xhr.addEventListener("abort", function() {
		cb(new Error("Aborted"));
	});
	xhr.addEventListener("error", function() {
		cb(new Error("Error"));
	});

	return xhr;
}

function get(path, cb) {
	return request("GET", path, null, cb);
}

function post(path, payload, cb) {
	return request("POST", path, payload, cb);
}

window.request = request;
window.get = get;
window.post = post;
