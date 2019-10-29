(function() {
	"use strict";
	
	const {Observable, Subject, ReplaySubject} = require("observable");
	
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
			const subject = new Subject;
			const observable = subject.pipe(...pipes);
			
			let s, s2;
			if (pipes.length) {
				s = observable.subscribe();
			}
			
			super(observer => {
				s2 = observable.subscribe(observer);
				if (s) s.unsubscribe();
				return s2;
			});
			
			this.type = type;
			this.toString = () => type;
			
			const f = payload => {

				/// @FIXME: 이러면 뭔가 문제가 생기네...
				// if (s2 && s2.closed) {
				// 	subject.complete();
				// 	return Observable.EMPTY;
				// }
				
				f.uuid = f._debug(type, payload);
				subject.next(payload);
				f._debugEnd(f.uuid);
				
				return Observable.EMPTY;
			};
			f._debug = _debug;
			f._debugEnd = _.debug.groupEnd;
			
			Object.setPrototypeOf(f, this);
			return f;
		}
	}
	
	const RequestAction = class extends Action {
		constructor(type, ...pipes) {
			pipes = [...pipes, $ => $.tap(value => f.REQUEST(value))];
			
			const _f = super(type, ...pipes);
			_f._debug = _debug;
			_f._debugEnd = _.noop;
			
			const f = payload => {
				const ret = Observable.merge(f.SUCCESS, f.FAILURE, f.CANCEL).take(1).shareReplay(1).finalize(() => _.debug.groupEnd(_f.uuid));
				ret.subscribe();
				_f(payload);
				return ret;
			};
			
			Object.setPrototypeOf(f, this);
			
			f.CANCEL = new Action(type + "_CANCEL");
			f.REQUEST = new Action(type + "_REQUEST");
			f.SUCCESS = new Action(type + "_SUCCESS");
			f.FAILURE = new Action(type + "_FAILURE");
			return f;
		}
	};
	
	
	Action.prototype.isolate = function(id) {
		
		const o = this.pipe($ => $.filter(({id: _.is(id)})));
		
		const f = payload => {
			if (Object(payload) !== payload) payload = {payload};
			return this({id, ...payload});
		};
		
		Object.assign(f, _.mapValues(_.if(_.instanceof(Action), (action) => action.isolate(id)))(this));
		Object.setPrototypeOf(f, o);
		return f;
	};
	
	
	Action.isolate = (id, object) => {
		return _.memoize1((id) => _.mapValues(_.if(_.instanceof(Action), (action) => action.isolate(id)))(object))(id);
	};
	
	
	exports.Action = Action;
	exports.RequestAction = RequestAction;
}());
