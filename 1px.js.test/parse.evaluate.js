(function() {
	"use strict";


	/// Utils
	function _flat_tokens(token) {
		let tokens = [];

		let stack = [token];
		while (stack.length) {
			let t = stack.pop();
			tokens.push(t);
			for (let i = 0; i < t.length; i++) {
				stack.push(t[i]);
			}
		}

		return tokens;
	}

	function setProp(prop) {
		this.prop = prop;

		/// @TODO; locals
		let object = this.thisObj;

		if (Object(this.local) === this.local && prop in this.local) {
			object = this.local;
		}
		else {
			this.locals.some(local => {
				if (local && local[prop] !== undefined) {
					object = local;
					return true;
				}
				return false;
			});
		}

		this.object = object;


		this.watch(this.local, prop);
		this.locals.forEach(local => this.watch(local, prop));
		this.watch(this.thisObj, prop);


		// console.warn("@@@@@@@@@ [setProp]", object, prop);


		return object && object[prop];
	}

	function setObjectProp(object, prop) {
		this.object = object;
		this.prop = prop;
		this.watch(object, prop);
		return object && object[prop];
	}

	/// Evaluate
	const $evaluateRules = {};
	
	function evaluate(token) {
		return $evaluateRules[token.id][token.length].apply(token, token);
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

	/// foo
	evaluateRule("(name)", function() {
		return setProp.call(this, this.value);
	});

	/// foo.bar
	evaluateRule(".", function(a, b) {
		return setObjectProp.call(this, evaluate(a), b.value);
	});

	/// foo[bar]
	evaluateRule("[", function(a, b) {
		return setObjectProp.call(this, evaluate(a), evaluate(b));
	});


	/// foo(bar, ...baz)
	evaluateRule("(", function(a, b) {
		let func = evaluate(a);
		return func && func.apply && func.apply(a.object, b.map(evaluate));
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

		if (!this.arrowFunction) {
			let argN = a.map(v => v.value);
			let tokens = _flat_tokens(b);
			let local = Object.create(null);
			tokens.forEach(token => token.local = local);

			this.arrowFunction = function(...args) {
				argN.forEach((name, index) => local[name] = args[index]);
				return evaluate(b);
			}
		}

		return this.arrowFunction;
	});


	/// foo if bar
	evaluateRule("if", function(a, b) {
		this.ifcondition = evaluate(b);
		if (this.ifcondition) {
			return evaluate(a);
		}
	});


	/// foo as bar
	evaluateRule("as", function(a, b, c) {

		let arrayLike = evaluate(a) || [];

		let name_of_item = b.value;
		let name_of_index = c.value;

		return Array.from(arrayLike).map((value, index) => {
			let r = Object.create(null);
			r[name_of_item] = value;
			if (name_of_index) r[name_of_index] = index;

			/// @FIXME:.. 이거 없애는 방법을 찾자.
			r["@@entries"] = [value, index];
			return r;
		});
	});


	/// $parse
	const {tokenize, watch$$} = require();

	function $parse(script) {
		let root = tokenize(script);
		let tokens = root.tokens;

		return {
			evaluate(thisObj, ...locals) {
				for (let token of tokens) {
					token.thisObj = thisObj;
					token.locals = locals;
				}
				return evaluate(root);
			},

			assign(value, thisObj, ...locals) {
				this.evaluate(thisObj, ...locals);

				if (root.object && root.object) {
					root.object[root.prop] = value;
				}
			},

			watch(thisObj, ...locals) {
				return new Observable(observer => {

					let watchers;
					let subscription;

					for (let token of tokens) {
						token.thisObj = thisObj;
						token.locals = locals;

						token.watch = (object, prop) => {
							if (Object(object) !== object) return;
							watchers.push(watch$$(object, prop));
						}
					}

					const nextValue = () => {
						watchers = [];

						// console.warn("[script]", script);

						let value = evaluate(root);
						if (root.ifcondition !== false) {
							observer.next(value);
						}

						subscription = Observable.merge(...watchers).take(1).subscribe(() => {
							// console.warn("changed! [script]", script);

							subscription.unsubscribe();


							for (let token of tokens) {
								if (token.prop && Object(token.object) === token.object) {
									let v = token.object[token.prop];
									if (Array.isArray(v) && v.reverse.observable$) {
										v.splice();
									}
								}
							}


							/// @TODO: nextTick? commit?
							nextTick(nextValue);
						});
					};

					nextValue();

					return () => {
						// console.warn("unwatch [script]", script);
						if (subscription) subscription.unsubscribe();
					}
				});
			},
		}
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
			// console.log("");
			// console.log("--- commit ---");
			// console.log("");

			for (let callback; (callback = queue[index++]);) {
				callback();
			}

			index = 0;
			queue.length = 0;
		};

		return nextTick;
	}();


	exports.$parse = $parse;
	exports.nextTick = nextTick;

}());