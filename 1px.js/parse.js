(function() {
	"use strict";

	const {Observable, Subject, BehaviorSubject} = require("./observable");

	function noop() {}

	function foreach(arr, fn) {
		for (let i = 0, len = arr.length; i < len; i++) {
			fn(arr[i], i);
		}
	}


	/// watch$
	const watch$ = (function() {

		/// WATCH
		const ARRAY_METHODS = ["reverse", "splice", "push", "pop", "unshift", "shift", "sort"];
		const DATE_METHODS = ["setDate", "setFullYear", "setHours", "setMilliseconds", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCSeconds", "setYear"];

		function mutationObservableFromClass$(object, methods) {
			let key = methods[0];
			let observable$ = object[key].observable$;

			return observable$ = observable$ || new Observable(observer => {
				let prototype = Object.getPrototypeOf(object);
				let wrap = Object.create(prototype);
				Object.setPrototypeOf(object, wrap);

				for (let method of methods) {
					wrap[method] = function() {
						let result = prototype[method].apply(this, arguments);
						observer.next(this);
						observer.complete();
						return result;
					}
				}
				wrap[key].observable$ = observable$;

				return () => {
					delete wrap[key].observable$;
					Object.setPrototypeOf(object, prototype);
				}

			}).share();
		}


		function mutationObservable$(object) {
			if (Array.isArray(object)) return mutationObservableFromClass$(object, ARRAY_METHODS);
			if (object instanceof Date) return mutationObservableFromClass$(object, DATE_METHODS);
			return Observable.NEVER;
		}


		function watch$(object, prop) {

			if (Object(object) !== object) {
				return Observable.NEVER;
			}

			if (Array.isArray(object) && +prop === prop) {
				return Observable.NEVER;
			}

			let desc = Object.getOwnPropertyDescriptor(object, prop);
			if (desc) {
				if (desc.set && desc.set.observable$) {
					return desc.set.observable$;
				}

				if (desc.configurable === false || desc.writable === false) {
					return mutationObservable$(object[prop]);
				}
			}

			let observable$ = new Observable(observer => {
				let value = object[prop];
				let subscription = mutationObservable$(value).subscribe(observer);

				function set(newValue) {
					if (Object.is(value, newValue)) {
						return;
					}
					value = newValue;
					observer.next(value);
					observer.complete();
				}

				set.observable$ = observable$;

				Object.defineProperty(object, prop, {
					enumerable: true,
					configurable: true,
					get: () => value,
					set: set,
				});

				return () => {
					subscription.unsubscribe();
					delete set.observable$;
					delete object[prop];
					object[prop] = value;
				}

			}).share();

			return observable$;
		}

		return watch$;
	})();


	/// Tokenizer
	tokenize.re = /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)|((?:\d*\.\d+)|\d+)|('[^']*'|"[^"]*")|(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/!?:;.,<>=\[\]\(\){}])|(\s)|./g;

	tokenize.types = [
		"",
		"(name)",
		"(number)",
		"(string)",
		"(operator)",
		"(ws)",
		"(unknown)",
	];

	function tokenize(script) {
		/// assert: typeof script === "string";

		let tokens = [];

		script.replace(tokenize.re, function(value) {

			/// Parse Type
			let type;
			for (let i = 1; i < arguments.length; i++) {
				if (arguments[i]) {
					type = tokenize.types[i];
					break;
				}
			}

			/// Create Token
			let token;
			switch (type) {
				case "(name)":
					token = Object.create($symbol_table[value] || $symbol_table["(name)"]);
					token.value = "value" in token ? token.value : value;
					tokens.push(token);
					break;

				case "(number)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = +value;
					tokens.push(token);
					break;

				case "(string)":
					token = Object.create($symbol_table["(literal)"]);
					token.value = value.slice(1, -1);
					tokens.push(token);
					break;

				case "(operator)":
					token = Object.create($symbol_table[value]);
					token.value = value;
					tokens.push(token);
					break;

				case "(unknown)":
					throw SyntaxError("Unexpected token " + value);
			}

			return value;
		});

		tokens.forEach(token => token.script = script);
		tokens.index = 0;
		return tokens;
	}


	/// Operator precedence
	const PREFIX = 1;
	const INFIX = 2;

	function precedence(type, ...operators) {
		operators.forEach(operator => {
			precedence[type][operator] = precedence.bp;
		});
		precedence.bp -= 10;
	}

	precedence.bp = 10000;
	precedence[PREFIX] = Object.create(null);
	precedence[INFIX] = Object.create(null);

	precedence(PREFIX, "(");
	precedence(INFIX, ".", "[", "(");
	precedence(PREFIX, "!", "-", "+");
	precedence(INFIX, "**");
	precedence(INFIX, "*", "/", "%", "%%");
	precedence(INFIX, "+", "-");
	precedence(INFIX, "|");
	precedence(INFIX, "<", ">", ">=", "in");
	precedence(INFIX, "===", "!==", "==", "!=");
	precedence(INFIX, "&&");
	precedence(INFIX, "||");
	precedence(INFIX, "?");
	precedence(INFIX, "as");
	precedence(INFIX, "=");
	precedence(INFIX, "if");
	precedence(INFIX, ";");
	precedence(INFIX, "=>");


	////////////////
	let $tokens;
	let $token;

	function next(id) {
		if (id && $token && $token.id !== id) {
			$token.error("Unexpected token: " + $token.id);
			return;
		}

		let t = $token;
		$token = $tokens[$tokens.index++] || $symbol_table["(end)"];
		return t;
	}

	function expression(rbp) {
		rbp = rbp || 0;

		let t = $token;
		next();

		let left = t.nud() || t;
		while ($token.lbp > rbp) {
			t = $token;
			next();
			left = t.led(left) || t;
		}

		return left;
	}


	/// Symbol
	let $symbol_prototype = {
		lbp: 0,
		nbp: 0,
		length: 0,

		error(err) {
			throw SyntaxError(this.script + " " + err);
		},

		nud() {
			throw SyntaxError("Undefined.");
		},

		led() {
			throw SyntaxError("Missing Operator.");
		},

		push() {
			for (let token of arguments) {
				this[this.length++] = token;
			}

			return arguments[arguments.length - 1];
		},

		watch(object, prop) {},

		setProp(prop) {
			this.prop = prop;

			this.locals.forEach(local => {
				this.watch(local, prop);
			});
			this.watch(this.scope, prop);

			// /// @TODO; locals
			let object = this.scope;

			this.locals.some(local => {
				if (local && local[prop] !== undefined) {
					object = local;
					return true;
				}
				return false;
			});

			this.object = object;
			return object && object[prop];
		},

		setObjectProp(object, prop) {
			this.object = object;
			this.prop = prop;
			this.watch(object, prop);
			return object && object[prop];
		},
	};


	let $symbol_table = {};

	function symbol(id) {
		let s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
		s.id = id;
		return s;
	}

	function default_constant_nud() {
		this.id = "(literal)";
	}

	function default_prefix_nud() {
		this.push(expression(this.nbp));
	}

	function default_infix_led(left) {
		this.push(left, expression(this.lbp));
	}

	function default_infixr_led(left) {
		this.push(left, expression(this.lbp - 1));
	}

	function constant(id, value) {
		let s = symbol(id);
		s.value = value;
		s.nud = default_constant_nud;
		return s;
	}

	function prefix(id, nud) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.nbp = precedence[PREFIX][id];
			s.nud = nud || default_prefix_nud;
		});
	}

	function infix(id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.lbp = precedence[INFIX][id];
			s.led = led || default_infix_led;
		});
	}

	function infixr(id, led) {
		foreach(Array.isArray(id) ? id : [id], function(id) {
			let s = symbol(id);
			s.lbp = precedence[INFIX][id];
			s.led = led || default_infixr_led;
		});
	}


	// Define Symbols
	constant("true", true);
	constant("false", false);
	constant("undefined", undefined);
	constant("null", null);
	constant("NaN", NaN);
	constant("Math", Math);
	constant("Date", Date);
	constant("Boolean", Boolean);
	constant("Number", Number);
	constant("Array", Array);
	constant("Object", Object);

	symbol(":");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol(",");
	symbol("=>");

	symbol("(end)").nud = noop;
	symbol("(literal)").nud = noop;
	symbol("(name)").nud = noop;
	symbol("this").nud = noop;


	infix(";");
	infix("if");

	infixr(["&&", "||"]);
	infixr(["===", "!==", "==", "!=", "<", "<=", ">", ">="]);

	infix(["+", "-"]);
	infix(["*", "/"]);

	prefix(["+", "-", "!"]);

	/// foo = bar
	infixr("=", function(left) {
		if (left.id !== "." && left.id !== "[" && left.id !== "(name)") {
			left.error("Invalid left-hand side in assignment.");
		}

		this.push(left);
		this.push(expression(this.lbp - 1));
	});

	/// foo.bar
	infix(".", function(left) {
		this.push(left, next("(name)"));
	});

	/// foo[bar]
	infix("[", function(left) {
		this.push(left, expression());
		next("]");
	});

	/// foo ? bar : baz
	infix("?", function(left) {
		this.push(left, expression());
		next(":");
		this.push(expression());
	});

	/// [foo, bar, baz, ...]
	prefix("[", function() {
		let args = this.push([]);

		if ($token.id !== "]") {
			for (; ;) {
				args.push(expression());
				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}

		next("]");
	});


	/// {foo: bar, ...}
	prefix("{", function() {
		let args = this.push([]);

		if ($token.id !== "}") {
			for (; ;) {
				if ($token.id !== "(name)" && $token.id !== "(literal)") {
					throw SyntaxError("Unexpected token " + $token.id);
				}

				let key = next().value;
				next(":");

				let o = expression();
				o.key = key;
				args.push(o);

				if ($token.id !== ",") {
					break;
				}

				next(",");
			}
		}

		next("}");
	});

	/// foo(bar, ...)
	/// foo.bar(baz, ...)
	infix("(", function(left) {
		let args = [];

		/// foo(bar, ...)
		if (left.id === "." || left.id === "[") {
			this.push(left[0], left[1], args);
		}

		/// foo.bar(baz, ...)
		else {
			this.push(left, args);
		}

		if ($token.id !== ")") {
			for (; ;) {
				args.push(expression());
				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}

		next(")");
	});


	/// (foo, ...) => bar
	/// () => bar
	/// (foo) => bar
	/// (foo)
	prefix("(", function() {

		let lookahead = $tokens[$tokens.index];
		let lookahead2 = $tokens[$tokens.index + 1];

		/// (foo, ...) => bar
		/// (foo) => bar
		if (lookahead.id === "," || (lookahead.id === ")" && lookahead2 && lookahead2.id === "=>")) {
			this.id = "=>";
			let args = this.push([]);

			for (; ;) {
				args.push(next("(name)"));
				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
			next(")");

			next("=>");

			this.push(expression());
			return;
		}

		/// (foo)
		let e = expression();
		next(")");
		return e;
	});


	/// foo as bar, baz
	infix("as", function(left) {
		this.push(left, next("(name)"));

		if ($token.id === ",") {
			next(",");
			this.push(next("(name)"));
		}
		else {
			this.push({});
		}
	});

	/// foo | bar: baz, ...
	infix("|", function(left) {
		let args = this.push(left, next("(name)"), []);

		if ($token.id === ":") {
			next(":");

			for (; ;) {
				args.push(expression());
				if ($token.id !== ",") {
					break;
				}
				next(",");
			}
		}
	});

	infix("=>", function(left) {
		this.push([left]);
		this.push(expression());
	});


	/// Evaluate
	let evaluateRules = {};

	function evaluate(token) {
		try {
			return evaluateRules[token.id][token.length].apply(token, token);
		} catch (e) {
			console.error(e);
			console.warn(token);
		}
	}

	function evaluateRule(id, fn) {
		let length = fn.length;
		evaluateRules[id] = evaluateRules[id] || {};
		evaluateRules[id][length] = fn;
	}

	evaluateRule("(end)", () => undefined);
	evaluateRule("(literal)", function() {
		return this.value;
	});

	evaluateRule("[", (a) => a.map(evaluate));

	evaluateRule("{", (a) => {
		return a.reduce((object, o) => {
			object[o.key] = evaluate(o);
			return object;
		}, {});
	});

	evaluateRule("+", (a) => +evaluate(a));
	evaluateRule("-", (a) => -evaluate(a));
	evaluateRule("!", (a) => !evaluate(a));

	evaluateRule(";", (a, b) => {
		evaluate(a);
		return evaluate(b);
	});

	evaluateRule("&&", (a, b) => evaluate(a) && evaluate(b));
	evaluateRule("||", (a, b) => evaluate(a) || evaluate(b));
	evaluateRule("===", (a, b) => evaluate(a) === evaluate(b));
	evaluateRule("!==", (a, b) => evaluate(a) !== evaluate(b));
	evaluateRule("==", (a, b) => evaluate(a) == evaluate(b));
	evaluateRule("!=", (a, b) => evaluate(a) != evaluate(b));
	evaluateRule("<", (a, b) => evaluate(a) < evaluate(b));
	evaluateRule("<=", (a, b) => evaluate(a) <= evaluate(b));
	evaluateRule(">", (a, b) => evaluate(a) > evaluate(b));
	evaluateRule(">=", (a, b) => evaluate(a) >= evaluate(b));

	evaluateRule("+", (a, b) => evaluate(a) + evaluate(b));
	evaluateRule("-", (a, b) => evaluate(a) - evaluate(b));
	evaluateRule("*", (a, b) => evaluate(a) * evaluate(b));
	evaluateRule("/", (a, b) => evaluate(a) / evaluate(b));
	evaluateRule("%", (a, b) => evaluate(a) % evaluate(b));

	evaluateRule("?", (a, b, c) => evaluate(a) ? evaluate(b) : evaluate(c));

	evaluateRule("(name)", function() {
		return this.setProp(this.value);
	});

	evaluateRule("this", function() {
		return this.scope;
	});

	evaluateRule(".", function(a, b) {
		return this.setObjectProp(evaluate(a), b.value);
	});

	evaluateRule("[", function(a, b) {
		return this.setObjectProp(evaluate(a), evaluate(b));
	});

	evaluateRule("(", function(a, b) {
		let fn = this.setProp(a.value);
		return fn && fn.apply(this.object, b.map(evaluate));
	});

	/// foo.bar(...baz)
	evaluateRule("(", function(a, b, c) {
		let fn = this.setObjectProp(evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
		return fn && fn.apply(this.object, c.map(evaluate));
	});


	evaluateRule("=", function(a, b) {
		let A = evaluate(a);
		let B = evaluate(b);

		if (a.object) {
			a.object[a.prop] = B;
		}

		return B;
	});


	evaluateRule("|", function(a, b, c) {
		let value = evaluate(a);
		let args = c.map(evaluate);

		/// @FIXME: ...
		return $module.pipe.require(b.value, pipe => {
			return pipe(value, ...args);
		});
	});

	/// foo if bar
	evaluateRule("if", function(a, b) {
		this.ifcondition = evaluate(b);
		if (this.ifcondition) {
			return evaluate(a);
		}

		return undefined;
	});


	function _flat_tokens(token) {
		let tokens = [];

		let stack = [token];
		while (stack.length) {
			let t = stack.pop();
			tokens.push(t);
			if (t.length) {
				foreach(t, o => stack.push(o));
			}
		}

		return tokens;
	}

	evaluateRule("=>", function(a, b) {
		let args = a.map(v => v.value);
		let tokens = _flat_tokens(b);

		return function(..._args) {
			let r = Object.create(null);
			args.forEach((key, index) => r[key] = _args[index]);
			tokens.forEach(token => token.locals = [r].concat(token.originalLocals));

			console.log(b);


			return evaluate(b);
		}
	});

	evaluateRule("as", function(a, b, c) {

		let arrayLike = evaluate(a) || [];

		let name_of_item = b.value;
		let name_of_index = c.value || "";

		let ret = Array.from(arrayLike).map((value, index) => {
			let r = Object.create(null);
			r[name_of_index] = index;
			r[name_of_item] = value;
			r["@@entries"] = [value, index];
			return r;
		});

		ret["@@keys"] = [name_of_item, name_of_index];
		return ret;
	});


	/// $parse
	function setContext(tokens, scope, locals) {
		tokens.forEach(function(token) {
			token.scope = scope;
			token.originalLocals = locals || [];
			token.locals = token.originalLocals.slice();
		});
	}

	function $parse(script) {
		$tokens = tokenize(script);
		let tokens = $tokens.slice();

		next();
		let root = expression();

		function $expr(context, locals) {
			setContext(tokens, context, locals);
			return evaluate(root);
		}

		$expr.assign = function(value, context, locals) {
			setContext(tokens, context, locals);
			evaluate(root);

			if (!root.object || !root.prop || root.ifcondition === false) {
				return false;
			}

			root.object[root.prop] = value;
			return true;
		};


		$expr.watch$ = function(context, locals) {
			return new Observable(function(observer) {
				setContext(tokens, context, locals);

				let subscription;
				let watchers = [];
				tokens.forEach(token => {
					token.watch = function(object, prop) {
						watchers.push(watch$(object, prop));
					};
				});

				function nextValue() {
					watchers = [];
					let value = evaluate(root);
					if (root.ifcondition !== false) {
						value instanceof Observable ? value.subscribe(observer) : observer.next(value);
					}

					subscription = Observable.merge(...watchers).take(1).subscribe(_ => {
						nextTick(nextValue);
					});
				}

				nextValue();

				return function() {
					subscription && subscription.unsubscribe();
				}
			});
		};

		return $expr;
	}


	const nextTick = function() {

		let index = 0;
		let queue = [];

		function nextTick(callback) {
			if (callback && typeof callback !== "function") throw TypeError("argument is must be function.");

			if (queue.length === 0) {
				Promise.resolve().then(() => nextTick.commit());
			}
			queue.push(callback);
		}

		nextTick.commit = function() {
			let callback;
			while ((callback = queue[index++])) {
				callback();
			}

			index = 0;
			queue.length = 0;
		};

		return nextTick;
	}();


	/// @FIXME: JS는 말고 템플릿에서도 적용되는데... 1pxContext 처럼 이름을 지으면 붙여줘야겠다.
	class JSContext {
		static get nextTick() {
			return nextTick;
		}

		static parse(script) {
			return $parse(script);
		}

		/// @TODO: thisObj
		static connect(global, locals, thisObj) {
			let context = new JSContext(global, locals, thisObj);
			let ret = context.watch$.bind(context);
			Object.setPrototypeOf(ret, context);

			// @FIXME:...
			ret.nextTick = nextTick;
			return ret;
		}

		constructor(global, locals, thisObj) {
			this.global = global || Object.create(null);
			this.locals = locals || [];
			this.thisObj = thisObj;
			this.disconnect$ = new Subject();
		}

		disconnect() {
			this.disconnect$.complete();
		}

		fork(local, thisObj) {
			local = local || Object.create(null);
			return JSContext.connect(this.global, [local].concat(this.locals), thisObj);
		}

		evaluate(script) {
			return $parse(script)(this.global, this.locals);
		}

		assign(script, value) {
			return $parse(script).assign(value, this.global, this.locals);
		}

		/// @TODO: script 가 array 면?? watch$(['a', 'b', 'c'], ...)
		/// @TODO: script 가 template 면?? watch$(`this.dkjfksfd `) script.raw 확인....
		/// @TODO: fn이 있던 없던 Observer로??
		watch$(script, fn) {
			script = String(script).trim();

			let value;
			let next = typeof fn === "function" ? fn : noop;

			let subject = new BehaviorSubject();

			$parse(script).watch$(this.global, this.locals).takeUntil(this.disconnect$).do(next).subscribe(subject);

			if (typeof fn === "function") {
				return;
			}

			return subject.map(v => v);
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
})();