console.log("!!!!!!!!!!!");


document.querySelectorAll("link[component]").forEach(link => {


	console.log(link);


	try {

		fetch(link.href).then(res => res.text()).then(html => {


			let template = document.createElement("body");
			template.innerHTML = html;

			console.log(template);


			// template.querySelectorAll("web-component").forEach(def => {
			// 	console.log(def);
			// })

			template.querySelectorAll("script").forEach(script => {

				// script.onload = function() {
				//
				// 	alert("!");
				// 	// this.remove();
				// };
				//
				// script = document.importNode(script, true);

				console.log(script);

				//
				// script.onload = function() {
				// 	console.log("onload", this);
				// }
				//
				// script.onerror = function() {
				// 	console.log("onerror", this);
				// }
				//
				//
				// script.async = true;
				// document.getElementsByTagName('head')[0].appendChild(script);

				Function(script.innerText)();
			})
		})

	} catch (e) {

		console.error(e);

	}
});