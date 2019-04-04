$module.template("animated-dialog")`

	<template>
		<p *foreach="messages as msg, index" class="msg" [index]="index" [attr.who]="msg.who">{{ msg.text }}<span class="caption" [class.show]="!!msg.caption">{{ msg.caption }}</span>
		</p>
		<ui-text-to-speech $tts></ui-text-to-speech>
	</template>

`;


$module.component("animated-dialog", function($timeout) {

	return class {
		init($) {
			this.clear();
		}

		clear() {
			this.messages = [{}, {}, {}];
			this.promise = Promise.resolve();
		}

		push(text, flag, caption) {
			return this.promise = this.promise.then(_ => {

				let who = flag ? "me" : "ai";

				let msg = this.messages[this.messages.length - 1];
				msg.text = text;
				msg.who = who;
				msg.caption = caption;

				this.messages.push({});
				this.messages.shift();

				return $timeout(500);
			});
		}

		/// @TODO: $tts 에니메이션 word와 실제 msg의 경우 word-wrap이 달라지는 경우가 있다. 수정할 것!!

		askWithCaption(text, caption) {
			return this.$tts.speak(text).then(text => {
				return this.push(text, false, caption);
			});
		}

		ask(text, voiceIndex, callback) {

			// let speech = text;
			// if (text.speech) {
			// 	speech = text.speech;
			// 	text = text.text;
			// }

			return this.$tts.speak(text, voiceIndex).then(text => {
				if (callback) {
					let ret = callback();
					this.push(text, false);
					return ret;
				}

				return this.push(text, false);
			});
		}

		speak(text) {
			return this.push(text, true);
		}

	}.prototype;


});
