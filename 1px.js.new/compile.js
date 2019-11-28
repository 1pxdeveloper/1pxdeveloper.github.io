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

			if (!node) continue;


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
	const $compile = (el, context, to) => {

		if (!(context instanceof Context)) {
			context = new Context(context);
		}

		if (el.tagName === "TEMPLATE") {
			_$compile_element_node(el, context, to);
			el = el.content;
		}

		traverseDOM(el, (node) => {
			if (!node) return;

			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					return _$compile_element_node(node, context);

				case Node.TEXT_NODE:
					return _$compile_text_node(node, context);
			}
		});

		return context;
	};


	/// -----------------------------------------------------------------------
	/// Compile Element
	/// -----------------------------------------------------------------------
	const localSVG = {};

	function _$compile_element_node(el, context, to = el) {
		const tagName = el.tagName.toLowerCase();

		if (tagName === "script") return false;
		if (tagName === "style") return false;


		const attributes = Array.from(el.attributes);

		let ret;

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


		/// @TODO: make Directive Hook
		if (tagName === "svg") {
			const svg = el;

			let src = svg.getAttributeNode("src");
			if (src) {
				if (localSVG[src.nodeValue]) {
					svg.replaceWith(localSVG[src.nodeValue]);
				}
				else {
					fetch(src.nodeValue).then(res => res.text()).then(res => {

						let template = document.createElement("template");
						template.innerHTML = res;
						localSVG[src.nodeValue] = template.content;

						svg.replaceWith(localSVG[src.nodeValue]);
					});
				}
			}
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
			if (templateSyntax(context, to, attr, "$", _ref2, "")) continue;
			// if (templateSyntax(context, to, attr, "#", _ref, "")) continue;
			// if (templateSyntax(context, to, attr, ".", _call, ")")) continue;
		}


		/// Iframe Component
		if (tagName === "iframe" && el.hasAttribute("is")) {

			const iframe = el;
			const is = el.getAttribute("is");

			window.customElements.whenDefined(is).then(() => {
				const Component = window.customElements.get(is);
				const component = new Component;
				component.iframe = iframe;
				iframe.contentDocument.body.appendChild(component);
			});

			return false;
		}


		/// Controller!!!!!!
		if (el.hasAttribute("is")) {

				console.log("controller????????????????????????????", el.getAttribute("is"));




			$module.controller.require([el.getAttribute("is"), (Controller) => {


				console.log("loaded????????????????????????????", el.getAttribute("is"));



				const controller = new Controller;
				$compile(el.childNodes, controller);
				controller.init && controller.init();
			}]);

			return false;
		}


		if (window.customElements.get(tagName)) {
			return false;
		}
	}

	function templateSyntax(context, el, attr, start, callback, end) {
		const {nodeName, nodeValue} = attr;
		if (nodeName.startsWith(start) && nodeName.endsWith(end)) {
			callback(context, el, nodeValue, nodeName.slice(start.length, -end.length || undefined));
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
		return context(script)
			.pipe(renderPipeLine)
			// .trace(`[visible]`, script)
			.tap(value => el["hidden"] = !value)
			.subscribe()
	}

	function _attr(context, el, script, attr) {
		return context(script)
			.pipe(renderPipeLine)
			.tap(value => (value || _.isStringLike(value)) ? el.setAttribute(attr, value) : el.removeAttribute(attr))
			.subscribe()
	}

	function _class(context, el, script, name) {
		return context(script)
			.switchMap(value => Observable.castAsync(value))
			.pipe(renderPipeLine)
			// .trace(`[class.${name}]`, script)
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
			.subscribe();
	}

	function _twoway(context, el, script, name) {

	}

	function _prop(context, el, script, name) {
		return context(script)
		// .pipe(renderPipeLine) // @TODO: hasOwnProperty가 없는데 HTMLElement가 가지고 있는 경우에는 renderPipe를 통해야함. ex) id, src 등...
			.tap(value => el[name] = value)
			.subscribe();
	}

	function _ref2(context, el, script, name) {
		context.thisObj["$" + name] = el;
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
		// .trace("(event)", type)
			.switchMap(event => context.fork({event, el}).evaluate(script))
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

