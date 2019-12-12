(function() {
	"use strict";

	const {$compile, Context} = require();

	class WebComponent extends HTMLElement {

		connectedCallback() {

			/// @FIXME: Make Once
			if (this.__connected) {
				return;
			}
			this.__connected = true;

			/// Load Template
			let html = this.constructor.templateHTML;

			/// @FIXME:
			if (this.hasAttribute("inline-template")) {
				html = this.innerHTML;
			}

			const wrap = document.createElement("template");
			wrap.innerHTML = html || "";
			const template = wrap.content.querySelector("template") || wrap;


			/// Compile
			const context = $compile(template, this, this);

			/// Import content
			const frag = document.createDocumentFragment();
			Array.from(this.childNodes).forEach(node => frag.appendChild(node));

			this.appendChild(template.content);

			Array.from(this.querySelectorAll("content")).forEach(content => {
				content.replaceWith(frag);
			});


			/// Init Component
			this.init(context);
			this.connected();
		}

		init() {}

		connected() {}
	}

	$module.value("JSContext", {});
	$module.value("WebComponent", WebComponent);

	$module.component = function(name, callback) {

		const {makeInjectable} = require();

		const decorator = Object.create(null);
		const _callback = callback.bind(decorator);
		_callback.$inject = makeInjectable(callback).$inject;

		return $module.require(_callback, Component => {
			Component = Component || class extends WebComponent {};
			Object.assign(Component, decorator);
			window.customElements.define(name, Component);
		})
	};

})();


