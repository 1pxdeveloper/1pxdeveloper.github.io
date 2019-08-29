$module.factory("$timeout", function(Observable) {
	return function(duration, value) {
		return Observable.timeout(duration, value).toPromise();
	}
});

$module.factory("http", function($timeout) {

	var MINIMUM_CACHE_DURATION = 150;


	function fetchEx(url, params) {
		var root = "";
		var mode = "same-origin";
		var credentials = "same-origin";

		url = root + url;
		params.mode = mode;
		params.credentials = credentials;
		return fetch(url, params);
	}

	function fileUpload(file) {

		console.log("fileUpload", file);


		var dataURI = file.src;

		return Promise.resolve(dataURItoBlob(dataURI)).then(function(blob) {

			if (blob.type.indexOf("image") === -1) {
				return blob;
			}

			return new Promise(function(resolve, reject) {
				var img = document.createElement("img");
				img.onload = function() {
					blob.width = img.naturalWidth || img.width;
					blob.height = img.naturalHeight || img.height;
					resolve(blob);
				};

				img.onerror = function() {
					reject();
				};

				img.src = dataURI;
			})

		}).then(function(blob) {

			return POST("/api/files/upload-url").then(function(res) {
				return res.upload_url;
			}).then(function(url) {

				var params = new FormData();
				params.append("file", blob);
				params.append("name", file.name);
				params.append("type", blob.type);
				params.append("size", blob.size);
				params.append("width", blob.width);
				params.append("height", blob.height);

				return fetchEx(url, {method: "POST", body: params})

			}).then(function(res) {
				return res.json();
			});
		});
	}

	function dataURItoBlob(dataURI) {
		// convert base64/URLEncoded data component to raw binary data held in a string
		var byteString;
		if (dataURI.split(',')[0].indexOf('base64') >= 0) {
			byteString = atob(dataURI.split(',')[1]);
		}
		else {
			byteString = unescape(dataURI.split(',')[1]);
		}

		// separate out the mime component
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to a typed array
		var ia = new Uint8Array(byteString.length);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {type: mimeString});
	}

	function isDataURI(str) {
		if (!str) return false;


		return str.slice(0, 5) === "data:";
	}

	function isGAEImage(data) {
		console.log(data);

		return Object(data) === data && isDataURI(data.src);
	}


	function buildArguments(args) {
		var path = [];
		var data = {};

		for (var i = 0, len = args.length; i < len; i++) {
			var arg = args[i];
			var type = typeof arg;

			switch (type) {
				case "number":
				case "string":
					path.push(arg);
					break;

				case "object":
					data = arg;
					break;
			}
		}

		return {
			path: path.join("/"),
			data: data
		}
	}

	function processResponse(res) {
		return res.json().then(function(json) {
			if (res.ok) {
				return json;
			}

			if (json && json.reason) {
				console.error(json.reason);
			}

			throw json;
		});
	}

	function processResponseWithAlert(res) {
		return res.json().then(function(json) {
			if (res.ok) {
				return json;
			}

			if (json && json.reason) {
				console.error(json.reason);
				alert(json.reason);
			}

			throw json;
		});
	}


	function processHideLoading(t) {
		return function(res) {
			t = Math.max(0, MINIMUM_CACHE_DURATION - (new Date() - t));

			return $timeout(function() {
				if (typeof window.hideLoading === "function") {
					window.hideLoading();
				}

				return res;
			}, t);
		}
	}

	function checkGAEImage(data, promise) {
		promise = promise || [];

		foreach(data, function(value, key) {
			if (Array.isArray(value)) {
				checkGAEImage(value, promise);
				return;
			}

			if (isGAEImage(value)) {
				delete data[key];
				promise.push(fileUpload(value).then(function(res) {
					data[key] = res;
				}));
				return;
			}

			if (Object(value) === value) {
				checkGAEImage(value, promise);
				return;
			}
		});

		return promise;
	}

	function GET() {
		if (typeof window.showLoading === "function") {
			window.showLoading();
		}

		var params = buildArguments(arguments);
		var body = Object.assign({}, params.data);

		//var query = [];
		//foreach(params.data, function(value, key) {
		//	if (value === undefined || value === null) {
		//		return;
		//	}
		//	query.push(key + "=" + encodeURIComponent(JSON.stringify(value)));
		//});
		//
		//if (query.length) {
		//	params.path += "?" + query.join("&");
		//}

		body = JSON.stringify(body);
		if (body !== "{}") {
			params.path += "?json=" + encodeURIComponent(body);
		}

		var t = new Date();
		var p2 = fetchEx(params.path, {method: "GET"}).then(processResponse);
		p2.then(processHideLoading(t), processHideLoading(t));
		return p2;
	}

	function POST() {

		if (typeof window.showLoading === "function") {
			window.showLoading();
		}

		var params = buildArguments(arguments);


		var body = Object.assign({}, params.data);
		var promise = checkGAEImage(body);

		var t = new Date();

		var p2 = Promise.all(promise).then(function() {
			return fetchEx(params.path, {
				method: "POST",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)

			}).then(processResponseWithAlert)
		});

		p2.then(processHideLoading(t), processHideLoading(t));
		return p2;
	}

	function PUT() {
		if (typeof window.showLoading === "function") {
			window.showLoading();
		}

		var params = buildArguments(arguments);

		var body = Object.assign({}, params.data);
		var promise = checkGAEImage(body);

		var t = new Date();

		var p2 = Promise.all(promise).then(function() {
			return fetchEx(params.path, {
				method: "PUT",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			}).then(processResponseWithAlert)
		});

		p2.then(processHideLoading(t), processHideLoading(t));
		return p2;
	}


	function DELETE() {
		if (typeof window.showLoading === "function") {
			window.showLoading();
		}

		var params = buildArguments(arguments);

		var t = new Date();

		var p2 = fetchEx(params.path, {method: "DELETE"}).then(processResponseWithAlert);

		p2.then(processHideLoading(t), processHideLoading(t));
		return p2;
	}

	function GAEImage() {
		this.id = "";
		this.src = "";
		this.name = "";
		this.width = 0;
		this.height = 0;
	}

	var order = 0;
	var commited = 0;
	var queue = [];

	var http = {
		"Image": GAEImage,

		"GET": GET,
		"POST": POST,
		"PUT": PUT,
		"DELETE": DELETE,

		"GET_QUEUE": function() {
			var index = order;
			order++;

			function t(type) {
				return function(res) {
					if (index === commited) {
						queue.forEach(function(v, idx) {
							commited = idx + 1;
							v(v.res);
						});
						queue = [];

						commited = Math.max(commited, index + 1);
						if (type === "resolve") {
							return res;
						}
						else {
							throw res;
						}
					}
					else {
						return new Promise(function(resolve, reject) {
							var r = type === "resolve" ? resolve : reject;
							r.res = res;
							queue[index] = r;
						});
					}
				}
			}

			return GET.apply(this, arguments).then(t("resolve"), t("reject"));
		}
	};

	window.http = http;
	window.http.fileUpload = fileUpload;
	return http;
});
