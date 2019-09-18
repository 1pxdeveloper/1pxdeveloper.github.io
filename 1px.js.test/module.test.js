const $module = (function() {
	
	class Register {
		constructor() {
			this.callbacks = [];
		}
		
		define(value) {
			if (this.closed) return false;
			this.value = value;
			
			if (!this.callbacks) return false;
			
			for (const callback of this.callbacks) {
				if (this.closed) return false;
				callback(this.value);
			}
			delete this.callbacks;
		}
		
		whenDefined(callback) {
			if (this.closed) return false;
			this.callbacks ? this.callbacks.push(callback) : callback(this.value);
		}
		
		close() {
			delete this.value;
			delete this.callbacks;
			this.closed = true;
		}
	}
	
	class Registry {
		constructor() {
			this.values = Object.create(null);
		}
		
		define(name, value) {
			(this.values[name] = this.values[name] || new Register()).define(value);
		}
		
		whenDefined(name, callback) {
			(this.values[name] = this.values[name] || new Register()).whenDefined(callback);
		}
		
		close(name) {
			this.values[name] && this.values[name].close();
		}
	}
	
	const $value = new Registry();
	const $factory = new Registry();
	
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
	
	function value(name, value) {
		$factory.define(name, () => value);
	}
	
	function factory(name, callback) {
		callback = _makeInjectable(callback);
		$factory.define(name, callback);
	}
	
	function require(callback, resolve = noop) {
		callback = _makeInjectable(callback);
		
		let length = callback.$inject.length;
		if (length === 0) return resolve(callback.apply(null));
		
		const args = Array(length);
		
		for (const [index, name] of callback.$inject.entries()) {
			$factory.whenDefined(name, block => {
				$factory.close(name);
				require(block, value => $value.define(name, value));
			});
			
			$value.whenDefined(name, value => {
				args[index] = value;
				--length <= 0 && resolve(callback.apply(null, args))
			});
		}
	}
	
	return {value, factory, require};
	
})();

window.$module = $module;