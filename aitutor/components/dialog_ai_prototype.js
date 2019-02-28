$module.template("ai-app-prototype")`

	<template>
		<section flex *if="!isstart">
			<h1 style="margin: auto">Mission English</h1>
		</section>

		<section [hidden]="!isstart">
			<section>
				<h2 *foreach="texts as text, index" class="msg" style="position:absolute; color:#000;" [leave]="tutorSpeakCompleteAnimate.bind(this)">{{ animate(text, tutorSpeakComplete.bind(this)) }}</h2>
				
<<<<<<< HEAD:aitutor/components/dialog_ai.js
				<h2 *foreach="query as text, index" class="msg me" [class.isfinal]="isFinal" [leave]="mySpeakCompleteAnimate.bind(this)">
					<div>{{ animate2(text, mySpeakComplete.bind(this)) }}</div>
				</h2>
 
				<h2 $hint class="msg" style="text-align: right; color: #888; font-size: 26px" [hidden]="!prev_ask">
					<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px">MISSION</div>
					<div style="margin-top: 8px"></div>
					{{ prev_ask }}
					<p class="hint" style="text-align: right; margin-top: 16px" [_hidden]="text1">{{ hint }}</p>
				</h2>	
=======
				<h2 *foreach="query as text, index" class="msg me" [class.isfinal]="isFinal" style="" [leave]="mySpeakCompleteAnimate.bind(this)"><div>{{ animate2(text, mySpeakComplete.bind(this)) }}</div></h2>


				<h2 $hint class="msg" style="text-align: right; color: #888; font-size: 26px" [hidden]="!prev_ask">
					<!--<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px">MISSION</div>-->
					<div style="margin-top: 8px"></div>
					{{ prev_ask }}
					<p class="hint" style="text-align: right; margin-top: 16px" [_hidden]="text1">{{ hint }}</p>
				</h2>

>>>>>>> a484da4226e330d37b7cccfb1031d96038bca50e:aitutor/components/dialog_ai_prototype.js
			</section>

			<mic-wave $wave></mic-wave>
		</section>
	</template>

`;


$module.component("ai-app-prototype", function(STT, DB) {

	const {Observable} = require("1px");

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

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

			this.$wave.start();
			this.$wave.state = "listen";


			this.isstart = true;
			this.text1 = DB[0][0];


			this.stage = 0;

			let text = DB[this.stage][0];

			this.pushText(text);


			setInterval(() => {
				this.stage++;
				this.stage = this.stage % DB.length;

				text = DB[this.stage][0];

				this.flag = !this.flag;
				this.pushText(text);


			}, 6000);


			/// Animation
			this.headout = [
				[
					{
						// opacity: 1,
						transform: `translate(0,0) scale(0.6)`,
					},

					{
						// opacity: 0,
						transform: "translate(0,-100%) scale(0.6)",
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
						transform: "translate(0,-100%) scale(0.6)",
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

				this.prev_ask = "";
				this.hint = "";

				this.query.push(text);
			}
		}

		tutorSpeakComplete() {
			this.texts.shift();
		}

		mySpeakComplete() {
			this.query.shift();
			this.$wave.state = "listen";
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
						top: "50%",
						transform: "translate(0, -50%) scale(1)",
						transformOrigin: "0 50%"
					},

					{
						top: "0%",
						transform: `translate(0,0) scale(0.6)`,
						transformOrigin: "0 0"
					},

				], {
					fill: "forwards",
					easing: "ease",
					duration: 750
				}
			];

			animation.onfinish = (animation) => {

				this.prev_ask = DB[this.stage+1][1];
				this.hint = DB[this.stage+1][0];

				this.$hint.animate([
					{opacity: 0},
					{opacity: 1},
				], {
					fill: "forwards",
					easing: "ease",
					duration: 1000
				});

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
					delay: 70 * index,
					duration: 50
				});
				animation.target = span;

				frag.appendChild(span);
				return animation;
			});


			animations[animations.length - 1].onfinish = () => {


				setTimeout(() => {
					this.$wave.state = "speech";
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
