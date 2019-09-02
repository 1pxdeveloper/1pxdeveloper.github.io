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


Observable.merge = function(...observables) {
	
	return new Observable(observer => {
		
		let length = observables.length;
		
		let s = observables.map(observable => {
			return observable.subscribe({
				next(value) { observer.next(value) },
				error(error) { observer.error(error) },
				complete() {
					if (--length === 0) {
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