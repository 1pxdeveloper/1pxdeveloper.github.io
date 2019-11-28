(function() {
	"use strict";
	
	/// @TODO:: 여기는 엔진 코드와 실제 사용 코드간의 인터페이스를 억지로라도 맞춰주는 코드
	/// @TODO: 아직 인터페이스에 대한 확신이 안 듬..
	
	const {$module, makeInjectable} = require("./1px.module");
	const {Observable, Subject, AsyncSubject, BehaviorSubject, ReplaySubject} = require("./observable");
	const {Action, RequestAction, StreamAction} = require("./action");
	const {WebComponent} = require("./component");
	const {JSContext, $compile, traverseDOM} = require("./compile");
	
	window.Observable = Observable;
	
	$module.value("Observable", Observable);
	$module.value("Subject", Subject);
	$module.value("AsyncSubject", AsyncSubject);
	$module.value("BehaviorSubject", BehaviorSubject);
	$module.value("ReplaySubject", ReplaySubject);
	
	$module.value("Action", Action);
	$module.value("RequestAction", RequestAction);
	$module.value("StreamAction", StreamAction);
	
	
	// $module.bootstrap = ((bootstrap) => () => {
	// 	$compile(document.body, null);
	// 	bootstrap();
	// })($module.bootstrap);


	function DOMReady(callback) {
		if (document.body) return callback();
		window.addEventListener("DOMContentLoaded", callback);
	}


	$module.controller = (name, block) => {

		$module.require(block, (Controller) => {

			DOMReady(() => {

				Array.from(document.querySelectorAll(`*[is="${name}"]`)).forEach(el => {


					el.removeAttribute("is");
					const controller = new Controller();
					const context = $compile(el, controller);
					controller.init && controller.init(context);
				});


			})
		})
	};


	$module.bootstrap = _.noop;
}());