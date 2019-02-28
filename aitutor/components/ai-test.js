$module.template("ai-test")`

	<template>
		<section *if="!isstart" style="display: flex; height: 100%" flex>
			<h1 style="margin: auto">Mission English</h1>
		</section>

		<section [hidden]="!isstart">
			<section>
				<ai-message $dialog></ai-message>
				<ui-speech-to-text $ui_stt></ui-speech-to-text>
				<ui-text-to-speech $ui_tts></ui-text-to-speech>


				<h2 $hint class="msg" style="text-align: center; color: #888; font-size: 21px; padding: 0 32px;" [hidden]="!hint">
					<!--<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px" [hidden]="fallback_count === 0">이렇게 말해보세요.</div>-->
					<div style="margin-top: 8px"></div>
					{{ prev_ask }} <span [hidden]="fallback_count === 0" style="color: #ccc; font-size: 16px;"><br>를 영어로 말해보세요.</span>
					<!--<p class="hint" style="text-align: right; margin-top: 16px">{{ hint }}</p>-->
				</h2>

			</section>
		</section>
	</template>

`;


$module.component("ai-test", function(STT, DB, randomPick) {

	const {Observable} = require("1px");

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
	}

	return class {
		init($) {
			this.isstart = false;

			this.texts = [];
			this.query = [];

			this.flag = true;

			this.tutorLegacyNode = null;
			this.myLegacyNode = null;

			this.stage = 2;

			this.fallback_count = 0;

			this.voiceIndex = parseInt(Math.random() * 100);

			$.on$(document, ["mousedown", "touchstart"], true).take(1).subscribe(() => this.start());

			window.app = this;
		}


		start() {
			this.isstart = true;


			// let text = DB[this.stage][0];
			//
			// console.log(text);
			//
			//
			// this.$ui_tts.speak(text).then(_ => {
			//
			// 	this.$ui_tts.words = [];
			//
			// 	return this.$dialog.ask(text)
			//
			//
			// }).then(_ => {
			//
			// 	this.stage += 2;
			//
			// 	return $timeout(500);
			//
			// }).then(_ => {
			//
			// 	return this.next();
			// })

			this.stage += 2;
			return this.next();
		}

		next(fallback_text) {


			let text = fallback_text || DB[this.stage][0];


			this.$ui_tts.speak(text, this.voiceIndex).then(_ => {

				this.$ui_tts.words = [];

				return this.$dialog.ask(text)

			}).then(_ => {

				this.prev_ask = DB[this.stage + 1][Math.min(2, this.fallback_count + 1)];
				this.hint = DB[this.stage + 1][0];

				return this.$ui_stt.listen(_ => {
					this.prev_ask = "";
					this.hint = "";


				})

			}).then(text => {


				return this.$dialog.speak(text);


			}).then(text => {


				if (this.fallback_count < 2) {
					return this.fallback();
				}

				this.fallback_count = 0;

				this.stage += 2;
				this.next();
			});

		}

		fallback() {


			let F2 = ["I didn't get that. Can you say it again?",
				"I missed what you said. What was that?",
				"Sorry, could you say that again?",
				"Sorry, can you say that again?",
				"Can you say that again?",
				"Sorry, I didn't get that. Can you rephrase?",
				"Sorry, what was that?",
				"One more time?",
				"What was that?",
				"Say that one more time?",
				"I didn't get that. Can you repeat?",
				"I missed that, say that again?"];

			// let F3 = ["Hmm... ", "Well.. ", "I said, ", "Excuse me, "];


			this.fallback_count++;

			let text = randomPick(["Sorry?", "Pardon?"]);

			if (this.fallback_count > 1) {

				text = randomPick(F2);

				// let Q = DB[this.stage][0];
				//
				// let a = Q.split(".");
				// a = a[a.length - 1] + ".";
				//
				// text += " " + a;
			}

			this.next(text);
		}


	}.prototype;

})

