(function() {
	"use strict";


	/// Utils
	function _flat_tokens(token) {
		let tokens = [];

		let stack = [token];
		while (stack.length) {
			let t = stack.pop();
			tokens.push(t);
			for (let o of t) stack.push(o);
		}

		return tokens;
	}


	/// Evaluate
	const $evaluateRules = {};

	function evaluate(token) {
		try {
			return $evaluateRules[token.id][token.length].apply(token, token);
		} catch (e) {
			console.warn(token);
			console.error(e);
		}
	}

	function evaluateRule(id, callback) {
		$evaluateRules[id] = $evaluateRules[id] || Object.create(null);
		$evaluateRules[id][callback.length] = callback;
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

	evaluateRule(";", (a, b) => {
		evaluate(a);
		return evaluate(b);
	});

	evaluateRule("this", function() {
		return this.thisObj;
	});


	/// @TODO: access scope....

	/// foo
	evaluateRule("(name)", function() {
		return this.setProp(this.value);
	});

	/// foo.bar
	evaluateRule(".", function(a, b) {
		return this.setObjectProp(evaluate(a), b.value);
	});

	/// foo[bar]
	evaluateRule("[", function(a, b) {
		return this.setObjectProp(evaluate(a), evaluate(b));
	});


	/// foo(bar, ...baz)
	evaluateRule("(", function(a, b) {
		let func = this.setProp(a.value);
		return func && func.apply(this.object, b.map(evaluate));
	});

	/// foo.bar(baz)
	/// foo[bar](baz)
	evaluateRule("(", function(a, b, c) {
		let fn = this.setObjectProp(evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
		return fn && fn.apply(this.object, c.map(evaluate));
	});


	/// foo = bar
	evaluateRule("=", function(a, b) {
		let A = evaluate(a);
		let B = evaluate(b);

		if (a.object) {
			a.object[a.prop] = B;
		}

		return B;
	});


	/// foo | bar: baz
	evaluateRule("|", function(a, b, c) {
		let value = evaluate(a);
		let args = c.map(evaluate);

		/// @FIXME: ...
		return $module.pipe.require(b.value, pipe => {
			return pipe(value, ...args);
		});
	});

	/// foo => bar
	evaluateRule("=>", function(a, b) {
		let args = a.map(v => v.value);
		let tokens = _flat_tokens(b);

		return function(..._args) {
			let r = Object.create(null);
			args.forEach((name, index) => r[name] = _args[index]);
			tokens.forEach(token => token.locals = [r].concat(token.originalLocals));
			return evaluate(b);
		}
	});


	/// foo if bar
	evaluateRule("if", function(a, b) {
		this.ifcondition = evaluate(b);
		if (this.ifcondition) {
			return evaluate(a);
		}

		return undefined;
	});


	/// foo as bar
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


	exports.evaluate = evaluate;
}());