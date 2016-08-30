function verifyLogin(cb) {
	var token = localStorage.get("webstuff-token");
	if (token) {
		var t = JSON.stringify({ token: token });
		post("/webstuff-login-verify", t, function(err, res) {
			if (err) {
				console.error(err);
				return cb(false);
			}

			var obj = JSON.parse(res);
			if (obj.success)
				cb(true);
			else
				cb(false);
		});
	} else {
		cb(false);
	}
}

function login(creds, cb) {
	post("/webstuff-login", JSON.stringify(creds), function(err, res) {
		if (err)
			cb(err);

		var obj = JSON.parse(res);
		if (obj.error) {
			cb(obj.error);
		} else {
			localStorage.set("webstuff-token", obj.token);
			cb(null);
		}
	});
}

window.verifyLogin = verifyLogin;
window.login = login;
