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

_.noop = () => {};
_.pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
_.itself = _.always = (a) => () => a;


/// Array
_.map = (callback) => (a) => a.map(mapCallback(callback));
_.filter = (callback) => (a) => a.filter(filterCallback(callback));
_.remove = _.reject = (callback) => (a) => a.filter((...args) => !callback(...args));
_.removeItem = (item) => _.remove(_.is(item));
_.every = (callback) => (a) => a.every(filterCallback(callback));
_.some = (callback) => (a) => a.some(filterCallback(callback));
_.append = _.push = (...items) => (array) => [...array, ...items];
_.prepend = _.unshift = (...items) => (array) => [...items, ...array];
_.patch = (a, b) => _.map(item => item !== a ? item : ({...item, ...b}));
_.patchAll = (a) => _.map(item => ({...item, ...a}));
_.slice = (start, end) => (a) => a.slice(start, end);

/// Object
_.merge = (object) => (source) => ({...source, ...object});

/// Common
_.not = (callback) => (...args) => !callback(...args);
_.is = (a) => (b) => Object.is(a, b);
_.isnot = (a) => (b) => !Object.is(a, b);
_.isNumber = (a) => +a === a;
_.isString = (a) => typeof a === "string";
_.isFunction = (a) => typeof a === "function";
_.isArray = (a) => Array.isArray(a);
_.isStringLike = (a) => _.isString(a) || _.isNumber(a);
_.hasLength = (a) => a.length && a.length > 0;

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
_.log = (...args) => console.log.bind(console, ...args);


/// localStorage
_.localStorage = {};
_.localStorage.getItem = (key, defaults) => JSON.parse(localStorage.getItem(key)) || defaults;
_.localStorage.setItem = (key) => (value) => localStorage.setItem(key, JSON.stringify(value));


_.alert = (...args) => window.alert(...args);