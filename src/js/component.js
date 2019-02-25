const {JSContext, nextTick} = require("./parse");
const {$compile} = require("./compile");


DocumentFragment.from = function(nodes) {
	return Array.from(nodes).reduce((frag, node) => {
		frag.appendChild(node);
		return frag;
	}, document.createDocumentFragment());
};


class WebComponent extends HTMLElement {

	connectedCallback() {

		console.log("connectedCallback");

		if (!this._binded) {
			$module.component.require(this.tagName.toLowerCase(), (component) => {
				if (component) {
					Object.setPrototypeOf(component, WebComponent.prototype);
					Object.setPrototypeOf(this, component);
					this._binded = true;
					this.connectedCallback();
				}
			});
			return;
		}

		$module.require("template." + this.tagName.toLowerCase(), component => {

			let originalContent = Array.from(this.childNodes);

			/// @FIXME: init & template & compile async 하게 만들기

			/// Apply Template Engine
			let template = component.querySelector("template");
			template = template.cloneNode(true).content;

			/// @FIXME: private scope;;;;
			/// @FIXME: nextTick dependancy
			let context = JSContext.connect(this);
			$compile(template, context);
			this.init(context);
			nextTick.commit(); /// @NOTE: 즉각 업데이트를 하기 위함.

			/// Attach Shady DOM!!
			let contents = DocumentFragment.from(this.childNodes);

			// @TODO: select="h1,h2,h3"
			// for (let content of template.querySelectorAll("content[select]")) {
			// 	content.remove();
			// }

			let content = template.querySelector("content");
			if (content) {
				content.replaceWith(contents);
			}
			this.appendChild(template);


			/// Override disconnected
			this.destroy = () => {
				delete this.destroy;
				context.disconnect();
				while(this.lastChild) this.lastChild.remove();
				this.appendChild(DocumentFragment.from(originalContent));
			};

		});


		/// Override connected Call
		this.connected(...arguments);
	}

	disconnectedCallback() {
		this.destroy();

		/// Override disconnected Call
		this.disconnected(...arguments);
	}

	init(context) {}

	connected() {}

	disconnected() {}

	destroy() {}
}


/// @FIXME;...

$module.template = function(name) {
	return function(html) {
		html = String.raw(html);
		let o = document.createElement("web-component");
		o.innerHTML = html;
		$module.value("template." + name, o);

		window.customElements.define(name, class extends WebComponent {});
	}
};
