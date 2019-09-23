(function() {
	"use strict";
	
	const {$module} = require("./1px.module");
	const {JSContext} = require("./parse");
	
	function traverseDOM(node, callback) {
		if (!node) return;
		
		const queue = ("length" in node) ? Array.from(node) : [node];
		
		while(queue.length) {
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
	
	/// ELEMENT_NODE
	function compile_element_node(el, context, to) {
		switch (el.tagName) {
			case "STYLE":
			case "SCRIPT":
				return false;
		}
		
		const attributes = Array.from(el.attributes);
		
		let ret;
		to = to || el;
		if (to !== el) {
			for (const attr of attributes) {
				to.setAttributeNode(attr.cloneNode(true));
			}
		}
		
		/// @NOTE: FORM Submit 방지
		if (el.tagName === "FORM") {
			if (!el.hasAttribute("method") && !el.hasAttribute("action")) {
				context.on$(el, "submit").subscribe(event => event.preventDefault());
				el.submit = function() {
					this.dispatchEvent(new CustomEvent("submit"));
				};
			}
			
			// @TODO: validate, keyenter -> submit, etc...
		}
		
		
		/// @FIXME:... default template directive
		let hasTemplateDirective = ["*foreach", "*if", "*else"].some(attrName => {
			let hasAttr = el.hasAttribute(attrName);
			if (hasAttr) {
				let attrValue = el.getAttribute(attrName);
				$module.directive.require([attrName, directive => directive(context, el, attrValue)]);
			}
			return false;
		});
		
		if (hasTemplateDirective) {
			return false;
		}
		
		/// Attribute directive
		for (const attr of attributes) {
			
			// /// Custom directives
			// let customDefaultPrevent = false;
			// $module.directive.require([attr.nodeName, directive => {
			// 	if (typeof directive === "function") {
			// 		let ret = directive(context, el, attr.nodeValue);
			// 		customDefaultPrevent = ret === false;
			// 	}
			// }]);
			// if (customDefaultPrevent) continue;
			
			
			/// Basic directives
			/// @TODO: custom-directive 등록할때 아래처럼 syntax를 등록하는건 어떨까?
			
			if (syntax(context, to, attr, "#", _ref, "")) continue;
			if (syntax(context, to, attr, "$", _ref2, "")) continue;
			if (syntax(context, to, attr, "(", _event, ")")) continue;
			if (syntax(context, to, attr, "[(", _twoway, ")]")) continue;
			if (syntax(context, to, attr, "[attr.", _attr, "]")) continue;
			if (syntax(context, to, attr, "[style.", _style, "]")) continue;
			if (syntax(context, to, attr, "[class.", _class, "]")) continue;
			if (syntax(context, to, attr, "[show.", _transition, "]")) continue;
			if (syntax(context, to, attr, "[visible.", _visible2, "]")) continue;
			if (syntax(context, to, attr, "[visible", _visible, "]")) continue;
			if (syntax(context, to, attr, "[", _prop, "]")) continue;
			if (syntax(context, to, attr, ".", _call, ")")) continue;
		}
		
		
		/// Directive: "is"
		/// @TODO: is="app-component as b"
		ret = _createComponentIfDefined(context, el);
		
		return ret;
	}
	
	
	function _createComponentIfDefined(context, el) {
		
		const name = el.getAttribute("is") || el.tagName.toLowerCase();
		
		if ($module.exist(name)) {
			
			$module.require([name, (Component) => {
				let controller = new Component();
				context = JSContext.connect(controller, ...context.locals);
				controller.init && controller.init(context);
				$compile(el.childNodes, context);
			}]);
			
			console.warn(name);
			return false;
		}
		
		
		// let Component = $module.get(el.getAttribute("is") || el.tagName.toLowerCase());
		// if (!Component) {
		// 	return;
		// }
		//
		// // console.log(el.getAttribute("is"), Component);
		// // console.warn("is", context, el);
		// // console.log(Component.template);
		//
		// let controller = new Component();
		// context = JSContext.connect(controller, ...context.locals);
		// controller.init && controller.init(context);
		//
		// if (el.hasAttribute("inline-template")) {
		// 	$compile(el.childNodes, context);
		// 	return false;
		// }
		//
		// if (Component.template) {
		// 	let template = document.createElement("template");
		// 	template.innerHTML = Component.template;
		// 	$compile(template, context);
		// 	el.innerHTML = "";
		// 	el.appendChild(template.content);
		// }
		
		return true;
	}
	
	
	/// @FIXME...
	function syntax(context, el, attr, start, callback, end) {
		let name = attr.nodeName;
		let value = attr.nodeValue;
		
		if (name.startsWith(start) && name.endsWith(end)) {
			callback(context, el, value, name.slice(start.length, -end.length));
			// el.removeAttributeNode(attr); // @TODO: DEBUG mode
			return true;
		}
	}
	
	function _visible(context, el, script, prop) {
		prop = "hidden";
		context.watch$(script, value => el[prop] = !value);
	}
	
	function _visible2(context, el, script, prop) {
		
		context.watch$(script, value => {
			if (value) {
				el.hidden = false;
			}
			else {
				el.hidden = true;
			}
		});
	}
	
	function _prop(context, el, script, prop) {
		context.watch$(script, value => el[prop] = value);
	}
	
	
	// function _getOptions(value) {
	// 	return options.reduce((o, option) => {
	// 		o[option] = true;
	// 		return o;
	// 	}, Object.create(null));
	// }
	
	Event.pipes = {
		
		prevent($) {
			return $.do(e => e.preventDefault());
		},
		
		stop($) {
			return $.do(e => e.stopPropagation());
		},
		
		capture($) {
			return $;
		},
		
		self($, element) {
			return $.filter(e => e.target === element);
		},
		
		once($) {
			return $.take(1);
		},
		
		shift($) {
			return $.filter(e => e.shiftKey);
		},
		
		alt($) {
			return $.filter(e => e.altKey);
		},
		
		ctrl($) {
			return $.filter(e => e.ctrlKey);
		},
		
		meta($) {
			return $.filter(e => e.metaKey);
		},
		
		/// @FIXMEE..
		cmd($) {
			return $.filter(e => e.metaKey);
		},
	};
	
	function _event(context, el, script, value) {
		
		let [type, ...options] = value.split("|");
		let useCapture = options.indexOf("capture") >= 0;
		
		
		/// Keyboard Event
		let keys = [];
		if (type.startsWith("keydown") || type.startsWith("keypress") || type.startsWith("keyup")) {
			[type, ...keys] = type.split(".");
		}
		
		let event;
		let o$ = context.on$(el, type, useCapture).do(e => event = e);
		
		if (keys.length) {
			o$ = o$.filter(e => {
				return keys.indexOf(e.key.toLowerCase()) >= 0;
			});
		}
		
		/// Event Pipe
		options.forEach(pipe => {
			let handler = Event.pipes[pipe] || Event.pipes["*"];
			if (!handler) throw new Error(pipe + " is not registered event pipe.");
			o$ = handler(o$, el);
		});
		
		
		/// Event Handler
		o$.subscribe(function(event) {
			context.fork({event, el}).evaluate(script);
		});
	}
	
	/// two-way
	function _twoway(context, el, script, value) {
		
		let [prop, eventType, ...options] = value.split(".");
		
		options = options.reduce((o, option) => {
			o[option] = true;
			return o;
		}, Object.create(null));
		
		
		context.watch$(script, value => el[prop] = value);
		context.on$(el, eventType || "input").subscribe(function() {
			context.assign(script, el[prop]);
		});
	}
	
	function _attr(context, el, script, attr) {
		context.watch$(script, value => {
			if (!value && value !== 0) {
				el.removeAttribute(attr);
			}
			else {
				el.setAttribute(attr, value)
			}
		});
	}
	
	function _style(context, el, script, name) {
		
		let [prop, unit] = name.split(".", 2);
		unit = unit || "";
		
		context.watch$(script, value => {
			switch (unit) {
				case "url":
					value = "url('" + encodeURI(value) + "')";
					break;
				
				default:
					value = value + unit;
					break;
			}
			
			el.style[prop] = value;
		});
	}
	
	function _class(context, el, script, name) {
		context.watch$(script, value => {
			value ? el.classList.add(name) : el.classList.remove(name);
		});
	}
	
	function _ref(context, el, script, name) {
		context.local[name] = el;
	}
	
	function _ref2(context, el, script, name) {
		context.thisObj["$" + name] = el;
	}
	
	function _transition(context, el, script, name) {
		
		function transitionend() {
			el.classList.remove(name + "-enter-active");
			el.classList.remove(name + "-enter");
			el.classList.remove(name + "-enter-to");
			
			el.removeEventListener("transitionend", transitionend);
			el.removeEventListener("transitionend", transitionHideEnd);
		}
		
		function transitionHideEnd() {
			el.classList.remove(name + "-leave-active");
			el.classList.remove(name + "-leave");
			el.classList.remove(name + "-leave-to");
			el.hidden = true;
			
			el.removeEventListener("transitionend", transitionend);
			el.removeEventListener("transitionend", transitionHideEnd);
		}
		
		context.watch$(script, value => {
			if (value === undefined) return;
			
			if (value) {
				el.removeEventListener("transitionend", transitionend);
				el.removeEventListener("transitionend", transitionHideEnd);
				
				el.classList.add(name + "-enter-active");
				el.classList.add(name + "-enter");
				el.hidden = false;
				
				if (parseFloat(window.getComputedStyle(el).transitionDuration)) {
					el.addEventListener("transitionend", transitionend, false);
					requestAnimationFrame(() => {
						el.classList.remove(name + "-enter");
						el.classList.add(name + "-enter-to");
					})
				}
				else {
					transitionend();
				}
			}
			else {
				el.removeEventListener("transitionend", transitionend);
				el.removeEventListener("transitionend", transitionHideEnd);
				
				el.classList.add(name + "-leave-active");
				el.classList.add(name + "-leave");
				el.offsetWidth;
				
				if (parseFloat(window.getComputedStyle(el).transitionDuration)) {
					
					
					el.addEventListener("transitionend", transitionHideEnd, false);
					el.addEventListener("transitioncancel", transitionHideEnd, false);
					
					requestAnimationFrame(() => {
						el.classList.remove(name + "-leave");
						el.classList.add(name + "-leave-to");
					})
				}
				else {
					transitionHideEnd();
				}
			}
		});
	}
	
	function _call(context, el, script, name) {
		context.watch$(script, value => {
			if (value === true) {
				
				/// @FIXME:...
				let doScript = "_tmp." + name + ")";
				// console.log("_call", el, doScript);
				
				let _context = context.fork({_tmp: el});
				
				try {
					_context.evaluate(doScript);
					
				} catch (e) {
					
					console.error(e);
				}
			}
		});
	}
	
	/// TEXT_NODE
	function _nodeValue(value) {
		
		
		console.log("_nodeValue", value);
		
		
		/// HTML Element
		if (this.__node) {
			this.__node.forEach(node => node.remove());
			delete this.__node;
		}
		
		if (value instanceof Node) {
			this.nodeValue = "";
			this.__node = Array.from(value.childNodes || [value]).slice();
			this.before(value);
			return;
		}
		
		this.nodeValue = value === undefined ? "" : value;
	}
	
	function compile_text_node(node, context) {
		let index = node.nodeValue.indexOf("{{");
		
		while(index >= 0) {
			node = node.splitText(index);
			index = node.nodeValue.indexOf("}}");
			if (index === -1) return;
			
			let next = node.splitText(index + 2);
			let script = node.nodeValue.slice(2, -2);
			context.watch$(script, _nodeValue.bind(node));

			node = next;
			index = node.nodeValue.indexOf("{{");
		}
	}
	
	
	function $compile(el, context, if_template_to) {
		if_template_to = if_template_to || el;
		
		if (arguments.length === 1) {
			context = context || new JSContext(el);
		}
		if (!(context instanceof JSContext)) {
			context = new JSContext(context);
		}
		
		if (el.tagName === "TEMPLATE") {
			compile_element_node(el, context, if_template_to);
			el = el.content;
		}
		
		traverseDOM(el, node => {
			// if (node.__compiled) return false;
			
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					return compile_element_node(node, context);
				
				case Node.TEXT_NODE:
					return compile_text_node(node, context);
			}
		});
		
		return el;
	}
	
	exports.traverseDOM = traverseDOM;
	exports.$compile = $compile;
})();

