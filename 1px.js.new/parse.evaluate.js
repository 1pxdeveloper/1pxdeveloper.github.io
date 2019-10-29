(function() {
	"use strict";
	
	const {Observable, Subject, BehaviorSubject} = require("./observable");
	const {tokenize} = require("./parse.expression");
	
	// const {watch$$} = require("parse");
	
	
	/// -----------------------------------------------------------------------
	/// Context
	/// -----------------------------------------------------------------------
	function _makeString(strings) {
		return Object(strings) === strings ? String.raw.apply(String, arguments) : String(strings);
	}
	
	class Context {
		constructor(thisObj, scope = thisObj) {
			this.thisObj = thisObj;
			this.scope$ = new BehaviorSubject(scope);
			this._disconnect$ = new Subject();
			
			const f = (...args) => {
				const root = tokenize(_makeString(...args));
				for (const token of root.tokens) { token.context = this }
				return evaluate(root).takeUntil(this._disconnect$);
			};
			
			Object.setPrototypeOf(f, this);
			return f;
		}
		
		disconnect() {
			this._disconnect$.complete();
		}
		
		fork(locals) {
			return new Context(this.thisObj, Object.setPrototypeOf(locals, this.scope$.value));
		}
		
		fromEvent(el, type, useCapture = false) {
			return Observable.fromEvent(el, type, useCapture);
		}
	}
	
	
	/// -----------------------------------------------------------------------
	/// watch$$
	/// -----------------------------------------------------------------------
	const watch$$ = (object, prop) => {
		return new Observable(observer => {
			const value = object[prop];
			
			if (value instanceof Observable && typeof value !== "function") {
				value.subscribe(observer);
			}
			else {
				if (value !== undefined) {
					observer.next(value);
				}
			}
			
		});
	};
	
	
	const {combine, of} = Observable;
	
	const $evaluateRules = Object.create(null);
	
	const evaluate = (token) => {
		// console.log(token.id, token.length, token);
		
		try {
			return $evaluateRules[token.id][token.length].apply(token, token);
		} catch (error) {
			console.warn(token.id, token.length, token);
			console.error(error);
			
			return Observable.throw(error);
		}
	};
	
	/// Operators
	const unary = (callback) => (a) => evaluate(a).map(callback);
	const binary = (callback) => (a, b) => combine(evaluate(a), evaluate(b)).map(callback);
	const params = (array) => combine(...array.map(evaluate));
	
	
	/// Rules
	const evaluateRule = (id, callback) => {
		$evaluateRules[id] = $evaluateRules[id] || Object.create(null);
		$evaluateRules[id][callback.length] = callback;
	};
	
	evaluateRule("(end)", () => of(undefined));
	
	evaluateRule("(literal)", function() { return of(this.value) });
	
	evaluateRule("this", function() { return of(this.context.thisObj) });
	
	/// [1,2,3]
	evaluateRule("[", params);
	
	/// {foo: 123, bsr: 'abc'} @TODO:
	evaluateRule("{", (a) => {
		
		
		console.log("{{{{{{{{{{{{{", a);
		
		return params(a).trace("?????").map(values => values.reduce((object, value, index) => {
			
			
			console.log(value, index);
			
			
			object[a[index].key] = value;
			return object;
		}, {}));
		
	});
	
	evaluateRule("+", unary(a => +a));
	evaluateRule("-", unary(a => -a));
	evaluateRule("!", unary(a => !a));
	
	evaluateRule("+", binary(([a, b]) => a + b));
	evaluateRule("-", binary(([a, b]) => a - b));
	evaluateRule("*", binary(([a, b]) => a * b));
	evaluateRule("/", binary(([a, b]) => a / b));
	evaluateRule("%", binary(([a, b]) => a % b));
	
	evaluateRule("&&", binary(([a, b]) => a && b));
	evaluateRule("||", binary(([a, b]) => a || b));
	evaluateRule("===", binary(([a, b]) => a === b));
	evaluateRule("!==", binary(([a, b]) => a !== b));
	evaluateRule("==", binary(([a, b]) => a == b));
	evaluateRule("!=", binary(([a, b]) => a != b));
	evaluateRule("<", binary(([a, b]) => a < b));
	evaluateRule("<=", binary(([a, b]) => a <= b));
	evaluateRule(">", binary(([a, b]) => a > b));
	evaluateRule(">=", binary(([a, b]) => a >= b));
	evaluateRule(";", binary(([a, b]) => b));
	
	evaluateRule("?", (a, b, c) => evaluate(a).switchMap(bool => bool ? evaluate(b) : evaluate(c)));
	
	
	/// foo
	evaluateRule("(name)", function() {
		return this.context.scope$
			.tap(scope => {
				this.object = scope;
				this.prop = this.value;
			})
			.switchMap(scope => watch$$(scope, this.value));
	});
	
	
	/// foo.bar
	evaluateRule(".", function(a, b) {
		return evaluate(a)
			.tap(object => {
				this.object = object;
				this.prop = b.value;
			})
			.mergeMap(object => watch$$(object, b.value));
	});
	
	/// foo[bar]
	evaluateRule("[", function(a, b) {
		return combine(evaluate(a), evaluate(b))
			.tap(([object, prop]) => {
				this.object = object;
				this.prop = prop;
			})
			.mergeMap(([object, prop]) => watch$$(object, prop));
	});
	
	/// foo(bar, ...baz)
	evaluateRule("(", function(a, b) {
		
		
		evaluate(a).trace("func!!!!!!").subscribe()
		params(b).trace("params!!!!!!!!!").subscribe()
		
		
		return combine(evaluate(a), params(b))
			.map(([func, args]) => {
				console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@", func, a.object, args);
				
				
				if (typeof func !== "function") return;
				
				
				console.log(func, a.object, args);
				
				
				return Function.prototype.apply.call(func, a.object, args);
			});
	});
	
	evaluateRule("if", (a, b) => evaluate(b).filter(_.isTrue).switchMap(() => evaluate(a)));
	
	evaluateRule("=", (a, b) => of(0));
	
	
	// evaluateRule("|");
	// evaluateRule("=>");
	// evaluateRule("as");
	// evaluateRule("let");
	
	// console.log("$evaluateRules", $evaluateRules);
	
	// exports.evaluate = evaluate;
	exports.Context = Context;
	
}());