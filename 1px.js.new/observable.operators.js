(function() {
	"use strict";
	
	const {Observable} = require("observable");
	
	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const noop = () => {};
	const just = _ => _;
	
	const pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
	
	const lift = (callback) => (observable) => new Observable(observer => {
		const o = callback(observer) || {};
		const s = observable.subscribe(Object.setPrototypeOf(o, observer));
		return () => {
			s.unsubscribe();
			o.finalize && o.finalize();
		}
	});
	
	const filterCallback = (callback) => {
		if (Object(callback) !== callback) return _.is(callback);
		if (typeof callback === "function") return callback;
		
		return (object) => {
			for (let [key, _callback] of Object.entries(callback)) {
				if (typeof _callback !== "function") _callback = _.is(_callback);
				if (_callback(object[key])) return true;
			}
			return false;
		}
	};
	
	const mapCallback = (callback) => {
		if (Object(callback) !== callback) return callback;
		if (typeof callback === "function") return callback;
		
		return (object) => {
			object = {...object};
			for (let [key, _callback] of Object.entries(callback)) {
				if (typeof _callback !== "function") object[key] = _callback;
				else object[key] = _callback(object[key]);
			}
			
			return object;
		}
	};
	
	
	Observable.prototype.pipe = function(...operators) { return pipe(...operators)(this) };
	Observable.prototype.lift = function(callback) { return lift(callback)(this) };
	
	
	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const map = (callback) => lift((observer, index = 0) => ({
		next(value) { observer.next(mapCallback(callback)(value, index++)) }
	}));
	
	const mapTo = (value) => lift(observer => ({
		next() { observer.next(value) }
	}));
	
	const filter = (callback) => lift((observer, index = 0) => ({
		next(value) { if (filterCallback(callback)(value, index++)) observer.next(value) }
	}));
	
	const scan = (accumulator, seed) => lift((observer, ret = seed) => ({
		next(value) {
			observer.next((ret = accumulator(ret, value)));
		}
	}));
	
	const reject = (callback) => filter((...args) => !filterCallback(callback)(...args));
	
	const tap = (onNext, onError = noop, onComplete = noop) => {
		if (!_.isFunction(onNext)) onNext = noop;
		if (!_.isFunction(onError)) onError = noop;
		if (!_.isFunction(onComplete)) onComplete = noop;
		
		return lift((observer, index = 0) => ({
			next(value) {
				onNext(value, index++);
				observer.next(value)
			},
			
			error(error) {
				onError(error);
				observer.error(error);
			},
			
			complete() {
				onComplete();
				observer.complete();
			}
		}));
	};
	
	const take = (num) => lift((observer, count = num) => ({
		start() {
			if (count <= 0) observer.complete()
		},
		
		next(value) {
			observer.next(value);
			if (--count <= 0) observer.complete();
		}
	}));
	
	const takeLast = (num = 1) => lift((observer, res = []) => ({
		next(value) {
			res.push(value);
			res = res.slice(-num);
		},
		
		complete() {
			observer.next(res);
			observer.complete();
		}
	}));
	
	const finalize = (finalize) => lift(() => ({finalize}));
	
	const initialize = (initialize) => (observable) => new Observable(observer => {
		
		const o = Object.setPrototypeOf({
			next(value) {
				initialize(value);
				observer.next(value);
				delete o.next;
			}
		}, observer);
		
		return observable.subscribe(o);
	});
	
	
	const count = () => lift((observer, count = 0) => ({
		next() { count++ },
		complete() { observer.next(count) }
	}));
	
	const startWith = (value) => (observable) => Observable.of(value).concat(observable);
	
	const skip = (count) => (observable) => observable.filter((value, index) => index >= count);
	
	const last = () => lift((observer, ret) => ({
		next(value) {ret = value},
		complete() {
			observer.next(ret);
			observer.complete();
		}
	}));
	
	
	const catchError = (callback) => (observable) => {
		const caught = observable.lift(o => ({
			error: noop
		}));
		
		let okay = false;
		return observable.lift((observer) => ({
			next(value) {
				okay = true;
				observer.next(value);
			},
			
			error(error) {
				// if (okay) return observer.error(error);
				const o$ = callback(error, caught) || Observable.EMPTY; /// @FIXME:.. Observable.async 이런거 해야되나??
				o$.subscribe(observer);
			}
		}));
	};
	
	
	const distinctUntilChanged = (compare = Object.is) => lift((observer, lastValue, index = 0) => ({
		next(value) {
			if (index++ === 0) return observer.next(value);
			if (!compare(lastValue, value)) observer.next(value);
			lastValue = value;
		}
	}));
	
	
	const delay = (timeout) => lift((observer, id, completed = false) => ({
		next(value) {
			id = setTimeout(() => {
				observer.next(value);
				if (completed) observer.complete();
			}, timeout);
		},
		
		complete() {
			completed = true;
		},
		
		finalize() {
			clearTimeout(id);
		}
	}));
	
	
	const duration = (timeout) => lift((observer, id, queue = [], completed = false) => ({
		next(value) {
			if (!id) {
				observer.next(value);
			}
			else {
				queue.push(value);
			}
			
			id = setTimeout(() => {
				if (queue.length) {
					observer.next(queue.shift());
				}
				if (completed) observer.complete();
			}, timeout);
		},
		
		complete() {
			completed = true;
		},
		
		finalize() {
			clearTimeout(id);
		}
	}));
	
	
	const timeout = (timeout) => lift((observer, id) => ({
		start() {
			clearTimeout(id);
			id = setTimeout(() => {
				observer.error();/// @TODO: 여기에 뭘 보내야 할까??
			}, timeout);
		},
		
		next(value) {
			observer.next(value);
			
			clearTimeout(id);
			id = setTimeout(() => {
				observer.error();/// @TODO: 여기에 뭘 보내야 할까??
			}, timeout);
		},
		
		finalize() {
			clearTimeout(id);
		}
	}));
	
	
	const timeoutFirstOnly = (timeout) => lift((observer, id) => ({
		start() {
			clearTimeout(id);
			id = setTimeout(() => {
				observer.error();/// @TODO: 여기에 뭘 보내야 할까??
			}, timeout);
		},
		
		next(value) {
			observer.next(value);
			clearTimeout(id);
		},
		
		finalize() {
			clearTimeout(id);
		}
	}));
	
	
	const trace = (...tag) => lift(observer => ({
		start() {
			// console.group(tag);
			// console.groupEnd();
		},
		
		next(value) {
			console.log(...tag, value);
			observer.next(value);
		},
		
		error(error) {
			console.error(...tag, error);
			observer.error(error);
		}
		
		// complete() {
		// 	console.log(...tag, "completed!");
		// 	observer.complete();
		// },
		
		// finalize() {
		// 	// console.groupEnd();
		// }
	}));
	
	
	const throttle = (callback) => lift((observer, pending = false) => ({
		
		next(value) {
			if (!pending) {
				observer.next(value);
			}
			
			pending = true;
			callback(value).subscribe({
				complete() {
					pending = false;
				}
			})
		}
	}));
	
	const throttleTime = (duration) => throttle(() => Observable.timeout(duration));
	
	const withLatestFrom = (other) => (observable) => {
		
		let s;
		let value2 = null;
		let emitted = false;
		
		return observable.lift(observer => ({
			start() {
				s = other.subscribe({
					next(value) {
						emitted = true;
						value2 = value;
					},
					error: observer.error.bind(observer)
				});
			},
			
			next(value) {
				if (!emitted) return;
				observer.next([value, value2]);
			},
			
			finalize() {
				if (s) s.unsubscribe();
			}
		}));
	};
	
	const takeUntil = (notifier) => (observable) => {
		return new Observable(observer => {
			const complete = observer.complete.bind(observer);
			const s = observable.subscribe(observer);
			const s2 = notifier.subscribe(complete, complete, complete);
			
			return () => {
				s.unsubscribe();
				s2.unsubscribe();
			}
		});
	};
	
	const until = (notifier) => (observable) => {
		return new Observable(observer => {
			const s = observable.subscribe(observer);
			const unsubscribe = () => s.unsubscribe();
			const s2 = notifier.subscribe(unsubscribe, unsubscribe, unsubscribe);
			
			return () => {
				s.unsubscribe();
				s2.unsubscribe();
			}
		});
	};
	
	
	Observable.prototype.concat = function(observable) {
		return new Observable(observer => {
			let s1, s2, _value;
			let completed = false;
			
			const next = value => (_value = observer.next(value) || value);
			const error = observer.error.bind(observer);
			const complete = () => completed = true;
			const nextObserver = typeof observable === "function"
				? () => s2 = completed && Observable.defer(observable.bind(null, _value)).subscribe(observer)
				: () => s2 = completed && observable.subscribe(observer);
			
			s1 = this.finalize(nextObserver).subscribe(next, error, complete);
			
			return () => {
				s1.unsubscribe();
				s2 && s2.unsubscribe();
			}
		})
	};
	
	
	Observable.prototype.mergeAll = function() {
		return this.lift((observer, ret = []) => ({
			next(value) { ret.push(value) },
			complete() { observer.next(ret) }
		}));
	};
	
	
	/// @TODO: inclusive
	Observable.prototype.takeWhile = function(callback = just, inclusive) {
		return this.lift((observer, index = 0) => ({
			next(value) {
				Observable.castAsync(callback(value, index++)).subscribe(cond => {
					observer.next(value);
					if (!cond) observer.complete();
				});
			}
		}));
	};
	
	Observable.prototype.toPromise = function() {
		return new Promise((resolve, reject) => {
			let _value;
			let s;
			
			s = this.subscribe({
				next(value) {
					_value = value;
				},
				
				error(error) {
					if (s && s.closed) return;
					reject(error);
				},
				
				complete() {
					if (s && s.closed) return;
					resolve(_value);
				}
			})
		});
	};
	
	
	Observable.prototype.share = function() {
		let subscription, observers = [];
		
		return new Observable(observer => {
			observers.push(observer);
			
			subscription = subscription || this.subscribe({
				next(value) { for (const observer of observers) observer.next(value) },
				error(error) { for (const observer of observers) observer.error(error) },
				complete() { for (const observer of observers) observer.complete() }
			});
			
			return function() {
				observers = observers.filter(o => o !== observer);
				
				if (observers.length === 0) {
					subscription.unsubscribe();
					subscription = null;
				}
			}
		});
	};
	
	
	Observable.prototype.shareReplay = function(bufferSize = Infinity) {
		let observers = [];
		let subscription;
		let buffer = [];
		
		return new Observable(observer => {
			if (subscription) {
				for (const value of buffer) {
					observer.next(value);
				}
				
				if (subscription.closed) {
					observer.complete();
					return;
				}
			}
			
			observers.push(observer);
			
			subscription = subscription || this.subscribe({
				next(value) {
					for (const observer of observers) observer.next(value);
					buffer.push(value);
					buffer = buffer.slice(-bufferSize);
				},
				
				error(error) {
					for (const observer of observers) observer.error(error);
				},
				
				complete() {
					for (const observer of observers) observer.complete();
				}
			});
			
			return function() {
				observers = observers.filter(o => o !== observer);
				
				if (observers.length === 0) {
					subscription.unsubscribe();
					// subscription = null;
				}
			}
		});
	};
	
	
	/// -------------------------------------------------------------------------------------------
	/// Utils
	/// -------------------------------------------------------------------------------------------
	Observable.prototype.retry = function(count = Infinity, error) {
		if (count <= 0) {
			return Observable.throw(error);
		}
		
		return new Observable(observer => {
			let s1, s2;
			
			s1 = this.subscribe(Object.setPrototypeOf({
				error: (err) => {
					s1.unsubscribe();
					s2 = this.retry(--count, err).subscribe(observer);
				}
			}, observer));
			
			return () => {
				s1.unsubscribe();
				s2 && s2.unsubscribe();
			};
		})
	};
	
	
	/// -------------------------------------------------------------------------------------------
	/// Flatten Map Functions
	/// -------------------------------------------------------------------------------------------
	Observable.prototype.mergeMap = Observable.prototype.flatMap = function(callback) {
		return this.lift((observer) => {
			let completed = false;
			const subscriptions = [];
			const complete = () => completed && subscriptions.every(s => s.closed) && observer.complete();
			
			return {
				next(value) {
					value = callback(value);
					subscriptions.push(value.subscribe(Object.setPrototypeOf({complete}, observer)))
				},
				
				complete() {
					completed = true;
					complete();
				},
				
				finalize() {
					for (const subscription of subscriptions) subscription.unsubscribe();
				}
			}
		});
	};
	
	Observable.prototype.switchMap = function(callback) {
		return this.lift(observer => {
			let completed = false;
			let subscription;
			const complete = () => completed && subscription.closed && observer.complete();
			
			return {
				next(value) {
					if (subscription) subscription.unsubscribe();
					const observable = callback(value);
					subscription = observable.subscribe(Object.setPrototypeOf({complete}, observer));
				},
				
				complete() {
					completed = true;
					// complete();
				},
				
				finalize() {
					if (subscription) subscription.unsubscribe();
				}
			}
		});
	};
	
	
	Observable.prototype.connectMap = function(callback) {
		return this.lift(observer => {
			let subscription;
			
			return {
				next(value) {
					if (subscription) subscription.unsubscribe();
					const observable = Observable.castAsync(callback(value));
					subscription = observable.subscribe(observer);
				},
				
				complete() {},
				
				finalize() {
					if (subscription) subscription.unsubscribe();
				}
			}
		});
	};
	
	
	Observable.prototype.exhaustMap = function(callback) {
		return this.lift(_observer => {
			
			let outer_completed = false;
			let inner_subscription;
			
			const observer = Object.setPrototypeOf({
				complete() {
					// console.log('exhaustMap inner complete.');
					
					if (outer_completed) {
						inner_subscription && inner_subscription.unsubscribe();
						_observer.complete();
					}
				}
			}, _observer);
			
			
			return {
				next(value) {
					// console.log("[exhaustMap] next", value, inner_subscription, observer);
					
					if (inner_subscription && !inner_subscription.closed) return;
					
					const inner_observable = Observable.fromAsync(callback(value));
					inner_subscription = inner_observable.subscribe(observer);
				},
				
				error(error) {
					// console.log("[exhaustMap] error");
					
					outer_completed = true;
					_observer.error(error);
				},
				
				complete() {
					// console.log("[exhaustMap] complete");
					
					outer_completed = true;
					
					if (inner_subscription && !inner_subscription.closed) return;
					_observer.complete();
				},
				
				finalize() {
					// console.log("[exhaustMap] finalize");
					
					inner_subscription && inner_subscription.unsubscribe();
				}
			}
		});
	};
	
	
	Observable.prototype.concatMap = function(callback = just) {
		
		return this.lift(observer => {
			
			const queue = [];
			
			let allSourceCompleted = false;
			let running = false;
			let subscription;
			
			function doQueue() {
				if (queue.length === 0) {
					if (allSourceCompleted) {
						observer.complete();
					}
					return;
				}
				
				if (running) return;
				running = true;
				
				const value = queue.shift();
				const observable = Observable.castAsync(callback(value));
				
				let completed = false;
				const o = Object.setPrototypeOf({
					complete: () => {
						completed = true;
					}
				}, observer);
				
				subscription = observable.finalize(() => {
					if (completed) {
						running = false;
						doQueue();
					}
					
				}).subscribe(o);
			}
			
			return {
				next(value) {
					queue.push(value);
					doQueue();
				},
				
				complete() {
					allSourceCompleted = true;
				},
				
				finalize() {
					queue.splice(0, 0);
					if (subscription) subscription.unsubscribe();
				}
			}
		})
	};
	
	
	/// -------------------------------------------------------------------------------------------
	/// Static Operators
	/// -------------------------------------------------------------------------------------------
	Observable.never = () => new Observable(noop);
	Observable.empty = () => new Observable(observer => observer.complete());
	
	Observable.NEVER = Observable.never();
	Observable.EMPTY = Observable.empty();
	
	
	/// -------------------------------------------------------------------------------------------
	/// Creation
	/// -------------------------------------------------------------------------------------------
	Observable.defer = function(callback, thisObj, ...args) {
		return new Observable(observer => {
			return Observable.castAsync(Function.prototype.apply.call(callback, thisObj, args)).subscribe(observer);
		});
	};
	
	Observable.timeout = function(timeout, value) {
		return new Observable((observer, id) => {
			id = setTimeout(() => {
				observer.next(value);
				observer.complete();
			}, timeout);
			
			return () => clearTimeout(id);
		});
	};
	
	Observable.interval = function(timeout) {
		return new Observable((observer, i = 0, id) => {
			id = setInterval(() => observer.next(i++), timeout);
			return () => clearInterval(id);
		});
	};
	
	Observable.fromPromise = function(promise) {
		return new Observable(observer => {
			promise.then(
				res => {
					observer.next(res);
					observer.complete();
				},
				
				err => observer.error(err)
			)
		});
	};
	
	Observable.fromEvent = function(el, type, useCapture) {
		return new Observable(observer => {
			const handler = observer.next.bind(observer);
			el.addEventListener(type, handler, useCapture);
			return () => el.removeEventListener(type, handler, useCapture);
		}).share();
	};
	
	Observable.throw = (error) => new Observable(observer => observer.error(error));
	
	
	/// -------------------------------------------------------------------------------------------
	/// Utils
	/// -------------------------------------------------------------------------------------------
	// @FIXME: 내가 만든거
	Observable.fromAsync = Observable.castAsync = function(value) {
		if (value instanceof Observable) {
			return value;
		}
		
		if (value instanceof Promise) {
			return Observable.fromPromise(value);
		}
		
		return Observable.of(value);
	};
	
	
	/// -------------------------------------------------------------------------------------------
	/// Combination
	/// -------------------------------------------------------------------------------------------
	Observable.forkjoin = function(...observables) {
		return new Observable(observer => {
			let ret = new Array(observables.length);
			let count = 0;
			
			if (ret.length === 0) {
				observer.next(ret);
				observer.complete();
				return;
			}
			
			observables.forEach((observable, index) => {
				observable.last().subscribe(value => {
					ret[index] = value;
					if (++count === ret.length) {
						observer.next(ret);
						observer.complete();
					}
				});
			})
		})
	};
	
	Observable.concat = function(...observables) {
		let [observable, ...rest] = observables;
		
		for (const o of rest) {
			observable = observable.concat(o);
		}
		return observable;
	};
	
	Observable.zip = function(...observables) {
		return new Observable(observer => {
			const stack = new Array(observables.length).fill(null).map(() => []);
			const subscriptions = observables.map((observable, index) => {
				
				return observable.subscribe(value => {
					stack[index].push(value);
					// console.log(JSON.stringify(stack), index);
					
					if (stack.every(v => v.length > 0)) {
						const ret = [];
						stack.forEach(v => ret.push(v.shift()));
						observer.next(ret);
					}
				});
			});
			
			return function() {
				for (const s of subscriptions) s.unsubscribe();
			}
		});
	};
	
	
	Observable.merge = function(...observables) {
		return new Observable(observer => {
			const length = observables.length;
			let count = 0;
			
			const o = Object.setPrototypeOf({
				complete() {
					if (++count === length) {
						observer.complete();
					}
				}
			}, observer);
			
			const subscriptions = observables.map(observable => observable.subscribe(o));
			return function() {
				for (const s of subscriptions) s.unsubscribe();
			}
		});
	};
	
	
	Observable.combine = (...observables) => new Observable(observer => {
		const arr = Array(observables.length);
		if (!arr.length) {
			observer.next([]);
			observer.complete();
			return;
		}
		
		const combine = (observable, index) => observable.subscribe({
			next(value) {
				arr[index] = value;
				
				let count = 0;
				arr.forEach(() => count++);
				
				if (count === arr.length) {
					observer.next(arr);
				}
			},
			
			error(error) {
				observer.error(error);
			},
			
			complete() {
			
			}
		});
		
		const subscriptions = observables.map(combine);
		
		return function() {
			for (const s of subscriptions) s.unsubscribe();
		}
	});
	
	
	Observable.combineAnyway = function(...observables) {
		return new Observable(observer => {
			let arr = Array(observables.length);
			
			if (!arr.length) {
				observer.next([]);
				observer.complete();
				return;
			}
			
			for (let i = 0; i < arr.length; i++) {
				arr[i] = undefined;
			}
			
			const combine = (observable, index) => observable.subscribe({
				next(value) {
					arr[index] = value;
					observer.next(arr);
				},
				
				error(error) {
					observer.error(error);
				},
				
				complete() {
				
				}
			});
			
			const subscriptions = observables.map(combine);
			
			return function() {
				for (const s of subscriptions) s.unsubscribe();
			}
		});
	};
	
	
	Observable.reducer = function(...reducers) {
		
		return new Observable(_observer => {
			let value;
			
			const observer = Object.setPrototypeOf({
				next(_value) {
					value = _value;
					_observer.next(value);
				}
			}, _observer);
			
			
			const subscriptions = [];
			
			for (const reducer of reducers) {
				
				if (reducer instanceof Observable) {
					const subscription = reducer.subscribe(payload => {
						
						if (payload instanceof Observable) {
							payload.subscribe(observer);
							return;
						}
						
						if (typeof payload === "function") {
							payload = payload(value);
						}
						
						observer.next(payload);
					});
					
					subscriptions.push(subscription);
					continue;
				}
				
				observer.next(reducer);
			}
			
			return () => {
				for (const s of subscriptions) s.unsubscribe();
			}
			
		}).shareReplay(1);
	};
	
	Observable.computed = function(...observables) {
		const callback = observables.pop();
		return Observable.combine(...observables).map(args => callback.apply(null, args)).shareReplay(1);
	};
	
	const bindAction = (action) => lift((observer, _value) => ({
		start() {
		
		},
		
		next(value) {
			_value = value;
			observer.next(value);
		},
		
		error(error) {
			if (typeof action.FAILURE === "function") {
				action.FAILURE(error);
				return;
			}
			
			observer.error(error);
		},
		
		complete() {
			if (typeof action.SUCCESS === "function") {
				action.SUCCESS(_value);
			}
			
			observer.complete();
		}
	}));
	
	/// 임시 Operators
	Observable.operators = {};
	for (const method of Object.getOwnPropertyNames(Observable.prototype)) {
		Observable.operators[method] = (...args) => (observable) => observable[method](...args);
	}
	
	Object.assign(Observable.operators, {
		bindAction,
		catch: catchError,
		catchError,
		count,
		delay,
		distinctUntilChanged,
		duration,
		filter,
		finalize,
		initialize,
		last,
		map,
		mapTo,
		reject,
		scan,
		skip,
		startWith,
		tap,
		take,
		takeLast,
		takeUntil,
		timeout,
		timeoutFirstOnly,
		throttle,
		throttleTime,
		trace,
		withLatestFrom,
		until
	});
	
	for (const [key, value] of Object.entries(Observable.operators)) {
		if (!Observable.prototype[key]) {
			Observable.prototype[key] = function(...args) { return value(...args)(this) }
		}
	}
	
})();