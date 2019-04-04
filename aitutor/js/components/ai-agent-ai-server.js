$module.template("ai-agent")`

	<template>
		<animated-dialog $dialog></animated-dialog>
		<ui-speech-to-text $stt></ui-speech-to-text>
	</template>

`;


$module.component("ai-agent", function(capitalize, $timeout) {

	return class {
		init($) {
			this.lastQuery = "";
			this.voiceIndex = 1;
		}

		clear() {
			this.$dialog.clear();
			this.$stt.guide_text = "";
			this.$stt.classList.remove("listen");
		}

		speak(msg, voiceIndex, callback) {
			if (this.lastQuery) {
				msg = msg.replace(/__+/g, this.lastQuery);
				msg = capitalize(msg);
			}
			return this.$dialog.ask(msg, this.voiceIndex, callback);
		}

		listen(keywords, answer, guide, hint, has_fallback) {

			let guide1 = hint;
			let guide2 = guide;

			this.$stt.classList.add("listen");
			this.$stt.guide_text2 = guide1;
			this.$stt.guide_text = guide2;

			return this.$stt.listen(keywords, answer, has_fallback)
				.then(res => {
					this.$stt.classList.remove("listen");

					// return this.$dialog.speak(res.transcript).then(_ => {
					return $timeout(500).then(_ => {


						console.log(res, res.query);


						if (res.query) {
							this.lastQuery = res.query;
							return res;
						}

						throw res;
					})
				})

				.catch(err => {
					this.$stt.classList.remove("listen");
					throw err;
				})
		}

	}.prototype;


});
