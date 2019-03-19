$module.template("ui-speech-to-text")`

	<template>
		<section flex vbox>
			<h2 class="msg transcript" [class.isfinal]="isFinal" style="text-align: right; width: 100%;" [hidden]="!text">{{ text }}</h2>
			<h2 [style.font-size.px]="(guide_text && guide_text2) ? 14 : 20" style="text-align: center; width: 100%; font-size: 20px; color: #555; padding: 8px 16px;" [hidden]="text">{{ guide_text }}</h2>
			<h2 style="text-align: center; width: 100%; font-size: 30px; line-height: 48px; color: #3a3aa5; padding: 0 16px;" [hidden]="text">{{ guide_text2 }}</h2>
			<mic-wave $wave style="position: absolute; bottom: 0;"></mic-wave>
		</section>
	</template>

`;


$module.component("ui-speech-to-text", function(STT) {

	return class {
		init($) {
			this.index = -1;
			this.text1 = "";
			this.isFinal = false;
		}

		listen(keywords, has_fallback) {

			this.text = "";
			this.keyword = "";
			this.isFinal = false;

			return new Promise((resolve, reject) => {

				// return;

				let timer;

				function fallbackPause() {
					if (!has_fallback) return;

					clearTimeout(timer);
					timer = setTimeout(function() {
						s.unsubscribe();
						reject();
					}, 6500)
				}

				this.$wave.start();
				this.$wave.state = "listen";

				let s = STT.subscribe(event => {
					// console.log(event);

					fallbackPause();
					if (!event.results) {
						return;
					}

					this.$wave.state = "speech";

					let result = event.results[event.resultIndex];
					let isFinal = result.isFinal;

					result = Array.from(result);

					result.forEach(r => {
						r.conf = r.confidence;
						console.log(r.transcript, r.confidence);

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

					if (isFinal) {
						result.forEach(r => r.conf * -levenshteinDistance(this.text, r.transcript));
						result.sort((a, b) => b.conf - a.conf);

						this.text = result[0].transcript;
						this.isFinal = true;
						this.$wave.state = "final";
						clearTimeout(timer);


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
		// recognition.lang = 'ko';

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