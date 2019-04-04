$module.template("ui-speech-to-text")`

	<template>
		<section flex vbox>
			<h2 style="text-align: center; width: 100%; font-size: 30px; color: #555">{{ guide_text }}</h2>
			<mic-wave $wave></mic-wave>
		</section>
	</template>

`;


$module.component("ui-speech-to-text", function(Observable, Subject, STT, $timeout, capitalize) {

	return class {
		init($) {
			this.isstart = false;

			this.index = -1;
			this.text1 = "";
			this.isFinal = false;

			// $.on$(document, ["mousedown", "touchstart", "keydown"], true).take(1).subscribe(() => this.listen());
		}


		listen(keywords) {

			return new Promise((resolve, reject) => {

				let timer;
				function fallbackPause() {
					clearTimeout(timer);
					timer = setTimeout(function() {
						reject();
					}, 5000)
				}

				let isok = "";

				this.$wave.start();
				this.$wave.state = "listen";



				let s = STT.subscribe(event => {

					fallbackPause();

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
							clearTimeout(timer);

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
			});
		}


		choice(keywords) {

			keywords = keywords.map(str => str.toLowerCase());

			return new Promise((resolve, reject) => {

				let isok = "";

				this.$wave.start();
				this.$wave.state = "listen";

				let s = STT.subscribe(event => {
					console.log(event);

					if (event.results) {
						this.$wave.state = "speech";

						let result = event.results[event.resultIndex];

						Array.from(result).forEach(r => {

							if (!isok) {
								keywords.forEach(keyword => {
									if (r.transcript.toLowerCase().indexOf(keyword) >= 0) {
										isok = keyword;
									}
								});
							}
						});

						if (isok) {
							this.$wave.state = "final";

							setTimeout(function() {
								resolve(isok);
								s.unsubscribe();

							}, 500);
						}


						else if (result.isFinal) {
							this.$wave.state = "nomatch";
							setTimeout(_ => {
								this.$wave.state = "listen";

							}, 500);
						}


					}
				});
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
