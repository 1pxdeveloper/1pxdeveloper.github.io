(function() {
	"use strict";
	
	const {$compile, Context} = require();
	
	class WebComponent extends HTMLElement {
		connectedCallback() {
			const html = this.constructor.templateHTML;
			const wrap = document.createElement("template");
			wrap.innerHTML = html;
			const template = wrap.content.querySelector("template") || wrap;
			
			const context = $compile(template, this, this);
			this.innerHTML = "";
			this.appendChild(template.content);
			
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


