$module.template("ui-text-to-speech")`

	<template>
		<section flex hbox>
			<h2 class="msg">
				<div *foreach="sentences as sentence, index">
					<span *foreach="sentence.words as word, index" class="tts-word" transition-enter="tts-word-animation">{{ word }}</span>
				</div>
			</h2>
		</section>
	</template>

`;


$module.component("ui-text-to-speech", function(Observable, TTS) {

	return class {
		init($) {
			this.sentences = [];
		}

		speak(text, index) {

			function speakSentence(sentences, text) {
				let words = [];
				sentences.push({words});

				return new Promise(resolve => {
					TTS.speak$(text, index)
						.do(word => {
							words.push(word)
						})
						.complete(_ => {
							words = [];
							resolve(text);
						})
						.subscribe()
				});
			}

			let promise = Promise.resolve();
			text.split(/\n/).forEach(sentence => {
				promise = promise.then(_ => speakSentence(this.sentences, sentence));
			});

			return promise.then(_ => {
				this.sentences = [];
				return text;
			});
		}

	}.prototype

});


$module.factory("TTS", function(Observable) {

	let synth = window.speechSynthesis;
	let EN;

	function getEnglishVoices(index) {
		if (!EN) {
			let voices = synth.getVoices();
			EN = voices.filter(v => v.lang.startsWith("en"));
		}

		if (!index) {
			index = EN[1].voiceURI === "Daniel" ? 1 : 3;
		}

		index = index % EN.length;
		return EN[index];
	}

	let self = {
		rate: 1,

		speak$(text, index) {
			text = text.trim() + " ";

			return new Observable(observer => {

				/// create voice and utter
				let voice = getEnglishVoices(index);
				let utterThis = new SpeechSynthesisUtterance(text);
				utterThis.voice = voice;
				utterThis.rate = self.rate + ((Math.random() - 0.5) * 0.1);
				utterThis.pitch = 1 + ((Math.random() - 0.5) * 0.1);


				/// split word for animation
				let start = 0;
				let sIndex = [0];
				text.replace(/\s+/g, function(a, index) {
					sIndex.push(index + 1);
					return a;
				});


				/// publish words
				/// @NOTE: 경우에 따라서 SpeechSynthesisUtterance의 이벤트가 발생하지 않는 버그가 있다. 강제로 word를 배출하도록 타이머 설정.
				let timer;

				function nextWord(charIndex) {
					let word = "";
					while(start <= charIndex) {
						word = text.slice(start, sIndex[0]);
						observer.next(word);
						start = sIndex.shift();
					}

					let delay = 300;
					if (word.search(/[.?!,]/) >= 0) {
						delay = 550;
					}
					delay *= utterThis.rate;

					clearTimeout(timer);
					timer = setTimeout(_ => nextWord(start), delay);
				}


				/// Bind event Handlers
				utterThis.onstart = function() {
					nextWord(start);
				};

				utterThis.onboundary = function(event) {
					if (event.name === "word") {
						nextWord(event.charIndex);
					}
				};

				utterThis.onend = function() {
					nextWord(start);
					observer.complete();
				};

				/// Speak utter
				synth.speak(utterThis);
				setTimeout(_ => nextWord(start), 500);
			});
		}
	};


	return self;
});




