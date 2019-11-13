$module.factory("WebComponent", function() {

	const {$compile} = require();

	class WebComponent extends HTMLElement {
		connectedCallback() {
			const html = this.constructor.templateHTML;
			const wrap = document.createElement("template");
			wrap.innerHTML = html;
			const template = wrap.content.querySelector("template") || wrap;

			this.innerHTML = "";
			this.appendChild(template.content);

			$compile(this, this);
			this.init();
			this.connected();
		}

		init() {}

		connected() {}
	}

	return WebComponent;
});


$module.component = function(name, callback) {

	const {makeInjectable} = require();

	const decorator = Object.create(null);
	const _callback = callback.bind(decorator);
	_callback.$inject = makeInjectable(callback).$inject;

	return $module.require(_callback, Component => {
		Object.assign(Component, decorator);
		window.customElements.define(name, Component);
	})
};
