(function() {
	"use strict";

	const {Observable} = require("observable");
	const {Action, RequestAction} = require("action");
	const {$compile} = require();

	function DOMReady(callback) {
		if (document.body) return callback();
		document.addEventListener("DOMContentLoaded", callback);
	}

	window.Observable = Observable;


	$module.value("Observable", Observable);
	$module.value("Action", Action);
	$module.value("RequestAction", RequestAction);


	// $module.bootstrap = ((bootstrap) => () => {
	// 	$compile(document.body, null);
	// 	bootstrap();
	// })($module.bootstrap);

}());