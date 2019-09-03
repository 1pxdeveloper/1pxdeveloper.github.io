(function() {
	"use strict";

	if (!Symbol.observable) {
		Object.defineProperty(Symbol, "observable", {value: Symbol("observable")});
	}

	class Observable {
		constructor(subscriber) {
			if (typeof subscriber !== "function") {
				throw new TypeError("Observable initializer must be a function");
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

			let cls = typeof this === "function" ? this : Observable;

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

				for (let item of method.call(x)) {
					observer.next(item);
					if (observer.closed) {
						return;
					}
				}

				observer.complete();
			});
		}

		static of(...items) {
			let cls = typeof this === "function" ? this : Observable;

			return new cls(observer => {
				for (let item of items) {
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
		let cleanup = subscription._cleanup;
		delete subscription._observer;
		delete subscription._cleanup;
		if (cleanup) cleanup();
	}

	function callMethod(obj, key, value) {
		let fn = obj[key];
		if (!fn) return;
		if (typeof fn !== "function") throw TypeError(fn + " is not function");
		return fn.call(obj, value);
	}

	class Subscription {
		constructor(observer, subscriber) {
			this._cleanup = undefined;
			this._observer = observer;

			callMethod(observer, "start", this);
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
			callMethod(this._subscription._observer, "next", value);
		}

		error(err) {
			if (this.closed) return;
			console.error(err);
			callMethod(this._subscription._observer, "error", err);
			cleanupSubscription(this._subscription);
		}

		complete() {
			if (this.closed) return;
			callMethod(this._subscription._observer, "complete");
			cleanupSubscription(this._subscription);
		}
	}


	/// Operators
	Observable.prototype.pipe = function(fn) {
		return new Observable(observer => {
			let o = fn(observer) || {};
			o.next = o.next || observer.next.bind(observer);
			o.error = o.error || observer.error.bind(observer);
			o.complete = o.complete || observer.complete.bind(observer);

			let s = this.subscribe(o);
			
			return () => {
				o.finalize && o.finalize();
				s.unsubscribe();
			}
		});
	};


	Observable.prototype.count = function(fn) {
		return this.pipe(observer => {
			let count = 0;

			return {
				next() {
					count++;
				},

				complete() {
					observer.next(count);
					count = 0;
				},
			}
		});
	};


	Observable.prototype.map = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					observer.next(fn(...arguments));
				},
			}
		});
	};

	Observable.prototype.do = function(fn) {
		return this.pipe(observer => {
			return {
				next(value) {
					fn(value);
					observer.next(value);
				},
			}
		});
	};


	Observable.prototype.concat = function(observable) {
		return this.pipe(observer => {
			return {
				complete() {
					observable.subscribe(observer);
				},
			}
		});
	};


	Observable.prototype.complete = function(fn) {
		return this.pipe(observer => {
			return {
				complete() {
					fn();
					observer.complete();
				},
			}
		});
	};

	Observable.prototype.finalize = function(fn) {
		return new Observable(observer => {
			this.subscribe(observer);
			return fn;
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


	Observable.prototype.filter = function(fn) {
		return this.pipe(observer => {
			return {
				next() {
					fn.apply(observer, arguments) && observer.next(...arguments);
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


	Observable.prototype.take = function(num) {
		return this.pipe(observer => {
			let count = 0;

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
		return this.pipe(observer => {
			num = num || 1;
			let res = [];

			return {
				next(value) {
					res.push(value);
					res.slice(-num);
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
		});
	};


	Observable.prototype.toPromise = function() {
		return new Promise((resolve, reject) => {
			let _value;

			let s = this.subscribe({
				next(value) {
					_value = value;
				},

				error(error) {
					if (s.closed) return;
					reject(error);
				},

				complete() {
					if (s.closed) return;
					resolve(_value);
				},
			})
		});
	};


	Observable.prototype.share = function() {
		let observers = [];
		let subscription;

		console.log("shaere??");


		return new Observable(observer => {
			observers.push(observer);

			subscription = subscription || this.subscribe({
				next(value) {
					observers.slice().forEach(observer => observer.next(value));
				},

				error(err) {
					observers.slice().forEach(observer => observer.error(err));
				},

				complete() {
					observers.slice().forEach(observer => observer.complete());
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
		return this.pipe(observer => {
			let index = 0;

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


	Observable.prototype.then = function(resolve, reject) {
		let lastValue;
		let s;

		let self = this;
		return new Observable(observer => {
			let x = this.subscribe({
				next(value) {

					let res = resolve(value);
					if (res instanceof Observable) {
						res.toPromise().then(value => {
							observer.next(value);
							observer.complete();

						});
						return;
					}

					Promise.resolve(res).then(value => {
						observer.next(value);
						observer.complete();
					});


				},

				error(error) {
					// reject(error);
				},

				complete() {

				},
			});

			return () => {
				if (s) s.unsubscribe();
			}
		});
	};


	Observable.prototype.toArray = function() {
		return this.pipe(observer => {
			let ret = [];

			return {
				next(value) {
					ret.push(value);
				},
				complete() {
					observer.next(ret);
					observer.complete();
				},
			};
		});
	};


	/// Static
	function noop() {}

	Observable.NEVER = new Observable(noop);
	Observable.never = () => new Observable(noop);
	Observable.empty = () => new Observable(observer => observer.complete());

	// @FIXME: 내가 만든거
	Observable.castAsync = function(value) {
		if (value instanceof Observable) {
			return value;
		}

		if (value instanceof Promise) {
			return Observable.fromPromise(value);
		}

		return Observable.of(value);
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

		let ret = new Array(observables.length);
		let count = 0;

		return new Observable(observer => {
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

	Observable.zip = function(...observables) {

		let stack = new Array(observables.length).fill(null).map(() => []);

		return new Observable(observer => {
			let s = observables.map((observable, index) => {

				return observable.subscribe(value => {
					stack[index].push(value);
					console.log(JSON.stringify(stack), index);

					if (stack.every(v => v.length > 0)) {
						let ret = [];
						stack.forEach(v => ret.push(v.shift()));
						observer.next(ret);
					}
				});
			});

			return function() {
				s.forEach(subscription => subscription.unsubscribe());
			}
		});
	};

	Observable.merge = function(...observables) {

		return new Observable(observer => {

			let len = observables.length;
			let count = 0;

			let s = observables.map(observable => {
				return observable.subscribe({
					next(value) { observer.next(value) },
					error(err) { observer.error(err) },
					complete() {
						if (++count === len) {
							observer.complete();
						}
					},
				});
			});

			return function() {
				s.forEach(s => s.unsubscribe());
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


	Observable.prototype.concatMap = function(callback) {

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
						subscriptions.push(observable.subscribe(
							value => observer.next(value),
							err => observer.error(err),
							() => {
								running = false;
								doQueue();
							},
						));
					});

					doQueue();
				},

				complete() {
					completed = true;
				},

				finalize() {
					subscriptions.forEach(subscription => subscription.unsubscribe());
				},
			}
		})
	};


	class Subject extends Observable {
		constructor() {
			super(observer => {
				if (this.closed) return;
				this.observers.push(observer);

				let _cleanup = observer._subscription._cleanup;
				observer._subscription._cleanup = () => {
					this.observers.splice(this.observers.indexOf(observer), 1);
					_cleanup && _cleanup();
				};
			});

			this.observers = [];
		}

		get closed() {
			return this.observers === undefined;
		}

		next(value) {
			if (this.closed) return;
			this.observers.slice().forEach(observer => observer.next(value));
		}

		error(err) {
			if (this.closed) return;
			this.observers.slice().forEach(observer => observer.error(err));
			delete this.observers;
		}

		complete() {
			if (this.closed) return;
			this.observers.slice().forEach(observer => observer.complete());
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
			let _subscriber = this._subscriber;
			this._subscriber = (observer) => {
				if (this.closed) {
					observer.next(this.value);
					observer.complete();
					return;
				}
				return _subscriber.call(null, observer);
			}
		}

		next(value) {
			if (this.closed) return;
			this.value = value;
		}

		error(err) {
			if (this.closed) return;
			this.observers.slice().forEach(observer => observer.error(err));
			delete this.observers;
		}

		complete() {
			if (this.closed) return;
			this.observers.slice().forEach(observer => {
				observer.next(this.value);
				observer.complete();
			});
			delete this.observers;
		}
	}


	exports.Observable = Observable;
	exports.Subject = Subject;
	exports.AsyncSubject = AsyncSubject;
	exports.BehaviorSubject = BehaviorSubject;

})();