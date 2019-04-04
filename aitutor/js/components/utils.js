$module.value("capitalize", function capitalize(str) {
	str = str || "";
	return str[0].toUpperCase() + str.slice(1);
});


$module.value("$timeout", function $timeout(delay) {
	return new Promise(resolve => {
		setTimeout(resolve, delay);
	})
});


$module.value("jsonp", function jsonp(url, params, fn) {
	return new Promise(resolve => {

		let script = document.createElement("script");
		script.src = url + "?" + encodeURIComponent(JSON.stringify(params));
		window.callback = function(value) {
			resolve(value);
			script.remove();
			delete window.callback;
		};
		document.getElementsByTagName("script")[0].parentNode.appendChild(script);
	})
});

