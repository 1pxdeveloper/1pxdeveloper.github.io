(function() {
	"use strict";

	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..

	const {$module} = require("./1px.module");
	const {Observable, Subject, AsyncSubject, BehaviorSubject} = require("./observable");
	const {WebComponent} = require("./component");
	const {JSContext, $compile, traverseDOM} = require("./compile");


	function DOMReady(callback) {
		if (document.body) return callback();
		window.addEventListener("DOMContentLoaded", callback);
	}


	window.Observable = Observable;
	window.mimosa = window.$module = $module;

	$module.value("Observable", Observable);
	$module.value("Subject", Subject);
	$module.value("AsyncSubject", AsyncSubject);
	$module.value("BehaviorSubject", BehaviorSubject);

	$module.value("WebComponent", WebComponent);
	$module.value("traverseDOM", traverseDOM);


	let componentsList = [];

	$module.component = function(name, block) {
		if (!name) {
			throw TypeError("name must be string.")
		}

		let tagName = name.toUpperCase();
		block = $module._makeInjectable(block);

		function preload() {
			WebComponent.template.tagName = tagName;
			let ret = block.apply(null, arguments);
			delete WebComponent.template.tagName;
			return ret;
		}

		preload.$inject = block.$inject;


		$module.require(preload, component => {
			// console.log(component);
			component = component || class extends WebComponent {};

			component.template = WebComponent.template.lastTemplate;
			delete WebComponent.template.lastTemplate;

			$module.value(tagName, component);
			componentsList.push({name, component});
		});
	};


	/// 이건 너무 별론데...

	$module.value("JSContext", JSContext);
	$module.compile = $compile;

	$module.controller = function(name, block) {
		$module.factory(name, block);
	};


	let bootstraped = false;
	$module.bootstrap = function() {
		if (bootstraped) return;
		bootstraped = true;

		traverseDOM(document.body, node => {
			if (node.nodeType !== 1) return false;

			/// component tag or *[is]
			// if (node.hasAttribute("is") || $module.get(node.tagName)) {

			if (node.hasAttribute("is")) {
				console.warn(node.tagName);
				$compile(node, null);
				return false;
			}
		});

		componentsList.forEach(({name, component}) => {
			window.customElements.define(name, component)
		});
	};

	/// BootStrap
	DOMReady($module.bootstrap);


})();