(function() {
	"use strict";
	
	const {precedence} = require();
	
	const castArray = (array) => Array.isArray(array) ? array : [array];
	const noop = () => {};
	
	
	/// expression
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
	
	function expression(rbp = 0) {
		let t = $token;
		next();
		
		let left = t.nud() || t;
		while($token.lbp > rbp) {
			t = $token;
			next();
			left = t.led(left) || t;
		}
		
		return left;
	}
	
	
	/// Symbol
	const $symbol_table = {};
	
	let $symbol_prototype = {
		length: 0,
		
		lbp: 0,
		nbp: 0,
		
		error(err) {
			throw SyntaxError(this.script + " " + err);
		},
		
		nud() {
			throw SyntaxError("Unexpected token " + this.id);
		},
		
		led() {
			throw SyntaxError("Missing Operator " + this.id);
		},
		
		push(token) {
			for (token of arguments) {
				this[this.length++] = token;
			}
			return token;
		},
		
		watch(object, prop) {},
	};
	
	function symbol(id) {
		let s = $symbol_table[id] = $symbol_table[id] || Object.create($symbol_prototype);
		s.id = id;
		return s;
	}
	
	function nud_of_constant() {
		this.id = "(literal)";
	}
	
	function nud_of_prefix() {
		this.push(expression(this.nbp));
	}
	
	function led_of_infix(left) {
		this.push(left, expression(this.lbp));
	}
	
	function lef_of_infixr(left) {
		this.push(left, expression(this.lbp - 1));
	}
	
	
	function constant(id, value) {
		let s = symbol(id);
		s.value = value;
		s.nud = nud_of_constant;
		return s;
	}
	
	function prefix(id, nud) {
		for (id of castArray(id)) {
			let s = symbol(id);
			s.nbp = precedence.PREFIX[id];
			s.nud = nud || nud_of_prefix;
		}
	}
	
	function infix(id, led) {
		for (id of castArray(id)) {
			let s = symbol(id);
			s.lbp = precedence.INFIX[id];
			s.led = led || led_of_infix;
		}
	}
	
	function infixr(id, led) {
		for (id of castArray(id)) {
			let s = symbol(id);
			s.lbp = precedence.INFIX[id];
			s.led = led || lef_of_infixr;
		}
	}
	
	
	// Define Symbols
	symbol(":");
	symbol(")");
	symbol("]");
	symbol("}");
	symbol(",");
	symbol("=>");
	
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
	
	symbol("(end)").nud = noop;
	symbol("(literal)").nud = noop;
	symbol("(name)").nud = noop;
	symbol("this").nud = noop;
	
	
	/// Basic Operators
	prefix(["+", "-", "!"]);
	infix(["+", "-", "*", "/", "%", "%%", ";", "if"]);
	infixr(["===", "!==", "==", "!=", "<", "<=", ">", ">=", "&&", "||"]);
	
	
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
		this.push(left, expression(), next(":") && expression());
	});
	
	/// [foo, bar, baz, ...]
	prefix("[", function() {
		let args = this.push([]);
		
		if ($token.id !== "]") {
			do { args.push(expression()); }
			while($token.id === "," && next(","));
		}
		
		next("]");
	});
	
	
	/// {foo: bar, ...}
	prefix("{", function() {
		let args = this.push([]);
		
		if ($token.id !== "}") {
			do {
				if ($token.id !== "(name)" && $token.id !== "(literal)") {
					throw SyntaxError("Unexpected token " + $token.id);
				}
				
				let key = next().value;
				next(":");
				
				let o = expression();
				o.key = key;
				args.push(o);
				
			} while($token.id === "," && next(","))
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
			do { args.push(expression()); }
			while($token.id === "," && next(","))
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
			do {
				args.push(next("(name)"));
			} while($token.id === "," && next(","))
			
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
	
	
	/// foo => bar
	infix("=>", function(left) {
		this.push([left], expression());
	});
	
	
	/// foo = bar
	infixr("=", function(left) {
		if (left.id !== "." && left.id !== "[" && left.id !== "(name)") {
			left.error("Invalid left-hand side in assignment.");
		}
		
		this.push(left);
		this.push(expression(this.lbp - 1));
	});
	
	
	/// foo | bar: baz, ...
	infix("|", function(left) {
		let args = this.push(left, next("(name)"), []);
		
		if ($token.id === ":") {
			next(":");
			
			do {
				args.push(expression());
			} while($token.id === "," && next(","))
		}
	});
	
	
	/// Tokenizer
	const lex = [
		["(name)", /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)/],
		["(number)", /((?:\d*\.\d+)|\d+)/],
		["(string)", /('[^']*'|"[^"]*")/],
		["(operator)", /(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/!?:;.,<>=\[\]\(\){}])/],
		["(ws)", /(\s)/],
		["(unknown)", /./],
	];
	
	const regex = new RegExp(lex.map(v => v[1].source).join("|"), "g");
	
	function tokenize(script) {
		/// assert: typeof script === "string";
		let tokens = [];
		tokens.index = 0;
		
		script.replace(regex, function(value, ...args) {
			
			/// Parse Type
			let type = lex[args.findIndex(v => v)][0];
			
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
					token = Object.create($symbol_table[value] || null);
					token.value = value;
					tokens.push(token);
					break;
				
				case "(unknown)":
					throw SyntaxError("Unexpected token: " + value);
			}
			
			return value;
		});
		
		// tokens.forEach(token => token.script = script);
		
		/// parse Tree
		$tokens = tokens;
		next();
		let root = expression();
		root.tokens = tokens;
		
		return root;
	}
	
	exports.tokenize = tokenize;
}());