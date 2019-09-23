(function() {
	"use strict";

	const {Observable} = require();

	/// WATCH
	const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
	const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

	function mutationObservableFromClass$(object, methods) {
		const key = methods[0];
		let observable$ = object[key].observable$;

		return observable$ = observable$ || new Observable(observer => {
			const prototype = Object.getPrototypeOf(object);
			const wrap = Object.create(prototype);
			Object.setPrototypeOf(object, wrap);

			for (const method of methods) {
				wrap[method] = function() {
					const result = prototype[method].apply(this, arguments);
					observer.next(this);
					observer.complete();
					return result;
				}
			}
			wrap[key].observable$ = observable$;

			return () => {
				delete wrap[key].observable$;
				Object.setPrototypeOf(object, prototype);
			}

		}).share();
	}


	function mutationObservable$(object) {
		if (Array.isArray(object)) return mutationObservableFromClass$(object, ARRAY_METHODS);
		if (object instanceof Date) return mutationObservableFromClass$(object, DATE_METHODS);
		return Observable.NEVER;
	}

	function watch$$(object, prop) {

		if (Object(object) !== object) {
			return Observable.NEVER;
		}

		if (Array.isArray(object) && +prop === prop) {
			return Observable.NEVER;
		}

		const desc = Object.getOwnPropertyDescriptor(object, prop);
		if (desc) {
			if (desc.set && desc.set.observable$) {
				return desc.set.observable$;
			}

			if (desc.configurable === false || desc.writable === false) {
				return mutationObservable$(object[prop]);
			}
		}

		let observable$ = new Observable(observer => {

			const desc = Object.getOwnPropertyDescriptor(object, prop);
			if (desc && desc.set && desc.set.observable$) {
				return desc.set.observable$.subscribe(observer);
			}

			let value = object[prop];
			const subscription = mutationObservable$(value).subscribe(observer);

			function set(newValue) {
				if (Object.is(value, newValue)) {
					return;
				}
				value = newValue;
				observer.next(value);
				observer.complete();
			}

			set.observable$ = observable$;

			Object.defineProperty(object, prop, {
				enumerable: true,
				configurable: true,
				get: () => value,
				set: set,
			});

			return () => {
				subscription.unsubscribe();
				delete set.observable$;
				delete object[prop];
				object[prop] = value;
			}

		}).share();

		return observable$;
	}

	exports.watch$$ = watch$$;
}());