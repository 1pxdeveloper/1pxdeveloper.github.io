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
_.itself = _.always = (a) => () => a;


/// Array
_.map = (callback) => (a) => a.map(mapCallback(callback));
_.filter = (callback) => (a) => a.filter(filterCallback(callback));
_.remove = _.reject = (callback) => (a) => a.filter((...args) => !callback(...args));
_.removeItem = (item) => _.remove(_.is(item));
_.every = (callback) => (a) => a.every(filterCallback(callback));
_.some = (callback) => (a) => a.some(filterCallback(callback));
_.append = (item) => (array) => [...array, item];
_.prepend = (item) => (array) => [item, ...array];
_.patch = (a, b) => _.map(item => item !== a ? item : ({...item, ...b}));
_.patchAll = (a) => _.map(item => ({...item, ...a}));


/// Object
_.merge = (object) => (source) => ({...source, ...object});

/// Common
_.not = (callback) => (...args) => !callback(...args);
_.is = (a) => (b) => Object.is(a, b);
_.isnot = (a) => (b) => !Object.is(a, b);
_.isString = (a) => typeof a === "string";
_.isStringLike = (a) => typeof a === "string";
_.isFunction = (a) => typeof a === "function";
_.isArray = (a) => Array.isArray(a);
_.hasLength = (a) => a.length && a.length > 0;


/// String
_.trim = (a) => a.trim();
_.log = (...args) => console.log.bind(console, ...args);
