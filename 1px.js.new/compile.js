(function() {
	"use strict";

	const {$module} = require("./module");
	const {Context} = require("./parse.evaluate");


	/// -----------------------------------------------------------------------
	/// traverseDOM
	/// -----------------------------------------------------------------------
	function traverseDOM(node, callback) {
		if (!node) return;

		const queue = ("length" in node) ? Array.from(node) : [node];

		while (queue.length) {
			node = queue.shift();

			// Option: Closing,
			if (typeof node === "function") {
				node();
				continue;
			}

			// Option: Skip children,
			let ret = callback(node);
			if (ret === false) {
				continue;
			}

			// Traverse ChildNodes
			if (node.childNodes) {
				if (typeof ret === "function") queue.unshift(ret);
				queue.unshift.apply(queue, node.childNodes);
			}
		}
	}


	/// -----------------------------------------------------------------------
	/// Compile
	/// -----------------------------------------------------------------------
	const $compile = (el, context) => {

		if (!(context instanceof Context)) {
			context = new Context(context);
		}

		traverseDOM(el, (node) => {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					// console.group(node.nodeName, node);
					const ret = _$compile_element_node(node, context);
					// console.groupEnd();
					return ret;

				case Node.TEXT_NODE:
					// console.log(node);
					return _$compile_text_node(node, context);
			}
		});
	};


	/// -----------------------------------------------------------------------
	/// Compile Element
	/// -----------------------------------------------------------------------
	function _$compile_element_node(el, context) {
		if (el.tagName === "SCRIPT") return false;
		if (el.tagName === "STYLE") return false;

		const attributes = Array.from(el.attributes);
		const to = el;


		const hasTemplateDirective = ["*foreach", "*if", "*else"].some(attrName => {
			const attr = el.getAttributeNode(attrName);
			if (!attr) return false;

			$module.directive.require([attr.nodeName, (directive) => {
				directive(context, el, attr.nodeValue, attr.nodeName)
			}]);

			return true;
		});

		if (hasTemplateDirective) {
			return false;
		}

		for (const attr of attributes) {

			// /// Custom Directives
			// /// @TODO: custom-directive 등록할때 아래처럼 syntax를 등록하는건 어떨까?
			// let customDefaultPrevent = false;
			// $module.directive.require([attr.nodeName, directive => {
			// 	if (typeof directive === "function") {
			// 		let ret = directive(context, el, attr.nodeValue);
			// 		customDefaultPrevent = ret === false;
			// 	}
			// }]);
			// if (customDefaultPrevent) continue;


			/// Basic Directives
			if (templateSyntax(context, to, attr, "(", _event, ")")) continue;
			if (templateSyntax(context, to, attr, "[attr.", _attr, "]")) continue;
			// if (templateSyntax(context, to, attr, "[visible.", _visible2, "]")) continue;
			if (templateSyntax(context, to, attr, "[visible", _visible, "]")) continue;
			if (templateSyntax(context, to, attr, "[class.", _class, "]")) continue;
			if (templateSyntax(context, to, attr, "[style.", _style, "]")) continue;
			// if (templateSyntax(context, to, attr, "[show.", _transition, "]")) continue;
			if (templateSyntax(context, to, attr, "[(", _twoway, ")]")) continue;
			if (templateSyntax(context, to, attr, "[", _prop, "]")) continue;
			// if (templateSyntax(context, to, attr, "$", _ref2, "")) continue;
			// if (templateSyntax(context, to, attr, "#", _ref, "")) continue;
			// if (templateSyntax(context, to, attr, ".", _call, ")")) continue;
		}
	}

	function templateSyntax(context, el, attr, start, callback, end) {
		const {nodeName, nodeValue} = attr;
		if (nodeName.startsWith(start) && nodeName.endsWith(end)) {
			callback(context, el, nodeValue, nodeName.slice(start.length, -end.length));
			// el.removeAttributeNode(attr); // @TODO: DEBUG mode
			return true;
		}
	}

	const rAF$ = (value) => new Observable(observer => {

		if (document.readyState !== "complete") {
			observer.next(value);
			observer.complete();
			return;
		}

		return _.rAF(() => {
			observer.next(value);
			observer.complete();
		});
	});

	const renderPipeLine = $ => $.distinctUntilChanged().switchMap(rAF$);


	function _visible(context, el, script, name) {

	}

	function _attr(context, el, script, attr) {
		return context(script)
			.pipe(renderPipeLine)
			.tap(value => _.isStringLike(value) ? el.setAttribute(attr, value) : el.removeAttribute(attr))
			.subscribe()
	}

	function _class(context, el, script, name) {
		return context(script)
			.pipe(renderPipeLine)
			.tap(value => value ? el.classList.add(name) : el.classList.remove(name))
			.subscribe()
	}

	function _style(context, el, script, name) {
		const [prop, unit = ""] = name.split(".", 2);

		return context(script)
			.pipe(renderPipeLine)
			.map(value => {
				switch (unit) {
					case "url":
						return "url('" + encodeURI(value) + "')";

					default:
						return value + unit;
				}
			})
			.tap(value => el.style[prop] = value)
			.trace("Style!")
			.subscribe();
	}

	function _twoway(context, el, script, name) {

	}

	function _prop(context, el, script, name) {
		return context(script)
		// .pipe(renderPipeLine) // @TODO: hasOwnProperty가 없는데 HTMLElement가 가지고 있는 경우에는 renderPipe를 통해야함. ex) id, src 등...
			.tap(value => el[name] = value)
			.subscribe()
	}

	Event.pipes = {
		prevent: $ => $.tap(e => e.preventDefault()),
		stop: $ => $.tap(e => e.stopPropagation()),
		capture: $ => $,
		self: ($, element) => $.filter(e => e.target === element),
		once: $ => $.take(1),
		shift: $ => $.filter(e => e.shiftKey),
		alt: $ => $.filter(e => e.altKey),
		ctrl: $ => $.filter(e => e.ctrlKey),
		meta: $ => $.filter(e => e.metaKey),
		cmd: $ => $.filter(e => e.ctrlKey || e.metaKey)
	};

	function _event(context, el, script, value) {

		let [type, ...options] = value.split(/\s*\|\s*/);
		const useCapture = options.includes("capture");

		/// @FIXME: Keyboard Event
		let keys = [];
		if (type.startsWith("keydown") || type.startsWith("keypress") || type.startsWith("keyup")) {
			[type, ...keys] = type.split(".");
		}

		/// Normal Event
		let event$ = context.fromEvent(el, type, useCapture);
		if (keys.length) {
			event$ = event$.filter(e => keys.includes(e.key.toLowerCase()))
		}

		/// Event Pipe
		options.forEach(pipe => {
			let handler = Event.pipes[pipe];
			if (!handler) throw new Error(pipe + " is not registered event pipe.");
			event$ = handler(event$, el);
		});

		/// Event Handler
		return event$
			.switchMap(event => context.fork({event, el})(script))
			.subscribe()
	}


	/// -----------------------------------------------------------------------
	/// Text Node
	/// -----------------------------------------------------------------------
	function _$compile_text_node(node, context) {
		let index = node.nodeValue.indexOf("{{");

		while (index >= 0) {
			node = node.splitText(index);
			index = node.nodeValue.indexOf("}}");
			if (index === -1) return;

			let next = node.splitText(index + 2);
			let script = node.nodeValue.slice(2, -2);
			node.nodeValue = "";
			context(script).pipe(renderPipeLine).subscribe(_nodeValue.bind(null, node));

			node = next;
			index = node.nodeValue.indexOf("{{");
		}
	}

	function _nodeValue(node, value) {
		/// HTML Element
		if (node.__node__) {
			for (const n of node.__node__) n.remove();
			delete node.__node__;
		}

		if (value instanceof Node) {
			node.nodeValue = "";
			node.__node__ = Array.from(value.childNodes || [value]);
			node.before(value);
			return;
		}

		node.nodeValue = value === undefined ? "" : value;
	}

	exports.traverseDOM = traverseDOM;
	exports.$compile = $compile;
})();

