(function() {
	let script = Array.from(document.querySelectorAll("script")).pop();
	let src = script.getAttribute("src");
	let pref = src.slice(0, -"1px.js".length);
	
	let exports = Object.create(null);
	window.exports = exports;
	window.require = (path) => exports;
	
	[
		"observable.js",
		"observable.static.js",
		"observable.operators.js",
		
		"module.js",
		
		"parse.expression.js",
		"parse.watch.js",
		"parse.evaluate.js",
		
		"parse.context.js",
		
		"compile.js",
		
		"directive.foreach.js",
		"directive.if.js",
		
		"batch.js",
	
	].forEach(src => {
		document.write(`<script src="${pref}${src}"></script>`);
	});
	
})();