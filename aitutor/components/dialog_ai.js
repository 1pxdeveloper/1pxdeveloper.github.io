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

				<h2 *foreach="texts as text, index" class="msg" style="position:absolute; color:#000;" [leave]="tutorSpeakCompleteAnimate.bind(this)">{{ animate(text, tutorSpeakComplete.bind(this)) }}</h2>
				
				<h2 *foreach="query as text, index" class="msg me" [class.isfinal]="isFinal" style="" [leave]="mySpeakCompleteAnimate.bind(this)"><div>{{ animate2(text, mySpeakComplete.bind(this)) }}</div></h2>


			</section>
			<mic-wave $wave></mic-wave>
		</main>
	</template>

`;


$module.component("ai-app", function(STT) {

	const {Observable} = require("1px");

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	let DB = [
		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],

		// ["Oh, there are age than much me. Treat conveniently.", "오, 나보다 나이다 많다. 편하게 대해."],
		// ["Im twenty two.", "저는 22살이에요."],
		// ["OK, you too. Did you prepare an all text book?", "응, 너도 그렇게 해. 너 교과서 준비했니?"],
		// ["Yes, I Do. There are many necessary books so as becoming college student.", "응. 대학생이 되니까 필요한 책이 너무 많아."],
		// ["Thats all right.", "맞아."],
		// ["What study do you learn?", "너는 어떤 수업을 배우니?"],
		// ["Learn laws of nature, chemistry, mathematics etc.", "물리, 화학, 수학 등을 배워."],
		// ["Are you learning same subject too?", "너도 같은 걸을 배우지?"]
	];


	// DB.sort(() => Math.random() > 0.5 ? 1 : -1);

	return class AIApp {
		init($) {
			this.isstart = false;

			this.texts = [];
			this.query = [];

			this.flag = true;

			this.tutorLegacyNode = null;
			this.myLegacyNode = null;

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

				this.flag = !this.flag;
				this.pushText(text);

			}, 6000);


			/// Animation
			this.headout = [
				[
					{
						// opacity: 1,
						transform: "translate(0,-100px) scale(0.6)",
					},

					{
						// opacity: 0,
						transform: "translate(0,-180px) scale(0.6)",
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 1000
				}
			];


			this.myheadout = [
				[
					{
						// opacity: 1,
						transform: "translate(0,0) scale(0.6)",
					},

					{
						// opacity: 0,
						transform: "translate(0,-80px) scale(0.6)",
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 1000
				}
			];
		}


		pushText(text) {
			if (this.flag) {
				this.texts.push(text);
			} else {
				this.query.push(text);
			}
		}

		tutorSpeakComplete() {
			this.texts.shift();
		}

		mySpeakComplete() {
			this.query.shift();
		}

		tutorSpeakCompleteAnimate(el) {


			if (this.myLegacyNode) {
				let a = this.myLegacyNode.animate.apply(this.myLegacyNode, this.myheadout);
				a.onfinish = () => {
					this.myLegacyNode.remove();
					this.myLegacyNode = null;
				}
			}

			let animation = [
				[
					{
						transform: "translate(0, 0) scale(1)",
					},

					{
						transform: "translate(0,-100px) scale(0.6)",
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 750
				}
			];

			animation.onfinish = (animation) => {
				this.tutorLegacyNode = animation.target;
				return false;
			};

			return animation;
		}

		mySpeakCompleteAnimate(el) {

			if (this.tutorLegacyNode) {
				let a = this.tutorLegacyNode.animate.apply(this.tutorLegacyNode, this.headout);
				a.onfinish = () => {
					this.tutorLegacyNode.remove();
					this.tutorLegacyNode = null;
				}
			}

			let animation = [
				[
					{
						top: "50%",
						transform: "translate(0, -50%) scale(1)",
						transformOrigin: "100% 50%"
					},

					{
						top: "0%",
						transform: `translate(0,0) scale(0.6)`,
						transformOrigin: "100% 0"
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 750
				}
			];

			animation.onfinish = (animation) => {
				this.myLegacyNode = animation.target;
				return false;
			};

			return animation;
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
						// transform: "translate(0, 10px)"
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
					delay: 50 * index,
					duration: 50
				});
				animation.target = span;

				frag.appendChild(span);
				return animation;
			});


			animations[animations.length - 1].onfinish = function() {

				setTimeout(() => {
					callbackFn();
				}, 1000);

			};


			return frag;
		}

		animate2(text, callbackFn) {
			if (!text) return "";

			let c = text.split(/(\s+)/);

			let arr = [];

			this.isFinal = false;

			return Observable.interval(150).take(c.length).map(i => {
				arr.push(c[i]);
				return arr.join("");

			}).complete(() => {

				setTimeout(() => {

					this.isFinal = true;

					setTimeout(() => {
						callbackFn();

					}, 1000);

				}, 1000);
			});


			// let frag = document.createDocumentFragment();
			//
			// let animations = c.map((t, index) => {
			// 	let span = document.createElement("span");
			// 	span.innerText = t;
			// 	span.style.display = "inline-block";
			// 	span.style.whiteSpace = "pre";
			// 	span.style.opacity = 0;
			// 	// span.style.transform = "translate(0,-100px)";
			//
			// 	let animation = span.animate([
			// 		{
			// 			opacity: 0
			// 		},
			//
			// 		{
			// 			opacity: 1
			// 		},
			//
			// 	], {
			// 		fill: "forwards",
			// 		easing: "ease",
			// 		delay: 50 * index,
			// 		duration: 0
			// 	});
			// 	animation.target = span;
			//
			// 	frag.appendChild(span);
			// 	return animation;
			// });
			//
			// console.log(animations[animations.length - 1]);
			//
			//
			// animations[animations.length - 1].onfinish = callbackFn;
			// return frag;
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
