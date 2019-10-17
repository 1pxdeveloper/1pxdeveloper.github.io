(function() {
	"use strict";

	const {ReplaySubject} = require();

	const modules$ = new ReplaySubject();

	const makeInjectable = (callback) => {
		if (_.isArray(callback)) {
			const array = callback;
			callback = array[array.length - 1];
			callback.$inject = array.slice(0, -1);
		}

		if (!_.isFunction(callback)) {
			throw TypeError("factory must be array or function.");
		}

		if (!callback.$inject) {
			const s = callback.toString();
			callback.$inject = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/).filter(x => x);
		}

		return callback;
	};


	const inject = callback$ => callback$

		.map(makeInjectable)

		.mergeMap(callback => Observable.combine(Observable.of(callback), Observable.combine(...callback.$inject.map(get))))

		.map(([callback, args]) => _.apply(callback)(args));


	const get = _.memoize1((name) => modules$

		.filter(pair => pair[0] === name)

		.map(([name, callback]) => callback)


		.tap(() => console.group("get", name))

		.pipe(inject)

		// .timeout(1000)

		// .catch(() => ...)

		.tap(() => console.groupEnd())


		.shareReplay(1)
	);


	const $module = {};
	$module.factory = (name, callback) => modules$.next([name, callback]);
	$module.require = (callback, resolve) => Observable.of(callback).pipe(inject).subscribe(resolve);

	// Object.freeze($module);


	exports.$module = $module;
	window.$module = $module;
})();