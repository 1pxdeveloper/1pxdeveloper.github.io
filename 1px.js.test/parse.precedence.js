(function() {
	"use strict";

	/// Operator precedence
	let bp = 1000;

	function precedence(type, ...operators) {
		operators.forEach(operator => type[operator] = bp);
		bp -= 10;
	}

	const PREFIX = precedence.PREFIX = Object.create(null);
	const INFIX = precedence.INFIX = Object.create(null);

	precedence(PREFIX, "(");
	precedence(INFIX, ".", "[", "(");
	precedence(PREFIX, "!", "-", "+", "[", "{");
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

	exports.precedence = precedence;
}());