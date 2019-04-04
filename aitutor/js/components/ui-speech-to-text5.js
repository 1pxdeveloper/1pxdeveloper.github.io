$module.template("ui-speech-to-text")`

	<template>
		<section flex vbox>
			<h2 class="msg transcript" [class.isfinal]="isFinal" style="text-align: right; width: 100%;" [hidden]="!text">{{ text }}</h2>
			<h2 class="guide-text" [hidden]="text">{{ guide_text }}</h2>
			<h2 class="hint-text" [hidden]="text" [class.option]="guide_text2.indexOf('#')>=0">{{ guide_text2 }}</h2>
			<mic-wave $wave style="position: absolute; bottom: 0;"></mic-wave>
		</section>
	</template>

`;


$module.component("ui-speech-to-text", function(STT, ai_pass_check) {

	return class {

		init($) {
			this.index = -1;
			this.text1 = "";
			this.isFinal = false;
		}

		listen(keywords, answer, has_fallback) {

			this.text = "";
			this.keyword = "";
			this.isFinal = false;

			return new Promise((resolve, reject) => {

				/// Listen VUI
				this.$wave.start();
				this.$wave.state = "listen";


				/// Fallback Timer
				function startFallbackTimer() {
					if (!has_fallback) return;
					clearTimeout(startFallbackTimer.timer);
					startFallbackTimer.timer = setTimeout(function() {
						s.unsubscribe();
						reject();
					}, 6500)
				}


				/// STT
				let s = STT.subscribe(event => {
					startFallbackTimer();
					if (!event.results) {
						return;
					}

					/// speech
					this.$wave.state = "speech";

					let result = event.results[event.resultIndex];
					let isFinal = result.isFinal;

					result = Array.from(result);
					result.forEach(r => {
						r.conf = r.confidence;

						keywords.forEach((keyword, index) => {
							let ret = r.transcript.match(keyword);
							if (ret) {
								r.conf *= 10;
								this.keyword = ret[0];
								this.keyword_index = index;
							}
						});
					});

					result.sort((a, b) => b.conf - a.conf);

					if (this.text.indexOf(result[0].transcript) === -1) {
						this.text = result[0].transcript;
					}


					/// Check Result???
					if (!isFinal) {
						return;
					}

					result.forEach(r => r.conf * -levenshteinDistance(this.text, r.transcript));
					result.sort((a, b) => b.conf - a.conf);

					this.text = result[0].transcript;
					this.isFinal = true;
					this.$wave.state = "final";
					clearTimeout(startFallbackTimer.timer);


					if (answer && answer.length) {

						ai_pass_check(this.text, answer).then(res => {

							console.log(res);
							console.log(res[0]);
							console.log(res[0] === "True");

							let okay = res && res[0] === "True";
							if (has_fallback || okay) {
								s.unsubscribe();
								resolve({query: this.keyword, index: this.keyword_index, transcript: this.text});
							}
							else {
								this.$wave.state = "nomatch";

								setTimeout(_ => {
									this.$wave.state = "listen";
									this.isFinal = false;
									this.text = "";
								}, 500);

							}
						});

						return;
					}

					/// @FIXME: 임시 통과 테스트
					if (has_fallback) {
						s.unsubscribe();
						resolve({query: this.keyword, index: this.keyword_index, transcript: this.text});
					}
					else {
						if (this.keyword) {
							s.unsubscribe();
							resolve({query: this.keyword, index: this.keyword_index, transcript: this.text});
						}
						else {
							this.$wave.state = "nomatch";

							setTimeout(_ => {
								this.$wave.state = "listen";
								this.isFinal = false;
								this.text = "";
							}, 500);
						}
					}

				});
			});
		}

	}.prototype
});


function levenshteinDistance(a, b) {
	// Create empty edit distance matrix for all possible modifications of
	// substrings of a to substrings of b.
	const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

	// Fill the first row of the matrix.
	// If this is first row then we're transforming empty string to a.
	// In this case the number of transformations equals to size of a substring.
	for (let i = 0; i <= a.length; i += 1) {
		distanceMatrix[0][i] = i;
	}

	// Fill the first column of the matrix.
	// If this is first column then we're transforming empty string to b.
	// In this case the number of transformations equals to size of b substring.
	for (let j = 0; j <= b.length; j += 1) {
		distanceMatrix[j][0] = j;
	}

	for (let j = 1; j <= b.length; j += 1) {
		for (let i = 1; i <= a.length; i += 1) {
			const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
			distanceMatrix[j][i] = Math.min(
				distanceMatrix[j][i - 1] + 1, // deletion
				distanceMatrix[j - 1][i] + 1, // insertion
				distanceMatrix[j - 1][i - 1] + indicator, // substitution
			);
		}
	}

	return distanceMatrix[b.length][a.length];
}


$module.factory("STT", function(Observable) {

	window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	return new Observable(function(observer) {

		let recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US';

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


$module.factory("ai_pass_check", function(jsonp) {

	return function(in_sent, sents) {
		return jsonp("http://34.85.21.250:9000/pass-check", {in_sent, sents});
	}
});

