(function() {
	"use strict";
	
	const {Observable} = require("observable");
	const {$compile} = require();
	
	function DOMReady(callback) {
		if (document.body) return callback();
		document.addEventListener("DOMContentLoaded", callback);
	}
	
	window.Observable = Observable;
	
	// $module.bootstrap = ((bootstrap) => () => {
	// 	$compile(document.body, null);
	// 	bootstrap();
	// })($module.bootstrap);
	
}());