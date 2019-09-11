(function() {
	const script = Array.from(document.querySelectorAll("script")).pop();
	const prefix = script.getAttribute("src").slice(0, -"1px.js".length);
	
	const exports = Object.create(null);
	window.exports = exports;
	window.require = (path) => exports;
	
	const sources = [
		"observable.js",
		"1px.module.js",
		"utils.js",
		
		"parse.expression.js",
		"parse.watch.js",
		"parse.evaluate.js",
		"parse.context.js",
		
		"compile.js",
		
		"directive.foreach.js",
		"directive.if.js",
		
		"component.js",
		"batch.js",
		
		"1px.touch.js",
		// "import.js"
	
	];
	
	for (const src of sources) {
		document.write(`<script src="${prefix}${src}"></script>`);
	}
	
})();