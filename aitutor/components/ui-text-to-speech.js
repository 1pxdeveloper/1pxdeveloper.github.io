$module.template("ui-text-to-speech")`

	<template>
		<section flex hbox>
			<h2 class="msg"><span *foreach="words as word, index" class="tts-word" transition-enter="tts-word-animation">{{ word }}</span></h2>
		</section>
	</template>

`;


$module.component("ui-text-to-speech", function(Observable, TTS) {

	return class {
		init($) {

		}

		speak(text, index) {
			this.words = [];

			return new Promise(resolve => {

				TTS.speak$(text, index).complete(_ => resolve(text)).subscribe(word => {
					this.words.push(word);
				});

			});
		}

	}.prototype

});


$module.factory("TTS", function(Observable) {

	let synth = window.speechSynthesis;

	return {
		speak$(text, index) {

			index = index || 1;
			text = text.trim() + " ";

			return new Observable(observer => {

				let voices = synth.getVoices();
				let EN = voices.filter(v => v.lang.startsWith("en"));
				index = index % EN.length;

				let voice = EN[index];

				let utterThis = new SpeechSynthesisUtterance(text);
				utterThis.voice = voice;
				utterThis.rate = 1 + ((Math.random() - 0.5) * 0.1);
				utterThis.pitch = 1 + ((Math.random() - 0.5) * 0.1);

				utterThis.onboundary = function(event) {

					if (event.name === "word") {
						let nextIndex = text.slice(event.charIndex).indexOf(" ");
						let word = text.slice(event.charIndex, event.charIndex + nextIndex) + " ";
						observer.next(word);
					}
				};

				utterThis.onend = function(event) {
					observer.complete();
				};

				synth.speak(utterThis);
			});

		}
	}
});




