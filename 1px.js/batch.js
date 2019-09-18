(function() {
	"use strict";
	
	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..
	
	const {$module, _makeInjectable} = require("./1px.module");
	const {Observable, Subject, AsyncSubject, BehaviorSubject} = require("./observable");
	const {WebComponent} = require("./component");
	const {JSContext, $compile, traverseDOM} = require("./compile");
	
	window.Observable = Observable;
	window.mimosa = window.$module = $module;
	
	$module.value("Observable", Observable);
	$module.value("Subject", Subject);
	$module.value("AsyncSubject", AsyncSubject);
	$module.value("BehaviorSubject", BehaviorSubject);
	$module.value("WebComponent", WebComponent);
	
	$module.value("JSContext", JSContext);
	
	
	/// WebComponent
	let componentRegistry = Object.create(null);
	
	$module.component = function(name, block) {
		console.warn("$module.component", name);
		
		if (typeof name !== "string") {
			throw TypeError("name must be string.")
		}
		
		block = _makeInjectable(block);
		
		function preload() {
			console.warn("preload", name);
			
			WebComponent.template.tagName = name;
			let ret = block.apply(null, arguments);
			delete WebComponent.template.tagName;
			return ret;
		}
		
		preload.$inject = block.$inject;
		
		
		$module.require(preload, component => {
			console.warn("[$module.component] resolved.", name);
			
			component = component || class extends WebComponent {};
			componentRegistry[name] = component;
		});
	};
	
	
	/// 이건 너무 별론데...
	$module.compile = $compile;
	
	$module.controller = function(name, block) {
		$module.factory(name, block);
	};
	
	
	function DOMReady(callback) {
		if (document.body) return callback();
		document.addEventListener("DOMContentLoaded", callback);
	}
	
	let bootstraped = false;
	$module.bootstrap = function() {
		if (bootstraped) return;
		bootstraped = true;
		
		traverseDOM(document.body, node => {
			if (node.nodeType !== 1) return false;
			
			if (node.hasAttribute("inline-template")) {
				let attr = node.getAttributeNode("inline-template");
				attr.template = document.createElement("template");
				attr.template.innerHTML = node.innerHTML;
			}
			
			if (componentRegistry[node.tagName.toLowerCase()]) {
				return false;
			}
			
			if (node.hasAttribute("is")) {
				console.warn(node.tagName);
				$compile(node, null);
				return false;
			}
		});
		
		
		/// Define WebComponent as Custom Element
		for (const [name, component] of Object.entries(componentRegistry)) {
			console.log("window.customElements.define", name);
			window.customElements.define(name, component);
		}
		
		
		/// 정의되지 않은 module 경고
		for (const [name, v] of Object.entries($module._values)) {
			if (!v.closed) {
				console.warn(name + " is not defined.");
			}
		}
	};
	
	/// BootStrap
	DOMReady($module.bootstrap);
})();