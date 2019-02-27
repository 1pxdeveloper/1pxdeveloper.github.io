$module.template("ai-message")`

	<template>
		<transition name="ai-message">
			<p *foreach="messages as msg, index" class="msg" [index]="index" [attr.who]="msg.who" [attr.state]="msg.state">{{ msg | animate: update.bind(this) }}</p>
		</transition>
	</template>

`;


$module.component("ai-message", function(DB) {

	return class {
		init($) {
			this.messages = [];
			this.transition$ = $.on$(this, "webkitTransitionEnd", true).filter(event => {


				console.log(event.target, event.target.index);

				return event.target.index === this.messages.length-1;
			})
		}

		test() {
			this.flag = false;
			this.speak("Mission English");

			this.stage = 0;

			this.transition$ = $.on$(this, "webkitTransitionEnd", true);


			setInterval(() => {

				this.push(DB[this.stage][0], flag);
				this.flag = !this.flag;

				this.stage++;
				this.stage = this.stage % DB.length;


			}, 5000)

		}

		update() {
			this.messages = this.messages.filter(msg => {
				switch (msg.state) {
					case "speak":
						msg.state = "done";
						return true;

					case "done":
						msg.state = "prev";
						return true;
				}
				return false;
			});
		}

		push(text, flag) {
			let who = flag ? "me" : "ai";
			this.messages.push({state: "speak", text, who});

			return new Promise(resolve => {
				this.transition$.take(1).subscribe(resolve);
			})
		}

		ask(text) {
			return this.push(text, false);
		}

		speak(text) {
			return this.push(text, true);
		}

		animate(msg, callbackFn) {
			if (!msg) return "";
			let text = msg.text || "";

			if (msg.who === "me") {

				/// @FIXME: .. time sync
				setTimeout(callbackFn, 1000);
				return msg.text;
			}

			let c = text.split(/(\s+)/);
			// let c = text.split("");

			let frag = document.createDocumentFragment();

			let animations = c.map((t, index) => {
				let span = document.createElement("span");
				span.innerText = t;
				span.style.display = "inline-block";
				span.style.whiteSpace = "pre";
				span.style.opacity = 0;

				let animation = span.animate([
					{
						opacity: 0,
						// transform: "translate(10px, 0)"
						// transform: "scale(.5)"
					},

					{
						opacity: 1,
						// transform: "translate(0,0)"
						// transform: "scale(1)"
					},

				], {
					fill: "forwards",
					easing: "ease",
					delay: 70 * index,
					duration: 0
				});

				frag.appendChild(span);
				return animation;
			});


			animations[animations.length - 1].onfinish = () => {
				setTimeout(() => {
					callbackFn();
				}, 1000);
			};

			return frag;
		}


	}.prototype;


});
