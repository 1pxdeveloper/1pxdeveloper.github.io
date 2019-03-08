$module.template("ui-speech-to-text")`

	<template>
		<section flex hbox>
			<h2 class="msg me">{{ text1 }}
				<!--<cursor class="blink" [hidden]="isFinal"></cursor>-->
				<!--<wait-dots [hidden]="text1"></wait-dots>-->
			</h2>
		</section>
		<!--<mic-wave $wave></mic-wave>-->
	</template>

`;


$module.component("ui-speech-to-text", function(Observable, STT, capitalize) {

	return class {
		init($) {
			this.isstart = false;

			this.text1 = "";
			this.isFinal = false;

			// $.on$(document, ["mousedown", "touchstart", "keydown"], true).take(1).subscribe(() => this.listen());

		}


		listen(callback) {

			return new Promise(resolve => {

				this.isstart = true;
				// this.$wave.start();
				// this.$wave.state = "listen";

				this.stt = STT(event => {
					// console.log(event.resultIndex, event.results);

					if (callback) {
						callback();
					}

					let results = Array.from(event.results[event.resultIndex]);
					let ret = results[0];

					this.text1 = capitalize(ret.transcript);
					this.isFinal = event.results[event.resultIndex].isFinal;

					if (this.isFinal) {

						this.stt.stop();

						setTimeout(() => {
							resolve(this.text1);
							this.text1 = "";
						}, 1000);
					}
				});


				// this.stt.addEventListener("speechstart", () => {
				// 	this.$wave.state = "speech";
				// });
				//
				// this.stt.addEventListener("speechend", () => {
				// 	this.$wave.state = "listen";
				// });
			});
		}


	}.prototype


});


$module.factory("STT", function(Observable) {

	return function mic(fn) {
		window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		let recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.maxAlternatives = 10;
		recognition.lang = 'en-US';

		console.log(recognition);

		recognition.onnomatch = function(event) {
			console.log("onnomatch");
		};

		recognition.onresult = function(event) {
			console.log(event.resultIndex, event.results);
			fn(event);
		};

		recognition.onsoundstart = function(event) {
			console.log("onsoundstart");
		};

		recognition.onsoundend = function(event) {
			console.log("onsoundend");
		};

		recognition.onspeechstart = function(event) {
			console.log("onspeechstart");
		};

		recognition.onspeechsend = function(event) {
			console.log("onspeechend");
		};

		recognition.start();

		setInterval(function() {

			console.log("start again");
			recognition.start();


		}, 1000)


		return recognition;
	}
});


$module.factory("$timeout", function() {

	return function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
	}

});