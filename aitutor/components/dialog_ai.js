$module.template("ai-app")`

	<template>
		<main *if="!isstart">
			<section>
				<h1 style="margin: auto">Mission English</h1>
				<h1 style="margin: auto">start to click</h1>
			</section>
		</main>

		<main [hidden]="!isstart">
			<section>
				<!--<div class="prev_ask" [class.me]="prev_ask_turn_me" style="padding: 16px; position: absolute" *foreach="prevs as prev, index" [leave]="headout">{{ prev }}</div>-->

				<section flex hbox>
					<h2 *foreach="texts as text, index" class="msg" style="position:absolute; top: 100px; text-align: left; color:#000" [leave]="test">{{ animate(text, temp.bind(this)) }}</h2>
				</section>
				
				<mic-wave $wave></mic-wave>
			</section>
		</main>
	</template>

`;


$module.component("ai-app", function(STT) {

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	let DB = [
		["I'll just translate it into Korean. I need a longer sentence naturally more naturally.", ""],
		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],
	];

	// DB.sort(() => Math.random() > 0.5 ? 1 : -1);

	return class AIApp {
		init($) {
			this.isstart = false;
			this.texts = [];
			this.prevs = [];

			this.stage = 0;

			$.on$(document, ["mousedown", "touchstart", "keydown"], true).take(1).subscribe(() => this.start());

			window.app = this;
		}


		start() {
			this.isstart = true;
			this.text1 = DB[0][0];


			let index = 0;

			let text = DB[index][0];

			this.pushText(text);


			setInterval(() => {

				index++;
				index = index % DB.length;

				text = DB[index][0];
				this.pushText(text);

			}, 5000);


			/// Animation
			this.headout = [
				[
					{
						opacity: 1,
						transform: "translate(0, 0)",
					},

					{
						opacity: 0,
						transform: "translate(0,-10px)",
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 1000
				}
			];


			this.test = [
				[
					{
						// opacity: 1,
						transform: "translate(0, 0) scale(1)",
						transformOrigin: "0 0",
						// fontSize: "32px"
						// transform: "scale(.5)"
					},

					// {
					// 	offset: 0.80,
					// 	// opacity: 0,
					// 	transform: "translate(0,-100px) scale(1)",
					// 	transformOrigin: "0 0",
					// 	// fontSize: "32px",
					// },
					//
					{
						offset: 1,
						// opacity: 0,
						transform: "translate(0,-100px) scale(0.5)",
						transformOrigin: "0 0",
						// fontSize: "16px"
						// transform: "scale(1)"
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 1500
				}
			];

			this.test.onfinish = (event) => {

				// console.log(event);

				// console.log(this.texts.slice());

				this.prevs.shift();
				this.prevs.push(this.pprev);
			}
		}

		pushText(text) {
			this.prevs.shift();
			this.texts.push(text);
		}

		temp() {
			this.prevs.shift();
			this.pprev = this.texts.shift();
		}

		animate(text, callbackFn) {
			if (!text) return "";

			let c = text.split(/(\s+)/);
			// let c = text.split("");

			let frag = document.createDocumentFragment();

			let animations = c.map((t, index) => {
				let span = document.createElement("span");
				span.innerText = t;
				span.style.display = "inline-block";
				span.style.whiteSpace = "pre";
				span.style.opacity = 0;
				// span.style.transform = "translate(0,-100px)";

				let animation = span.animate([
					{
						opacity: 0,
						transform: "translate(0, 10px)"
						// transform: "scale(.5)"
					},

					{
						opacity: 1,
						transform: "translate(0,0)"
						// transform: "scale(1)"
					},

				], {
					fill: "forwards",
					easing: "ease",
					delay: 50 * index,
					duration: 1000
				});
				animation.target = span;

				frag.appendChild(span);
				return animation;
			});

			console.log(animations[animations.length - 1]);


			animations[animations.length - 1].onfinish = callbackFn;
			return frag;
		}

		stop() {
			this.hint = this.original_hint;
			clearInterval(this.timer);
			this.timer = null;

			this.stt.stop();

			setTimeout(() => {
				this.stt.start();
				this.next();
			}, 2000)
		}


		next() {
			let [en, ko] = DB[this.stage++];

			this.prev_ask = ko;
			this.text1 = "";
			this.isFinal = false;

			this.hint = "";
			this.original_hint = en;
			this.hint = this.original_hint.replace(/[a-zA-Z]/g, "_");


			setTimeout(() => {

				let index = 0;
				this.timer = setInterval(() => {

					index++;
					this.hint = this.original_hint.slice(0, index) + this.hint.slice(index);

				}, 250);


			}, 3000);


		}


	}.prototype;


});
