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
	
	function watch$$(object, prop) {
		if (Object(object) !== object) {
			return Observable.NEVER;
		}
		
		if (Array.isArray(object) && +prop === prop) {
			return Observable.NEVER;
		}
		
		const desc = Object.getOwnPropertyDescriptor(object, prop);
		if (desc && desc.set && desc.set.observable$) {
			return desc.set.observable$;
		}

		let observable$ = null;
		
		return (observable$ = new Observable(observer => {
			const desc = Object.getOwnPropertyDescriptor(object, prop);
			if (desc && desc.set && desc.set.observable$) {
				return desc.set.observable$.subscribe(observer);
			}
			
			if (!desc && !Object.isExtensible(object)) {
				observer.complete();
				return;
			}
			
			let subscription;
			
			let value = object[prop];

			if (value instanceof Observable && typeof value !== "function") {
				subscription = value.subscribe(observer);
			}
			else {
				subscription = mutationObservable$(value).subscribe(observer);
				if (value !== undefined) {
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
			
			try {
				Object.defineProperty(object, prop, {
					enumerable: true,
					configurable: true,
					get: () => value,
					set: set
				});
			} catch(e) {
			
			}
			
			return () => {
				if (subscription) {
					subscription.unsubscribe();
					subscription = null;
				}
				
				try {
					if (desc && "value" in desc) {
						desc.value = value;
						Object.defineProperty(object, prop, desc);
					}
					else {
						delete object[prop];
						object[prop] = value;
					}
				} catch(e) {
				
				
				}
			}
			
		}).shareReplay(1));
	}
	
	exports.watch$$ = watch$$;
}());