(function() {
	"use strict";
	
	const {Observable, ReplaySubject} = require("observable");
	
	let action_index = 0;
	
	const _debug = (type, payload) => {
		if (payload !== undefined) {
			return _.debug.group("#" + (++action_index) + " " + type + "(" + _.toType(payload) + ")", payload)
		}
		else {
			return _.debug.group("#" + (++action_index) + " " + type + "()");
		}
	};
	
	class Action extends Observable {
		constructor(type, ...pipes) {
			const subject = new ReplaySubject;
			const observable = subject.pipe(...pipes);
			let s2;
			
			super(observer => {
				return observable.subscribe(observer);
				if (s) s.unsubscribe();
			});
			
			this.type = type;
			this.toString = () => type;
			
			const f = payload => {
				if (s2 && s2.closed) {
					subject.complete();
					return Observable.EMPTY;
				}
				
				f._debugEnd = f._debug(type, payload);
				subject.next(payload);
				f._debugEnd(type);
				
				return Observable.EMPTY;
			};
			f._debug = _debug;
			
			Object.setPrototypeOf(f, this);
			return f;
		}
	}
	
	const RequestAction = class extends Action {
		constructor(type, ...pipes) {
			pipes = [...pipes, $ => $.tap(value => f.REQUEST(value))];
			
			const _f = super(type, ...pipes);
			_f._debug = () => () => {};
			
			const f = payload => {
				const ret = Observable.merge(f.SUCCESS, f.FAILURE).take(1).shareReplay(1);//.finalize(_debugEnd);
				ret.subscribe();
				_f(payload);
				return ret;
			};
			
			Object.setPrototypeOf(f, this);
			
			f.REQUEST = new Action(type + "_REQUEST");
			f.SUCCESS = new Action(type + "_SUCCESS");
			f.FAILURE = new Action(type + "_FAILURE");
			return f;
		}
	};
	
	exports.Action = Action;
	exports.RequestAction = RequestAction;
}());
