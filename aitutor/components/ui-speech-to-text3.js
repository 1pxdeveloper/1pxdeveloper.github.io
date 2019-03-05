$module.template("ui-speech-to-text")`

	<template>
		<section flex vbox>
			<h2 class="msg transcript" [class.isfinal]="isFinal" style="text-align: right; width: 100%;" [hidden]="!text || isFinal">{{ text }}</h2>
			<h2 style="text-align: center; width: 100%; font-size: 24px; color: #555; padding: 16px;" [hidden]="text">{{ guide_text }}</h2>
			<mic-wave $wave style="position: absolute; bottom: 0;"></mic-wave>
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

			this.text = "";
			this.isFinal = false;

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

						this.text = result[0].transcript;


						Array.from(result).forEach(r => {

							if (!isok) {
								keywords.forEach(keyword => {
									if (r.transcript.toLowerCase().indexOf(keyword) >= 0) {
										isok = keyword;
									}
								});
							}

							// r.transcript
							console.log(r);
						});


						if (result.isFinal) {
							clearTimeout(timer);

							this.isFinal = true;

							this.$wave.state = "final";
							// resolve({query: isok, transcript: result[0].transcript});
							// s.unsubscribe();

							setTimeout(function() {
								resolve({query: isok, transcript: result[0].transcript});
								s.unsubscribe();

							}, 3000);

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

			this.text = "";
			this.isFinal = false;

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

						this.text = result[0].transcript;


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
							this.isFinal = true;
							this.$wave.state = "final";

							setTimeout(function() {
								resolve({query: isok, transcript: result[0].transcript});
								s.unsubscribe();
								this.isFinal = false;
								this.text = "";

							}, 3000);

						} else if (result.isFinal) {

							this.isFinal = true;
							this.$wave.state = "nomatch";

							setTimeout(_ => {
								this.$wave.state = "listen";
								this.isFinal = false;
								this.text = "";

							}, 3000);
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