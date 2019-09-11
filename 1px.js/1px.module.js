(function() {
	"use strict";
	
	const {Observable, AsyncSubject} = require("./observable");
	
	function noop() {}
	
	function _makeInjectable(callback) {
		if (Array.isArray(callback)) {
			const array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}
		
		if (typeof callback !== "function") {
			throw TypeError("factory must be array or function.");
		}
		
		if (!callback.$inject) {
			const string = callback.toString();
			callback.$inject = string.slice(string.indexOf("(") + 1, string.indexOf(")")).split(/\s*,\s*/).filter(x => x);
		}
		
		return callback;
	}
	
	function _makePrefixModuleProvider($module, prefix) {
		function factory(name, callback) {
			$module.factory(prefix + name, callback);
		}
		
		factory.value = function(name, value) {
			$module.value(prefix + name, value);
		};
		
		factory.require = function(callback, resolve) {
			callback = _makeInjectable(callback);
			callback.$inject = callback.$inject.map(name => prefix + name);
			$module.require(callback, resolve);
		};
		
		return factory;
	}
	
	
	function createModule() {
		const values = Object.create(null);
		
		function get(name) {
			return values[name] && values[name].value;
		}
		
		function value(name, _value) {
			const subject = values[name] || (values[name] = new AsyncSubject());
			if (arguments.length === 1) {
				return subject;
			}
			
			subject.next(_value);
			subject.complete();
		}
		
		function require(callback, resolve = noop) {
			callback = _makeInjectable(callback);
			Observable.forkjoin(...callback.$inject.map(name => value(name))).subscribe(args => {
				resolve(callback.apply(null, args));
			});
		}
		
		function factory(name, callback) {
			require(callback, result => value(name, result));
		}
		
		let $module = {};
		$module.get = get;
		$module.value = value;
		$module.factory = factory;
		$module.require = require;
		
		$module.directive = _makePrefixModuleProvider($module, "directive.");
		$module.service = _makePrefixModuleProvider($module, "service.");
		$module.pipe = _makePrefixModuleProvider($module, "pipe.");
		
		/// @FIXME: for DEBUG
		$module._values = values;
		return $module;
	}

	// @TODO: 1module? or multiple module??
	exports.$module = createModule();
	exports._makeInjectable = _makeInjectable;
})();