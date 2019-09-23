(function() {
	"use strict";

	const $value = Object.create(null);
	const $factory = Object.create(null);
	const $block = [];

	function noop() {}

	function _makeInjectable(callback) {
		if (Array.isArray(callback)) {
			let array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}

		if (typeof callback !== "function") {
			throw TypeError("factory must be array or function.");
		}

		if (!callback.$inject) {
			let s = callback.toString();
			callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(x => x);
		}

		return callback;
	}

	function _dependencyInjectionOf(name) {
		if (name in $value) {
			return $value[name];
		}

		if (name in $factory) {
			const callback = $factory[name];
			return ($value[name] = callback.apply(null, callback.$inject.map(_dependencyInjectionOf)));
		}

		throw TypeError("[module]" + name + " is not defined.");
	}

	function _makePrefixModuleProvider($module, prefix) {
		function factory(name, callback) {
			$module.factory(prefix + name, callback);
		}

		factory.get = function(name) {
			return $module.get(prefix + name);
		};

		return factory;
	}

	/// -----------------------------------------------------------------------
	/// Public
	/// -----------------------------------------------------------------------
	function get(name) {
		return _dependencyInjectionOf(name);
	}

	function exist(name) {
		return name in $factory;
	}

	function value(name, value) {
		$factory[name] = _makeInjectable(() => value);
	}

	function factory(name, callback) {
		$factory[name] = _makeInjectable(callback);
	}

	function require(callback, resolve = noop) {
		$block.push([_makeInjectable(callback), resolve]);
	}

	function bootstrap() {
		for (const [callback, resolve] of $block) {
			resolve(callback.apply(null, callback.$inject.map(_dependencyInjectionOf)));
		}
	}

	const $module = {get, exist, value, factory, require, bootstrap};

	/// @FIXME:
	$module.directive = _makePrefixModuleProvider($module, "directive.");

	/// @DEBUG
	$module.$value = $value;

	exports.$module = $module;
	exports._makeInjectable = _makeInjectable;

	window.$module = $module;
}());
