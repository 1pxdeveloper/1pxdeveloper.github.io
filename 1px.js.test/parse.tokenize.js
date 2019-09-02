(function() {
	"use strict";

	/// Tokenizer
	const lex = [
		["(name)", /([_$a-zA-Z가-힣][_$a-zA-Z0-9가-힣]*)/],
		["(number)", /((?:\d*\.\d+)|\d+)/],
		["(string)", /('[^']*'|"[^"]*")/],
		["(operator)", /(===|!==|==|!=|<=|>=|=>|&&|\|\||[-|+*/!?:;.,<>=\[\]\(\){}])/],
		["(ws)", /(\s)/],
		["(unknown)", /./]
	];

	const regex = new RegExp(lex.map(v => v[1].source).join("|"), "g");

	function tokenize(script, $symbol_table) {
		/// assert: typeof script === "string";
		let tokens = [];

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
		tokens.index = 0;
		return tokens;
	}

	exports.tokenize = tokenize;
}());