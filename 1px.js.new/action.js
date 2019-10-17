(function() {
	"use strict";

	const {Observable, Subject} = require("observable");

	let action_index = 0;

	class Action extends Observable {
		constructor(type, ...pipes) {
			const subject = new Subject;

			let observable = subject;
			let s, s2;
			if (pipes.length) {
				observable = observable.pipe(...pipes);
				s = observable.subscribe();
			}

			super(observer => {
				s2 = observable.subscribe(observer);
				if (s) s.unsubscribe();
			});

			this.type = type;
			this.toString = () => type;

			const f = payload => {
				if (s2 && s2.closed) return;

				if (payload !== undefined) {
					console.group("#" + (++action_index) + " " + type, payload)
				}
				else {
					console.group("#" + (++action_index) + " " + type);
				}

				subject.next(payload);

				console.groupEnd();
				return Observable.EMPTY; /// @TODO: 이게 맞을까???
			};

			Object.setPrototypeOf(f, this);
			return f;
		}
	}

	const RequestAction = class extends Action {
		constructor(type, ...pipes) {
			pipes = [...pipes, $ => $.tap(value => f.REQUEST(value))];

			const f = super(type, ...pipes);
			f.REQUEST = new Action(type + "_REQUEST");
			f.SUCCESS = new Action(type + "_SUCCESS");
			f.FAILURE = new Action(type + "_FAILURE");
			return f;
		}
	};

	exports.Action = Action;
	exports.RequestAction = RequestAction;
}());
