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

	/// @TODO: voice가 로딩이 되었는지 확인하고 speck를 lazyloading 할 수 있도록 할것!!!
	/// @TODO: lazyloading을 pipe로 만들면 좋을 듯..

	// if (voices.length === 0) {
	// 	synth.addEventListener("voiceschanged", function() {
	//
	// 	});
	// }

	return {
		speak$(text, index) {

			index = index || 1;
			text = text.trim() + " ";

			return new Observable(observer => {

				let voices = synth.getVoices();
				let EN = voices.filter(v => v.lang.startsWith("en"));
				index = index % EN.length;

				let voice = EN[index];


				/// create voice utter
				let utterThis = new SpeechSynthesisUtterance(text);
				utterThis.voice = voice;
				utterThis.rate = 1 + ((Math.random() - 0.5) * 0.1);
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
						console.log(start, event.charIndex);
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
	}
});




