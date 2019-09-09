const noop = () => {};

Observable.prototype.startWith = function(value) {
	return this.pipe(observer => {
		observer.next(value);
	})
};

/// Array Like
Observable.prototype.concat = function(observable) {
	return new Observable(observer => {

		const next = observer.next.bind(observer);
		const error = observer.error.bind(observer);

		let s1, s2;
		let completed = false;

		s1 = this.finalize(() => s2 = observable.subscribe(observer)).subscribe(next, error, () => completed = true);

		return () => {
			s1 && s1.unsubscribe();
			s2 && s2.unsubscribe();
		}
	})
};

Observable.prototype.map = function(callback) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);

		let index = 0;
		observer.next = value => next(callback(value, index++));

		return this.subscribe(observer);
	})
};

Observable.prototype.mapTo = Observable.prototype.fill = function(value) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);

		observer.next = () => next(value);

		return this.subscribe(observer);
	})
};

Observable.prototype.filter = function(callback) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);

		let index = 0;
		observer.next = value => callback(value, index++) && next(value);

		return this.subscribe(observer);
	})
};

Observable.prototype.find = function(callback) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);

		let index = 0;
		observer.next = value => {
			if (callback(value, index++)) {
				next(value);
				observer.complete();
			}
		};

		return this.subscribe(observer);
	})
};


Observable.prototype.findIndex = function(callback) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);

		let index = 0;
		observer.next = value => {
			if (callback(value, index++)) {
				next(index);
				observer.complete();
			}
		};

		return this.subscribe(observer);
	})
};


Observable.prototype.flat = function() {
	throw ReferenceError("flat is not defined.")
};


Observable.prototype.finalize = function(callback) {
	return new Observable(observer => {
		let s = this.subscribe(observer);
		return () => {
			s.unsubscribe();
			callback();
		}
	})
};

Observable.prototype.tap = Observable.prototype.do = function(onNext, onComplete = noop) {
	return new Observable(observer => {
		const next = observer.next.bind(observer);
		const complete = observer.complete.bind(observer);

		observer.next = (value) => {
			onNext(value);
			next(value);
		};

		observer.complete = () => {
			onComplete();
			complete();
		};

		return this.subscribe(observer);
	})
};


/*
Combination
combineAll
combineLatest :star:
concat :star:
concatAll
endWith
forkJoin
merge :star:
mergeAll
pairwise
race
startWith :star:
withLatestFrom :star:
zip
Conditional
defaultIfEmpty
every
iif
sequenceequal
Creation
ajax :star:
create
defer
empty
from :star:
fromEvent
generate
interval
of :star:
range
throw
timer
Error Handling
catch / catchError :star:
retry
retryWhen
Filtering
audit
auditTime
debounce
debounceTime :star:
distinctUntilChanged :star:
distinctUntilKeyChanged
filter :star:
find
first
ignoreElements
last
sample
single
skip
skipUntil
skipWhile
take :star:
takeLast
takeUntil :star:
takeWhile
throttle
throttleTime
Multicasting
multicast
publish
share :star:
shareReplay :star:
Transformation
buffer
bufferCount
bufferTime :star:
bufferToggle
bufferWhen
concatMap :star:
concatMapTo
expand
exhaustMap
groupBy
map :star:
mapTo
mergeMap / flatMap :star:
mergeScan
partition
pluck
reduce
scan :star:
switchMap :star:
switchMapTo
toArray
window
windowCount
windowTime
windowToggle
windowWhen
Utility
tap / do :star:
delay
delayWhen
dematerialize
finalize / finally
let
repeat
repeatWhen
timeInterval
timeout
timeoutWith
toPromise
 */


/*
ajax :star:
audit
auditTime
buffer
bufferCount
bufferTime :star:
bufferToggle
bufferWhen
catch / catchError :star:
combineAll
combineLatest :star:
concat :star:
concatAll
concatMap :star:
concatMapTo
create
debounce
debounceTime :star:
defaultIfEmpty
defer
delay
delayWhen
distinctUntilChanged :star:
distinctUntilKeyChanged
endWith
tap / do :star:
empty
every
exhaustMap
expand
filter :star:
finalize / finally
find
first
forkJoin
from :star:
fromEvent
generate
groupBy
iif
ignoreElements
interval
last
let
map :star:
mapTo
merge :star:
mergeAll
mergeMap / flatMap :star:
mergeScan
multicast
of :star:
partition
pluck
publish
race
range
repeat
repeatWhen
retry
retryWhen
sample
scan :star:
sequenceequal
share :star:
shareReplay :star:
single
skip
skipUntil
skipWhile
startWith :star:
switchMap :star:
switchMapTo
take :star:
takeLast
takeUntil :star:
takeWhile
throttle
throttleTime
throw
timeInterval
timeout
timeoutWith
timer
toArray
toPromise
window
windowCount
windowTime
windowToggle
windowWhen
withLatestFrom :star:
zip
 */