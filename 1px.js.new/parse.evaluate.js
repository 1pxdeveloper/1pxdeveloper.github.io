(function() {
	"use strict";

	const {Observable, Subject, BehaviorSubject} = require("./observable");
	const {tokenize} = require("./parse.expression");
	const {watch$$} = require("./parse.expression");

	/// -----------------------------------------------------------------------
	/// Context
	/// -----------------------------------------------------------------------
	function _makeString(strings) {
		return Object(strings) === strings ? String.raw.apply(String, arguments) : String(strings);
	}

	const _watch$$ = (object, prop) => Observable.of(object[prop]);

	class Context {
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


	/// -----------------------------------------------------------------------
	/// Evaluate
	/// -----------------------------------------------------------------------
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

	/// {foo: 123, bsr: 'abc'}
	evaluateRule("{", (a) => {
		return params(a).map(values => values.reduce((object, value, index) => {
			object[a[index].key] = value;
			return object;
		}, {}));
	});

	evaluateRule("#", (a) => {


			console.log($module.$actions);

			return Observable.of($module.$actions[a.value])
		}
	);

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
	evaluateRule(";", binary(([a, b]) => a));

	evaluateRule("?", (a, b, c) => evaluate(a).switchMap(bool => bool ? evaluate(b) : evaluate(c)));


	/// foo
	evaluateRule("(name)", function() {

		const prop = this.value;

		return this.context.locals$
			.switchMap(locals => {
				if (prop in locals) {
					return this.watch(locals, prop);
				}

				const object = this.context.thisObj;
				this.object = object;
				this.prop = prop;

				return this.watch(object, prop);
			});
	});


	/// foo.bar
	evaluateRule(".", function(a, b) {
		return evaluate(a)
			.tap(object => {
				this.object = object;
				this.prop = b.value;
			})
			.switchMap(object => this.watch(object, b.value));
	});

	/// foo[bar]
	evaluateRule("[", function(a, b) {
		return combine(evaluate(a), evaluate(b))
			.tap(([object, prop]) => {
				this.object = object;
				this.prop = prop;
			})
			.switchMap(([object, prop]) => this.watch(object, prop));
	});

	/// foo(bar, ...baz)
	evaluateRule("(", (a, b) => combine(evaluate(a), params(b))
		.map(([func, args]) => {
			if (typeof func !== "function") return;
			return Function.prototype.apply.call(func, a.object, args);
		})
	);

	/// foo if bar
	evaluateRule("if", (a, b) => evaluate(b).filter(_.isTrue).switchMap(() => evaluate(a)));


	/// foo.bar = baz
	evaluateRule("=", (a, b) => combine(evaluate(a), evaluate(b))
		.tap(([__, value]) => {
			if (Object(a.object) !== a.object) {
				return;
			}

			a.object[a.prop] = value;
		})
	);

	/// foo|bar:baz
	evaluateRule("|", (a, b, c) => combine(evaluate(a), of(b.value), params(c))
		.map(([value, pipe, args]) => {
			// if (typeof func !== "function") return;
			// return Function.prototype.apply.call(func, a.object, args);

			console.warn("pipe!!!!!!!!!!!", value, pipe, args);

			return value;
		})
	);

	// evaluateRule("=>");
	// evaluateRule("as");
	// evaluateRule("let");

	// exports.evaluate = evaluate;
	exports.Context = Context;

}());