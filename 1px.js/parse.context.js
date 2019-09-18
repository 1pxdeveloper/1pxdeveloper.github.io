(function() {
	"use strict";
	
	const {Observable, Subject, BehaviorSubject} = require();
	const {$parse, nextTick} = require();
	
	/// @FIXME: JS는 말고 템플릿에서도 적용되는데... 1pxContext 처럼 이름을 지으면 붙여줘야겠다.
	class JSContext {
		static get nextTick() {
			return nextTick;
		}
		
		static parse(script) {
			return $parse(script);
		}
		
		/// @TODO: thisObj
		static connect(thisObj, ...locals) {
			let context = new JSContext(thisObj, ...locals);
			let ret = context.watch$.bind(context);
			Object.setPrototypeOf(ret, context);
			
			// @FIXME:...
			ret.nextTick = nextTick;
			return ret;
		}
		
		constructor(thisObj, ...locals) {
			this.thisObj = thisObj;
			this.locals = locals || [];
			this.disconnect$ = new Subject();
		}
		
		disconnect() {
			this.disconnect$.complete();
		}
		
		fork(local) {
			local = local || Object.create(null);
			return JSContext.connect(this.thisObj, ...[local].concat(this.locals));
		}
		
		evaluate(script) {
			return $parse(script).evaluate(this.thisObj, ...this.locals);
		}
		
		assign(script, value) {
			return $parse(script).assign(value, this.thisObj, ...this.locals);
		}
		
		/// @TODO: script 가 array 면?? watch$(['a', 'b', 'c'], ...)
		watch$(script, callback) {
			script = String(script);
			
			let script$ = $parse(script).watch(this.thisObj, ...this.locals).takeUntil(this.disconnect$);
			if (typeof callback === "function") {
				return script$.subscribe(callback);
			}
			
			let subject = new BehaviorSubject();
			script$.subscribe(subject);
			return subject;
		}
		
		on$(el, type, useCapture) {
			if (Array.isArray(type)) {
				return Observable.merge(...type.map(type => this.on$(el, type, useCapture)));
			}
			
			return Observable.fromEvent(el, type, useCapture).takeUntil(this.disconnect$);
		}
		
		/// @FIXME: .. 기능 확대 필요!!! ex) /users/:id
		route(handler, _default, fallback) {
			fallback = fallback || "/*";
			
			let route = () => {
				let hash = location.hash || _default;
				(handler[hash] && handler[hash]()) || (handler[fallback] && handler[fallback]());
			};
			
			this.on$(window, "popstate").subscribe(route);
			route();
		}
	}
	
	exports.JSContext = JSContext;
}());