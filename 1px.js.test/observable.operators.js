(function() {
	"use strict";
	
	const {Observable} = require("observable");
	
	/// -------------------------------------------------------------------------------------------
	/// Operators
	/// -------------------------------------------------------------------------------------------
	const noop = () => {};
	const just = v => v;
	
	Observable.prototype.pipe = function(...operators) {
		return operators.reduce((observable, operator) => operator(observable), this);
	};
	
	Observable.prototype.lift = function(fn) {
		return new Observable(observer => {
			let o = fn(observer) || {};
			let s = this.subscribe(Object.setPrototypeOf(o, observer));
			return () => {
				s.unsubscribe();
				o.finalize && o.finalize();
			}
		});
	};
	
	const tap = (onNext, onComplete = noop) => $ => new Observable(observer => {
		let index = 0;
		
		return $.subscribe(Object.setPrototypeOf({
			next(value) {
				onNext(value, index++);
				observer.next(value);
			},
			complete() {
				onComplete();
				observer.complete();
			},
		}, observer));
	});
	
	
	Observable.operators = {tap};
	
	
	// const operator = callback => $ => $.lift(callback);
	//
	// const count = () => operator((observer, count = 0) => ({
	// 	next: () => count++,
	// 	complete: () => observer.next(count),
	// }));
	
	
	Observable.prototype.count = function() {
		return this.lift((observer, count = 0) => ({
			next() { count++ },
			complete() { observer.next(count) },
		}));
	};
	
	Observable.prototype.map = function(callback) {
		return this.lift(observer => ({
			next(value) { observer.next(callback(value)) },
		}));
	};
	
	Observable.prototype.do = function(onNext, onComplete = noop) {
		return this.lift((observer, index = 0) => ({
			next(value) {
				onNext(value, index++);
				observer.next(value)
			},
			complete() {
				onComplete();
				observer.complete();
			},
		}));
	};
	
	
	Observable.prototype.doWhile = function(callback) {
		return this.lift((observer, index = 0, flag = true) => ({
			next(value) {
				flag && (flag = callback(value));
				observer.next(value)
			},
		}));
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
		return this.map(callback).lift(observer => ({
			next(value) {
				value.subscribe(observer.next.bind(observer), observer.error.bind(observer), noop);
			},
		}));
	};
	
	
	Observable.prototype.mergeAll = function() {
		return this.lift((observer, ret = []) => ({
			next(value) { ret.push(value) },
			complete() { observer.next(ret) },
		}));
	};
	
	
	Observable.prototype.filter = function(callback) {
		return this.lift(observer => ({
			next(value) {
				callback(value) && observer.next(value);
			},
		}));
	};
	
	
	Observable.prototype.last = function() {
		return this.lift((observer, ret) => ({
			next(value) {
				ret = value;
			},
			
			complete() {
				observer.next(ret);
				observer.complete();
			},
		}));
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
		return this.lift(observer => ({
			start() {
				(num <= 0) && observer.complete();
			},
			next(value) {
				observer.next(value);
				(--num <= 0) && observer.complete();
			},
		}));
	};
	
	Observable.prototype.takeLast = function(num = 1) {
		
		return this.lift((observer, res = []) => ({
			next(value) {
				res.push(value);
				res = res.slice(-num);
			},
			
			complete() {
				observer.next(res);
				observer.complete();
			},
		}));
	};
	
	
	Observable.prototype.takeUntil = function(observable$) {
		return new Observable(observer => {
			const stop = observer.complete.bind(observer);
			const s = this.subscribe(observer);
			const s2 = observable$.subscribe(stop, stop, stop);
			
			return () => {
				s.unsubscribe();
				s2.unsubscribe();
			}
		});
	};
	
	
	/// @TODO: inclusive
	Observable.prototype.takeWhile = function(callback = just, inclusive) {
		return this.lift(observer => {
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
		return this.lift((observer, index = 0) => ({
			next(value) {
				if (index++ < count) {
					return;
				}
				observer.next(value);
			},
		}));
	};
	
	
	Observable.prototype.switchMap = function(callback) {
		return this.lift(observer => {
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
		
		return this.lift(observer => {
			
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
	
	Observable.defer = function(callback, thisObj, ...args) {
		return new Observable(observer => {
			return Observable.castAsync(callback.apply(thisObj, args)).subscribe(observer);
		});
	};
	
	
	Observable.just = function(value) {
		return new Observable(observer => {
			observer.next(value);
			observer.complete();
		});
	};
	
	Observable.interval = function(timeout) {
		return new Observable((observer, i = 0, id) => {
			id = setInterval(() => observer.next(i++), timeout);
			return () => clearInterval(id);
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
	
	
	Observable.fromPromise = function(promise) {
		return new Observable(observer => {
			promise.then(
				res => {
					observer.next(res);
					observer.complete();
				},
				
				err => observer.error(err))
		});
	};
	
	Observable.fromEvent = function(el, type, useCapture) {
		return new Observable(observer => {
			const handler = observer.next.bind(observer);
			el.addEventListener(type, handler, useCapture);
			return () => el.removeEventListener(type, handler, useCapture);
		}).share();
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
	
})();