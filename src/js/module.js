(function() {

	function Registry(value) {
		this.value = value || Object.create(null);
		this.queue = Object.create(null);
	}

	Registry.prototype = {
		isDefined(name) {
			return name in this.value;
		},

		whenDefined(name, callback) {
			if (this.isDefined(name)) {
				return callback(this.value[name]);
			}

			this.queue[name] = this.queue[name] || [];
			this.queue[name].push(callback);
		},

		define(name, value) {
			if (this.isDefined(name)) {
				throw new TypeError(name + " is already defined.");
			}

			this.value[name] = value;

			if (this.queue[name]) {
				let q = this.queue[name].slice();
				delete this.queue[name];
				q.forEach(callback => callback(value));
			}
		}
	};


	let $value = Object.create(null);
	let $factory = Object.create(null);
	let $registry_of_value = new Registry($value);
	let $registry_of_factory = new Registry($factory);


	function value(name, value) {
		$registry_of_value.define(name, value);
	}

	function makeFactory(factoryFn) {
		if (!factoryFn.$inject) {
			let str = String(factoryFn);
			str = str.slice(str.indexOf("(") + 1, str.indexOf(")")).trim();
			factoryFn.$inject = str ? str.split(/\s*,\s*/) : [];
		}

		return factoryFn;
	}

	function factory(name, factoryFn) {
		$registry_of_factory.define(name, makeFactory(factoryFn));
	}

	function makeArray(arr) {
		return Array.isArray(arr) ? arr : [arr];
	}

	function require(names, callback) {
		names = makeArray(names);
		if (names.length === 0) {
			return callback();
		}

		let count = 0;
		let args = [];
		let length = names.length;

		let ret;

		names.forEach((name, index) => {

			invokeFactory(name);

			$registry_of_value.whenDefined(name, value => {
				count++;
				args[index] = value;

				// console.log("!!!!!!!!!", value, count);

				if (count === length) {
					ret = args;
					callback.apply(null, args);
				}
			});
		});

		return ret;
	}


	function invokeFactory(name) {
		if ($registry_of_value.isDefined(name)) return;

		$registry_of_factory.whenDefined(name, factory => {

			require(factory.$inject, function() {

				/// test용
				factory.invokeCount = factory.invokeCount || 0;
				factory.invokeCount++;

				$registry_of_value.define(name, factory.apply(null, arguments));
			});
		});
	}


	function createPrefixModule(prefix) {

		let ret = function(name, value) {
			return factory(prefix + name, value);
		};

		ret.value = function(name, value) {
			return value(prefix + name, value);
		};

		ret.require = function(names, callback) {
			names = makeArray(names).map(name => prefix + name);
			return require(names, callback);
		};

		return ret;
	}


	let $module = {value, factory, require};
	$module.directive = createPrefixModule("directive.");
	$module.component = createPrefixModule("component.");
	$module.service = createPrefixModule("service.");
	$module.pipe = createPrefixModule("pipe.");


	window.$module = $module;

	/// 테스트 용
	$module.$value = $value;
	$module.$factory = $factory;

})();


