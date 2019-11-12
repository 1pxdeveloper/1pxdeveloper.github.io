const filterCallback = (callback) => {
	if (typeof callback === "function") return callback;
	return (o) => {
		for (const [key, _callback] of Object.entries(callback)) {
			if (_callback(o[key])) return true;
		}
		return false;
	}
};

const mapCallback = (callback) => {
	if (typeof callback === "function") return callback;
	return (o) => {
		o = {...o};
		for (const [key, _callback] of Object.entries(callback)) {
			o[key] = _callback(o[key]);
		}
		return o;
	}
};


const _ = () => {};

/// Common
_.noop = () => {};
_.identity = (value) => value;
_.pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
_.go = (value, ...pipes) => _.pipe(...pipes)(value);
_.itself = _.always = (value) => () => value;

_.is = (a) => (b) => Object.is(a, b);
_.isnot = (a) => (b) => !Object.is(a, b);
_.isUndefined = (value) => value === undefined;
_.isTrue = (value) => value === true;
_.isFalse = (value) => value === false;
_.isNumber = (value) => +value === value;
_.isBoolean = (value) => typeof value === "boolean";
_.isString = (value) => typeof value === "string";
_.isStringLike = (value) => _.isString(value) || _.isNumber(value);
_.isFunction = (value) => typeof value === "function";
_.isArray = (value) => Array.isArray(value);
_.isArrayLike = (value) => {
	const type = typeof value;
	return "array" === type || "object" === type && "number" === typeof value.length;
};

_.isObject = (value) => Object(value) === value;
_.hasLength = (value) => value.length && value.length > 0;
_.instanceof = (constructor) => (object) => (object instanceof constructor);


/// Array
_.slice = (start, end) => (a) => a.slice(start, end);

_.map = (callback) => (a) => a.map(mapCallback(callback));
_.filter = (callback) => (a) => a.filter(filterCallback(callback));
_.every = (callback) => (a) => a.every(filterCallback(callback));
_.some = (callback) => (a) => a.some(filterCallback(callback));

_.remove = (callback) => _.filter(_.not(callback));
_.removeItem = (item) => _.remove(_.is(item));
_.append = _.push = (...items) => (array) => [...array, ...items];
_.prepend = _.unshift = (...items) => (array) => [...items, ...array];
_.patch = (target, object) => _.map(item => item !== target ? item : ({...item, ...object}));
_.patchAll = (object) => _.map(item => ({...item, ...object}));

_.sort = (callback) => (array) => (array => (array.sort(callback), array))(array.slice());

/// Object
_.merge = (object) => (source) => ({...source, ...object});
_.mapValues = (callback) => (object) => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapCallback(callback)(value)]));

/// Function
_.apply = (func, thisObj) => (args) => Function.prototype.apply.call(func, thisObj, args);
_.not = (func) => (...args) => !func(...args);
_.spread = (callback) => (array) => callback(...array);
_.memoize1 = (func) => {
	const cache = Object.create(null);
	return (key, ...args) => (cache[key] = key in cache ? cache[key] : func(key, ...args));
};


/// Util
_.exist = (value) => value;
_.toType = (obj) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
_.castArray = (a) => _.isArray(a) ? a : [a];
_.with = _.alias = (...args) => (callback) => callback(...args);
_.throw = (error) => () => { throw error; };
_.if = (cond, callback, elseCallback = _.itself) => (value) => cond(value) ? callback(value) : elseCallback(value);
_.cond = (pairs) => (...args) => {
	for (const [predicate, transform] of pairs) {
		if (predicate(...args)) {
			return transform(...args);
		}
	}
};
_.switch = (table) => (id) => table[id]; /// @FIXME:....
_.tap = (callback) => (value) => (callback(value), value);
_.kindOf = (...callbacks) => (value) => callbacks.map(callback => callback(value) ? value : undefined);


/// String
_.capitalize = (string) => string.slice(0, 1).toUpperCase() + string.slice(1)
_.trim = (a) => String(a).trim();
_.split = (...args) => (string) => string.split(...args);
_.splitAt = (index) => (string) => [string.slice(0, index), string.slice(index)];
_.rpartition = (sep) => (string) => {
	const lastIndex = string.lastIndexOf(sep);
	if (lastIndex === -1) return [string, "", ""];
	return [string.slice(0, lastIndex), string.slice(lastIndex, lastIndex + sep.length), string.slice(lastIndex + sep.length)];
};

/// Effect
_.log = (...args) => console.log.bind(console, ...args);
_.warn = (...args) => console.warn.bind(console, ...args);


(function() {
	let $uuid = 0;
	let stack = [];
	let queue = [];

	_.debug = {};

	_.debug.group = (...args) => {
		console.group(...args);
		stack.push($uuid);
		return $uuid++;
	};

	_.debug.groupEnd = (uuid = ($uuid - 1)) => {
		if (stack[stack.length - 1] !== uuid) {
			queue.push(uuid);
			stack.pop();
			return;
		}

		console.groupEnd();
		for (const q of queue) {
			console.groupEnd();
		}
		queue = [];
	}
})();


/// localStorage
_.localStorage = {};
_.localStorage.getItem = (key, defaults) => JSON.parse(localStorage.getItem(key)) || defaults;
_.localStorage.setItem = (key) => (value) => localStorage.setItem(key, JSON.stringify(value));


_.alert = (...args) => window.alert(...args);


/// DOM
// _.dispatchEvent = (type) => (el) => (value) => el.dispatchEvent(new CustomEvent(type));

_.rAF = (callback) => {
	const handle = window.requestAnimationFrame(callback);
	return () => {
		window.cancelAnimationFrame(handle);
	}
};


/// _.arrayToTable???
// options = options.reduce((o, option) => {
// 	o[option] = true;
// 	return o;
// }, Object.create(null));

/// traverseDOM

