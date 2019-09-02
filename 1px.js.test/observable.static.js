Observable.combineLatest = function(...observables) {

	return new Observable(observer => {
		let ret = Array(observables.length);
		let exists = Array(observables.length);

		let subscriptions = observables.map((observable, index) => {
			observable.subscribe(value => {
				ret[index] = value;
				exists[index] = true;
				for (let flag of exists) if (!flag) return;
				observer.next(ret);
			})
		});

		return () => {
			for (let subscription of subscriptions) subscription.unsubscribe();
		}
	});
};