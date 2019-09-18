(function() {
	"use strict";
	
	if (!Symbol.observable) {
		Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});
	}
	
	class Observable {
		constructor(subscriber) {
			if (typeof subscriber !== "function") {
				throw new TypeError("Observable initializer must be a function.");
			}
			
			this._subscriber = subscriber;
		}
		
		subscribe(observer, error, complete) {
			if (typeof observer === "function") {
				observer = {next: observer, error, complete};
			}
			else if (typeof observer !== "object") {
				observer = {};
			}
			
			return new Subscription(observer, this._subscriber);
		}
		
		[Symbol.observable]() {
			return this;
		}
		
		static from(x) {
			if (Object(x) !== x) {
				throw new TypeError(x + " is not an object");
			}
			
			const cls = typeof this === "function" ? this : Observable;
			
			// observable
			let method = x[Symbol.observable];
			if (method) {
				let observable = method.call(x);
				
				if (Object(observable) !== observable) {
					throw new TypeError(observable + " is not an object");
				}
				
				if (observable instanceof cls) {
					return observable;
				}
				
				return new cls(observer => observable.subscribe(observer));
			}
			
			
			// iteratorable
			method = x[Symbol.iterator];
			if (!method) {
				throw new TypeError(x + " is not observable");
			}
			
			return new cls(observer => {
				for (const item of method.call(x)) {
					observer.next(item);
					if (observer.closed) {
						return;
					}
				}
				
				observer.complete();
			});
		}
		
		static of(...items) {
			const cls = typeof this === "function" ? this : Observable;
			
			return new cls(observer => {
				for (const item of items) {
					observer.next(item);
					if (observer.closed) {
						return;
					}
				}
				
				observer.complete();
			});
		}
	}
	
	function cleanupSubscription(subscription) {
		delete subscription._observer;
		
		let cleanup = subscription._cleanup;
		delete subscription._cleanup;
		
		if (cleanup) cleanup();
	}
	
	class Subscription {
		constructor(observer, subscriber) {
			this._cleanup = undefined;
			this._observer = observer;
			
			observer.start && observer.start(this);
			if (this.closed) {
				return;
			}
			
			observer = new SubscriptionObserver(this);
			
			try {
				let cleanup = subscriber.call(undefined, observer);
				
				if (cleanup instanceof Subscription) {
					this._cleanup = () => cleanup.unsubscribe();
				}
				else if (typeof cleanup === "function") {
					this._cleanup = cleanup;
				}
			} catch (e) {
				console.error(e);
				observer.error(e);
				return;
			}
			
			if (this.closed) {
				cleanupSubscription(this);
			}
		}
		
		get closed() {
			return this._observer === undefined;
		}
		
		unsubscribe() {
			if (this.closed) return;
			cleanupSubscription(this);
		}
	}
	
	
	class SubscriptionObserver {
		constructor(subscription) {
			this._subscription = subscription;
		}
		
		get closed() {
			return this._subscription.closed;
		}
		
		next(value) {
			if (this.closed) return;
			try {
				this._subscription._observer.next && this._subscription._observer.next(value);
			} catch (error) {
				this.error(error);
			}
		}
		
		error(error) {
			if (this.closed) return;
			this._subscription._observer.error ? this._subscription._observer.error(error) : console.error(error);
			cleanupSubscription(this._subscription);
		}
		
		complete() {
			if (this.closed) return;
			this._subscription._observer.complete && this._subscription._observer.complete();
			cleanupSubscription(this._subscription);
		}
	}
	
	
	/// -------------------------------------------------------------------------------------------
	/// Subject
	/// -------------------------------------------------------------------------------------------
	class Subject extends Observable {
		constructor() {
			super(observer => {
				if (this.closed) return;
				this.observers.push(observer);
				return () => this.observers = this.observers.filter(o => o !== observer);
			});
			
			this.observers = [];
		}
		
		get closed() {
			return this.observers === undefined;
		}
		
		next(value) {
			if (this.closed) return;
			for (const observer of this.observers) observer.next(value);
		}
		
		error(error) {
			if (this.closed) return;
			for (const observer of this.observers) observer.error(error);
			delete this.observers;
		}
		
		complete() {
			if (this.closed) return;
			for (const observer of this.observers) observer.complete();
			delete this.observers;
		}
	}
	
	
	class BehaviorSubject extends Subject {
		constructor(value) {
			super();
			this.value = value;
			
			let _subscriber = this._subscriber;
			this._subscriber = (observer) => {
				if (this.closed) return;
				observer.next(this.value);
				return _subscriber.call(null, observer);
			}
		}
		
		next(value) {
			this.value = value;
			super.next(value);
		}
	}
	
	class AsyncSubject extends Subject {
		constructor() {
			super();
			
			this._subscriber = (_subscriber => (observer) => {
				if (this.closed) {
					observer.next(this.value);
					observer.complete();
					return;
				}
				
				return _subscriber.call(null, observer);
			})(this._subscriber)
		}
		
		next(value) {
			if (this.closed) return;
			this.value = value;
		}
		
		complete() {
			if (this.closed) return;
			for (const observer of this.observers) observer.next(this.value);
			super.complete();
		}
	}
	
	
	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const noop = () => {};
	const just = v => v;
	
	Observable.prototype.pipe = function(fn) {
		return new Observable(observer => {
			let o = fn(observer) || {};
			o.next = o.next || observer.next.bind(observer);
			o.error = o.error || observer.error.bind(observer);
			o.complete = o.complete || observer.complete.bind(observer);
			
			let s = this.subscribe(o);
			return () => {
				s.unsubscribe();
				o.finalize && o.finalize();
			}
		});
	};
	
	
	Observable.prototype.count = function() {
		return new Observable(observer => {
			let count = 0;
			return this.subscribe({
				...observer,
				next: () => count++,
				complete: () => observer.next(count),
			})
		});
	};
	
	Observable.prototype.map = function(callback) {
		return new Observable(observer => {
			return this.subscribe({
				...observer,
				next: (value) => observer.next(callback(value)),
			})
		});
	};
	
	Observable.prototype.do = function(onNext, onComplete = noop) {
		return new Observable(observer => {
			return this.subscribe({
				...observer,
				next: (value) => {
					onNext(value, index++);
					observer.next(value)
				},
				complete: () => {
					onComplete();
					observer.complete();
				},
			})
		});
	};
	
	
	Observable.prototype.doWhile = function(callback) {
		return new Observable(observer => {
			let flag = true;
			return this.subscribe({
				...observer,
				next: (value) => {
					flag && (flag = callback(value));
					observer.next(value)
				},
			})
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
	
	
	Observable.prototype.onComplete = Observable.prototype.complete = function(callback) {
		
		return this.pipe(observer => {
			return {
				complete() {
					callback();
					observer.complete();
				},
			}
		});
	};
	
	Observable.prototype.finalize = function(callback) {
		return new Observable(observer => {
			let s = this.subscribe(observer);
			return () => {
				s.unsubscribe();
				callback();
			}
		});
	};
	
	Observable.prototype.flatMap = Observable.prototype.mergeMap = function(callback) {
		return this.map(callback).pipe(observer => {
			return {
				next(value) {
					value.subscribe(observer.next.bind(observer), observer.error.bind(observer), noop);
				},
			}
		});
	};
	
	
	Observable.prototype.mergeAll = function() {
		return new Observable(observer => {
			let ret = [];
			
			this.subscribe({
				next(value) {
					ret.push(value)
				},
				
				complete() {
					observer.next(ret);
				},
			})
		});
	};
	
	
	Observable.prototype.filter = function(callback) {
		return this.pipe(observer => {
			return {
				next() {
					callback.apply(observer, arguments) && observer.next(...arguments);
				},
			}
		});
	};
	
	
	Observable.prototype.last = function() {
		return this.pipe(observer => {
			let ret;
			return {
				next(value) {
					ret = value;
				},
				
				complete() {
					observer.next(ret);
					observer.complete();
				},
			}
		});
	};
	
	
	/// @TODO: count
	Observable.prototype.retry = function(count) {
		return new Observable(observer => {
			const next = observer.next.bind(observer);
			const complete = observer.complete.bind(observer);
			
			let s1, s2;
			s1 = this.subscribe(next, (err) => {
				s1 && s1.unsubscribe();
				s2 = this.retry(--count).subscribe(observer);
			}, complete);
			
			return () => {
				s1 && s1.unsubscribe();
				s2 && s2.unsubscribe();
			};
		})
	};
	
	
	Observable.prototype.take = function(num) {
		
		let count = 0;
		return this.pipe(observer => {
			return {
				next(value) {
					observer.next(value);
					if (++count >= num) {
						observer.complete();
					}
				},
			}
		});
	};
	
	Observable.prototype.takeLast = function(num) {
		num = num || 1;
		let res = [];
		
		return this.pipe(observer => {
			return {
				next(value) {
					res.push(value);
					res = res.slice(-num);
				},
				
				complete() {
					observer.next(res);
					observer.complete();
				},
			}
		});
	};
	
	
	Observable.prototype.takeUntil = function(observable$) {
		return new Observable(observer => {
			let s = this.subscribe(observer);
			
			const stop = () => {
				s.unsubscribe();
				observer.complete();
			};
			
			observable$.subscribe(stop, stop, stop);
			return s;
		});
	};
	
	
	/// @TODO: inclusive
	Observable.prototype.takeWhile = function(callback = just, inclusive) {
		return this.pipe(observer => {
			let index = 0;
			return {
				next(value) {
					Observable.castAsync(callback(value, index++)).subscribe(cond => {
						observer.next(value);
						if (!cond) observer.complete();
					});
				},
			}
		});
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
				},
			})
		});
	};
	
	
	Observable.prototype.share = function() {
		let observers = [];
		let subscription;
		
		return new Observable(observer => {
			observers.push(observer);
			
			subscription = subscription || this.subscribe({
				next(value) {
					for (const observer of observers) observer.next(value);
				},
				
				error(error) {
					for (const observer of observers) observer.error(error);
				},
				
				complete() {
					for (const observer of observers) observer.complete();
				},
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
	
	
	Observable.prototype.skip = function(count) {
		let index = 0;
		
		return this.pipe(observer => {
			return {
				next(value) {
					if (index++ < count) {
						return;
					}
					observer.next(value);
				},
				
				error() {
					index = 0;
				},
				
				complete() {
					index = 0;
				},
			}
		});
	};
	
	
	Observable.prototype.switchMap = function(callback) {
		return this.pipe(observer => {
			let subscription;
			
			return {
				next(value) {
					if (subscription) subscription.unsubscribe();
					let observable = Observable.castAsync(callback(value));
					subscription = observable.subscribe(observer);
				},
				
				complete() {},
			}
		});
	};
	
	
	Observable.prototype.concatMap = function(callback = just) {
		
		return this.pipe(observer => {
			
			let queue = [];
			let running = false;
			let completed = false;
			let subscriptions = [];
			
			function doQueue() {
				if (running) return;
				
				let nextJob = queue.shift();
				if (nextJob) {
					return nextJob();
				}
				
				if (completed) {
					observer.complete();
				}
			}
			
			return {
				next(value) {
					queue.push(() => {
						running = true;
						
						let observable = Observable.castAsync(callback(value));
						
						let subscription = observable.subscribe(
							value => observer.next(value),
							err => observer.error(err),
							() => {
								
								/// @FIXME: 임시 조치 complate() -> 이후 callback()이 되어야 함.
								
								Promise.resolve().then(() => {
									running = false;
									doQueue();
									
								})
							},
						);
						
						subscriptions.push(subscription);
					});
					
					doQueue();
				},
				
				complete() {
					completed = true;
				},
				
				finalize() {
					for (const subscription of subscriptions) subscription.unsubscribe();
				},
			}
		})
	};
	
	
	/// -------------------------------------------------------------------------------------------
	/// Static Operators
	/// -------------------------------------------------------------------------------------------
	Observable.NEVER = new Observable(noop);
	Observable.EMPTY = new Observable(observer => observer.complete());
	
	Observable.empty = () => new Observable(observer => observer.complete());
	
	// @FIXME: 내가 만든거
	Observable.castAsync = function(value) {
		if (value instanceof Observable) {
			return value;
		}
		
		if (value instanceof Promise) {
			return Observable.fromPromise(value);
		}
		
		return new Observable(observer => {
			observer.next(value);
			observer.complete();
		})
	};
	
	Observable.defer = function(callback) {
		return new Observable(observer => {
			return Observable.castAsync(callback()).subscribe(observer);
		});
	};
	
	
	Observable.just = function(value) {
		return new Observable(observer => {
			observer.next(value);
			observer.complete();
		});
	};
	
	Observable.interval = function(timeout) {
		return new Observable(observer => {
			let i = 0;
			let id = setInterval(() => observer.next(i++), timeout);
			return () => clearInterval(id);
		});
	};
	
	Observable.timeout = function(timeout, value) {
		return new Observable(observer => {
			let id = setTimeout(() => {
				observer.next(value);
				observer.complete();
			}, timeout);
			return () => clearTimeout(id);
		});
	};
	
	
	Observable.fromPromise = function(promise) {
		return new Observable(observer => {
			promise.then(res => {
				observer.next(res);
				observer.complete();
			}, err => {
				observer.error(err);
			})
		});
	};
	
	Observable.fromEvent = function(el, type, useCapture) {
		return new Observable(observer => {
			function handler(event) {
				observer.next(event);
			}
			
			el.addEventListener(type, handler, useCapture);
			return () => el.removeEventListener(type, handler, useCapture);
		});
	};
	
	Observable.forkjoin = function(...observables) {
		return new Observable(observer => {
			let ret = new Array(observables.length);
			let count = 0;
			
			if (ret.length === 0) {
				observer.next(ret);
				observer.complete();
				return;
			}
			
			// console.log(Observable.forkjoin);
			
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
			
			const merge = observable => observable.subscribe({
				next(value) { observer.next(value) },
				error(error) { observer.error(error) },
				complete() {
					if (++count === length) {
						observer.complete();
					}
				},
			});
			
			const subscriptions = observables.map(merge);
			
			return function() {
				for (const s of subscriptions) s.unsubscribe();
			}
		});
	};
	
	
	exports.Observable = Observable;
	exports.Subject = Subject;
	exports.AsyncSubject = AsyncSubject;
	exports.BehaviorSubject = BehaviorSubject;
	
})();