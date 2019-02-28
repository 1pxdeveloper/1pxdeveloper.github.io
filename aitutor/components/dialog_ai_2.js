$module.template("ai-app")`

	<template>
		<section *if="!isstart">
			<h1 style="margin: auto">Mission English</h1>
		</section>

		<section [hidden]="!isstart">
			<section>
				<ai-message $dialog></ai-message>
				<ui-speech-to-text $ui_stt></ui-speech-to-text>

				<!--<h2 *foreach="query as text, index" class="msg me" [class.isfinal]="isFinal" style="" [leave]="mySpeakCompleteAnimate.bind(this)"><div>{{ animate2(text, mySpeakComplete.bind(this)) }}</div></h2>-->


				<h2 $hint class="msg" style="text-align: right; color: #888; font-size: 26px" [hidden]="!hint">
					<!--<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px">MISSION</div>-->
					<div style="margin-top: 8px"></div>
					{{ prev_ask }}<br>
					<p class="hint" style="text-align: right; margin-top: 16px" [_hidden]="text1">{{ hint }}</p>
				</h2>

			</section>
			<mic-wave $wave></mic-wave>
		</section>
	</template>

`;


$module.component("ai-app", function(STT, DB) {

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
			this.isstart = true;
			this.next();



			/// 2문장 연속으로 출력


			// this.$dialog.ask(DB[this.stage][0]);
			//
			// setTimeout(() => {
			//
			// this.$dialog.ask(DB[this.stage+1][0]);
			//
			// }, 2000);
			//


		}

		next() {

			this.$dialog.ask(DB[this.stage][0]).then(res => {


				this.prev_ask = DB[this.stage + 1][1];
				this.hint = DB[this.stage + 1][0];


				this.stage += 2;
				this.stage = this.stage % DB.length;


				return this.$ui_stt.listen(() => {

					this.prev_ask = this.hint = "";

				})

			}).then(query => {



				return this.$dialog.speak(query);


			}).then(res => {

				this.next();

			});

		}
	}.prototype;

})

