(function() {
	"use strict";
	
	const {JSContext, $compile} = require("./compile");
	
	const $$templates = Object.create(null);
	
	class WebComponent extends HTMLElement {
		
		/// @TODO: template 연동은 임시..
		static template() {
			let html = String.raw(...arguments);
			let wrap = document.createElement("body");
			wrap.innerHTML = html;
			
			$$templates[WebComponent.template.tagName] = wrap.getElementsByTagName("template")[0];
			console.log(WebComponent.template.tagName, $$templates[WebComponent.template.tagName])
		}
		
		static templateSelector(selector) {
			console.log(WebComponent.template.tagName, document.querySelector(selector));
			$$templates[WebComponent.template.tagName] = document.querySelector(selector);
		}
		
		constructor() {
			super();
			this.created();
		}
		
		connectedCallback() {
			console.log(this.outerHTML, this.innerHTML);

			this.$$originalContent = Array.from(this.childNodes);
			
			
			let context = JSContext.connect(this);
			let template = $$templates[this.tagName.toLowerCase()];
			
			if (template) {
				template = template.cloneNode(true);
				$compile(template, context, this);
				
				for (let slot of template.content.querySelectorAll("slot[name]")) {
					let slotName = slot.getAttribute("name");
					let contents = DocumentFragment.from(this.querySelectorAll(`[slot="${slotName}"]`));
					slot.replaceWith(contents);
				}
				
				for (let slot of template.content.querySelectorAll("slot")) {
					let contents = DocumentFragment.from(this.childNodes);
					console.log(slot, contents);
					slot.replaceWith(contents);
				}
				
				this.innerHTML = "";
				this.appendChild(template.content);
			}
			
			this.$ = context;
			this.init(context);
			this.connected();
		}
		
		disconnectedCallback() {
			this.innerHTML = "";
			this.appendChild(DocumentFragment.from(this.$$originalContent));
			delete this.$$originalContent;
			this.$.disconnect();
			this.disconnected();
		}
		
		init() {}
		
		created() {}
		
		connected() {}
		
		disconnected() {}
	}
	
	exports.WebComponent = WebComponent;
})();

