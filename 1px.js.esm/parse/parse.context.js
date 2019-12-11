import {Observable, Subject, BehaviorSubject} from "../observable";

import {tokenize} from "./parse.expression.js";
import {watch$$} from "./parse.watch.js";
import {evaluate} from "./parse.evaluate.js";


export class Context {
	
	constructor(thisObj, locals = Object.create(null)) {
		this.thisObj = thisObj;
		this.locals$ = new BehaviorSubject(locals);
		
		this._disconnect$ = new Subject();
		
		const f = (...args) => {
			const root = tokenize(_makeString(...args));
			for (const token of root.tokens) {
				token.context = this;
				token.watch = watch$$;
			}
			return evaluate(root).takeUntil(this._disconnect$);
		};
		
		Object.setPrototypeOf(f, this);
		return f;
	}
	
	evaluate(script) {
		const root = tokenize(script);
		for (const token of root.tokens) {
			token.context = this;
			token.watch = _watch$$;
		}
		
		return evaluate(root).takeUntil(this._disconnect$);
	}
	
	assign(script, value) {
		const root = tokenize(script);
		for (const token of root.tokens) {
			token.context = this;
			token.watch = _watch$$;
		}
		
		// @FIXME: subscribe를 해야 하나??
		return evaluate(root).tap(() => root.object[root.prop] = value);
	}
	
	disconnect() {
		this._disconnect$.complete();
	}
	
	fork(locals) {
		return new Context(this.thisObj, Object.setPrototypeOf(locals, this.locals$.value));
	}
	
	fromEvent(el, type, useCapture = false) {
		return Observable.fromEvent(el, type, useCapture);
	}
}