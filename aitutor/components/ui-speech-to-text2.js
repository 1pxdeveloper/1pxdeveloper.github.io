$module.template("ui-speech-to-text")`

	<template>
		<section flex vbox>
			<h2 style="text-align: center; width: 100%; font-size: 30px; color: #555">{{ guide_text }}</h2>
			<mic-wave $wave [index]="index"></mic-wave>
		</section>
	</template>

`;


$module.component("ui-speech-to-text", function(Observable, Subject, STT, $timeout) {


	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	return class {
		init($) {
			this.isstart = false;

			this.index = -1;
			this.text1 = "";
			this.isFinal = false;

			// $.on$(document, ["mousedown", "touchstart", "keydown"], true).take(1).subscribe(() => this.listen());

		}


		listen(keywords) {

			return new Promise(resolve => {

				let isok = false;

				this.$wave.start();
				this.$wave.state = "listen";


				let s = STT.subscribe(event => {

					this.text1 = event.type;

					console.log(event);

					if (event.results) {
						this.$wave.state = "speech";

						let result = event.results[event.resultIndex];

						Array.from(result).forEach(r => {


							if (!isok) {
								keywords.forEach(keyword => {
									if (r.transcript.indexOf(keyword) >= 0) {
										isok = keyword;
									}
								});
							}

							// r.transcript
							console.log(r);
						});


						if (result.isFinal) {

							this.$wave.state = "final";

							setTimeout(function() {

								resolve(isok);
								s.unsubscribe();

							}, 500);

						}

						// else {
						// 	this.index = (this.index + 1) % 3;
						//
						// }
					}
				});


				// this.stt = STT(event => {
				// 	console.log(event.resultIndex, event.results);
				//
				// 	// if (callback) {
				// 	// 	callback();
				// 	// }
				// 	//
				// 	// let results = Array.from(event.results[event.resultIndex]);
				// 	// let ret = results[0];
				// 	//
				// 	// this.text1 = capitalize(ret.transcript);
				// 	// this.isFinal = event.results[event.resultIndex].isFinal;
				// 	//
				// 	// if (this.isFinal) {
				// 	//
				// 	// 	this.stt.stop();
				// 	//
				// 	// 	setTimeout(() => {
				// 	// 		resolve(this.text1);
				// 	// 		this.text1 = "";
				// 	// 	}, 1000);
				// 	// }
				// });


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

	window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	return new Observable(function(observer) {

		let recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		// recognition.maxAlternatives = 10;
		recognition.lang = 'en-US';

		console.log(recognition);


		for (let prop in SpeechRecognition.prototype) {
			if (!SpeechRecognition.prototype.hasOwnProperty(prop)) {
				continue;
			}

			if (prop.startsWith("on")) {
				recognition[prop] = function(event) {
					observer.next(event);
				}
			}
		}

		recognition.start();

		return function() {
			recognition.stop();
		}
	});
});


$module.factory("$timeout", function() {

	return function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
	}

});