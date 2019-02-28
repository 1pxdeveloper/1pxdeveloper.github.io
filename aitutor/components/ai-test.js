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


				<h2 $hint class="msg" style="text-align: right; color: #888; font-size: 26px" [hidden]="!hint">
					<!--<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px">MISSION</div>-->
					<div style="margin-top: 8px"></div>
					{{ prev_ask }}
					<!--<p class="hint" style="text-align: right; margin-top: 16px">{{ hint }}</p>-->
				</h2>


			</section>
		</section>
	</template>

`;


$module.component("ai-test", function(STT, DB) {

	const {Observable} = require("1px");

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
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

			this.voiceIndex = parseInt(Math.random() * 100);

			$.on$(document, ["mousedown", "touchstart"], true).take(1).subscribe(() => this.start());

			window.app = this;
		}


		start() {
			this.isstart = true;


			let text = DB[this.stage][0];

			console.log(text);


			this.$ui_tts.speak(text).then(_ => {

				this.$ui_tts.words = [];

				return this.$dialog.ask(text)


			}).then(_ => {

				this.stage += 2;

				return $timeout(500);

			}).then(_ => {

				return this.next();
			})


		}

		next() {


			let text = DB[this.stage][0];


			this.$ui_tts.speak(text, this.voiceIndex).then(_ => {

				this.$ui_tts.words = [];

				return this.$dialog.ask(text)

			}).then(_ => {

				this.prev_ask = DB[this.stage + 1][1];
				this.hint = DB[this.stage + 1][0];

				return this.$ui_stt.listen(_ => {
					this.prev_ask = "";
					this.hint = "";


				})

			}).then(text => {


				return this.$dialog.speak(text);


			}).then(text => {


				this.stage += 2;
				this.next();
			});


			// this.next();

			/// 2문장 연속으로 출력

			// this.$dialog.ask(DB[this.stage][0]);
			//
			// setTimeout(() => {
			//
			// this.$dialog.ask(DB[this.stage+1][0]);
			//
			// }, 2000);
		}
	}.prototype;

})

