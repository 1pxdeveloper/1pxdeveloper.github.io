(function() {
	"use strict";

	const {Observable} = require();

	/// WATCH
	const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
	const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

	function mutationObservableFromClass$(object, methods) {
		let observable$;
		const key = methods[0];

		return observable$ = object[key].observable$ || new Observable(observer => {
			const prototype = Object.getPrototypeOf(object);
			const wrap = Object.create(prototype);
			Object.setPrototypeOf(object, wrap);

			for (const method of methods) {
				wrap[method] = function() {
					const result = prototype[method].apply(this, arguments);
					observer.next(this);
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

	const getOwnObservable = (object, prop) => {
		const value = object[prop];

		if (Object(object) !== object) {
			return Observable.of(value);
		}

		if (Array.isArray(object) && +prop === prop) {
			return Observable.of(value);
		}

		if (Object.isFrozen(object)) {
			return Observable.of(value);
		}

		const desc = Object.getOwnPropertyDescriptor(object, prop);

		// desc가 없고 확장불가능이면 SKIP
		if (!desc && !Object.isExtensible(object)) {
			return Observable.EMPTY;
		}

		// 수정불가
		if (desc && desc.configurable === false) {
			return Observable.of(value);
		}

		// 기 생성된 observable
		if (desc && desc.set && desc.set.observable$) {
			return desc.set.observable$;
		}

		// 이미 getter, setter가 있는 경우..
		if (desc && desc.set) {
			/// @TODO:
		}
	};

	function watch$$(object, prop) {

		let observable$ = getOwnObservable(object, prop);
		if (observable$) return observable$;

		return (observable$ = new Observable(observer => {
			const _observable$ = getOwnObservable(object, prop);
			if (_observable$) return _observable$.subscribe(observer);


			const desc = Object.getOwnPropertyDescriptor(object, prop);

			let subscription;
			let value = object[prop];

			if (value instanceof Observable && typeof value !== "function") {
				subscription = value.subscribe(observer);
			}
			else {
				subscription = mutationObservable$(value).subscribe(observer);
				if (prop in object) {
					observer.next(value);
				}
			}

			function set(newValue) {
				if (Object.is(value, newValue)) {
					return;
				}
				value = newValue;

				if (subscription) {
					subscription.unsubscribe();
					subscription = null;
				}

				if (value instanceof Observable && typeof value !== "function") {
					subscription = value.subscribe(observer);
				}
				else {
					subscription = mutationObservable$(value).subscribe(observer);
					observer.next(value);
				}
			}

			set.observable$ = observable$;


			Object.defineProperty(object, prop, {
				configurable: true,
				enumerable: desc && desc.enumerable || true,
				set: set,
				get: () => value,
			});

			return () => {
				if (subscription) {
					subscription.unsubscribe();
					subscription = null;
				}

				if (desc && "value" in desc) {
					desc.value = value;
					Object.defineProperty(object, prop, desc);
				}
				else {
					delete object[prop];
					object[prop] = value;
				}
			}

		}).shareReplay(1));
	}

	exports.watch$$ = watch$$;
}());