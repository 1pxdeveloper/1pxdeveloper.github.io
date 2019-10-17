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
_.pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
_.itself = _.always = (value) => () => value;

_.is = (a) => (b) => Object.is(a, b);
_.isnot = (a) => (b) => !Object.is(a, b);
_.isNumber = (a) => +a === a;
_.isString = (a) => typeof a === "string";
_.isStringLike = (a) => _.isString(a) || _.isNumber(a);
_.isFunction = (a) => typeof a === "function";
_.isArray = (a) => Array.isArray(a);
_.hasLength = (a) => a.length && a.length > 0;
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


/// Object
_.merge = (object) => (source) => ({...source, ...object});


/// Function
_.not = (func) => (...args) => !func(...args);


/// Util
_.castArray = (a) => _.isArray(a) ? a : [a];
_.with = _.alias = (...args) => (callback) => callback(...args);
_.throw = (error) => () => { throw error; };
_.cond = (pairs) => (...args) => {
	for (const [predicate, transform] of pairs) {
		if (predicate(...args)) {
			return transform(...args);
		}
	}
};


/// String
_.trim = (a) => String(a).trim();


/// Effect
_.log = (...args) => console.log.bind(console, ...args);
_.warn = (...args) => console.warn.bind(console, ...args);


/// localStorage
_.localStorage = {};
_.localStorage.getItem = (key, defaults) => JSON.parse(localStorage.getItem(key)) || defaults;
_.localStorage.setItem = (key) => (value) => localStorage.setItem(key, JSON.stringify(value));


_.alert = (...args) => window.alert(...args);


/// DOM
// _.dispatchEvent = (type) => (el) => (value) => el.dispatchEvent(new CustomEvent(type));

_.rAF = window.requestAnimationFrame.bind(window);
_.rAF.cancel = window.cancelAnimationFrame.bind(window);


/// _.arrayToTable???
// options = options.reduce((o, option) => {
// 	o[option] = true;
// 	return o;
// }, Object.create(null));

/// traverseDOM

