const {Observable} = require();

Observable.prototype.share = function() {
	let observers = [];
	let subscription;
	
	return new Observable(observer => {
		observers.push(observer);

		// console.log("share??, subscription??", subscription, observers.length);
		
		subscription = subscription || this.subscribe({
			next(value) {
				for (let observer of observers) observer.next(value);
			},
			
			error(error) {
				for (let observer of observers) observer.error(error);
			},
			
			complete() {
				for (let observer of observers) observer.complete();
			},
		});
		
		return function() {
			observers = observers.filter(o => o !== observer);
			
			// console.log("shaere??", observers.length);

			if (observers.length === 0) {
				subscription.unsubscribe();
				subscription = null;
			}
		}
	});
};