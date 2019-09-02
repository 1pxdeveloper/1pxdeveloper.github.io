(function() {
	"use strict";
	
	
	/// Utils
	function _flat_tokens(token) {
		let tokens = [];
		
		let stack = [token];
		while(stack.length) {
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
		
		this.locals.some(local => {
			if (local && local[prop] !== undefined) {
				object = local;
				return true;
			}
			return false;
		});
		
		this.object = object;
		
		
		this.locals.forEach(local => {
			this.watch(local, prop);
		});
		this.watch(this.thisObj, prop);
		
		
		console.log("@@@@@@@@@@@@@@@", prop, this.thisObj === object, object && object[prop]);
		
		
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
		
		console.log("(name)", this, this.value);
		
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
		let func = setProp.call(this, a.value);
		return func && func.apply(this.object, b.map(evaluate));
	});
	
	/// foo.bar(baz)
	/// foo[bar](baz)
	evaluateRule("(", function(a, b, c) {
		let fn = setObjectProp.call(this, evaluate(a), b.id === "(name)" ? b.value : evaluate(b));
		
		
		let args = c.map(evaluate);
		
		console.log("args!!!!!!!!!!!!!!!!!!", args);
		console.log("!!!!!!!!!!!!!!!", fn, args, this.object);
		
		
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
		
		console.warn("@@@@@@@@@@@", b);
		
		
		let tokens = _flat_tokens(b);
		for (let token of tokens) {
			token.locals = [Object.create(null)].concat(token.locals);
		}
		
		return function(..._args) {
			let r = Object.create(null);
			args.forEach((name, index) => r[name] = _args[index]);
			tokens.forEach(token => token.locals[0] = r);
			return evaluate(b);
		}
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
	
	
	///
	
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
							watchers.push(watch$$(object, prop));
						}
					}
					
					const nextValue = () => {
						console.log("script", script, "nextValue!!");
						
						watchers = [];
						observer.next(evaluate(root));
						
						subscription = Observable.merge(...watchers).take(1).subscribe(() => {
							subscription.unsubscribe();
							Promise.resolve().then(nextValue);
						});
					};
					
					nextValue();
					
					return () => {
						if (subscription) subscription.unsubscribe();
					}
				});
			},
		}
	}
	
	exports.$parse = $parse;
}());