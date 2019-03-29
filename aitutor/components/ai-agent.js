$module.template("ai-agent")`

	<template>
		<animated-dialog $dialog></animated-dialog>
		<ui-speech-to-text $stt></ui-speech-to-text>
	</template>

`;


$module.component("ai-agent", function(capitalize) {

	return class {
		init($) {
			this.lastQuery = "";
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
			return this.$dialog.ask(msg, voiceIndex, callback);
		}

		listen(answer, guide, has_fallback) {

			let [guide1, guide2] = guide.split(/\s*\/\s*/);

			this.$stt.classList.add("listen");

			this.$stt.guide_text2 = "";
			this.$stt.guide_text = "";

			if (guide1 && guide2) {
				this.$stt.guide_text2 = guide1;
				this.$stt.guide_text = guide2;
			}
			else {
				this.$stt.guide_text = guide1;
			}

			return this.$stt.listen(answer, has_fallback)
				.then(res => {
					this.$stt.classList.remove("listen");

					return this.$dialog.speak(res.transcript).then(_ => {

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
