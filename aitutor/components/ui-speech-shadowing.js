$module.template("ui-speech-shadowing")`

	<template>
		<section flex vbox>
			<h2 style="text-align: center; width: 100%; font-size: 32px; color: #ccc; padding: 8px 16px;">
				<span *foreach="guide_words as word, index" [class.ok]="word.tag">{{ word.text }}</span>
			</h2>
			<mic-wave $wave style="position: absolute; bottom: 0;"></mic-wave>
		</section>
	</template>

`;


$module.component("ui-speech-shadowing", function(STT) {


	function makeWords(str) {
		return str.split(/(\s+)/g).map(v => v.toLowerCase().replace(/[^a-z]/g, ""));
	}

	return class {
		init($) {
			this.guide_words = [];
		}

		shadowing(guide, has_fallback) {

			this.guide_words = guide.split(/(\s+)/g).map(text => {
				return {text, tag: false}
			});


			let A = makeWords(guide);


			this.isFinal = false;

			return new Promise((resolve, reject) => {

				this.$wave.start();
				this.$wave.state = "listen";

				let s = STT.subscribe(event => {
					// console.log(event);

					if (!event.results) {
						return;
					}

					this.$wave.state = "speech";

					let result = event.results[event.resultIndex];
					let isFinal = result.isFinal;


					Array.from(result).forEach((r, index) => {
						console.log(index, r.transcript);

						let B = makeWords(r.transcript);

						let [c, d] = LCS(A, B);

						c.forEach((word, index) => {
							this.guide_words[index].tag = true;
						});

						// console.log(c, d);
					});


					if (isFinal) {

						setTimeout(_ => {
							s.unsubscribe();
							resolve(this.guide_words.every(t => t.tag));
							this.guide_words = [];

						}, 500);


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


function LCS(s1, s2) {
	s1 = s1 || [];
	s2 = s2 || [];

	let M = [];
	for (let i = 0; i <= s1.length; i++) {
		M.push([]);

		for (let j = 0; j <= s2.length; j++) {
			let currValue = 0;
			if (i === 0 || j === 0) {
				currValue = 0;
			}
			else if (s1[i - 1] === s2[j - 1]) {
				currValue = M[i - 1][j - 1] + 1;
			}
			else {
				currValue = Math.max(M[i][j - 1], M[i - 1][j]);
			}

			M[i].push(currValue);
		}
	}

	let i = s1.length;
	let j = s2.length;

	// let s3 = [];
	let s4 = [];
	let s5 = [];

	while(M[i][j] > 0) {
		if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
			// s3.unshift(s1[i - 1]);

			s4[i - 1] = s1[i - 1];
			s5[j - 1] = s1[i - 1];

			i--;
			j--;
		}
		else if (M[i - 1][j] > M[i][j - 1]) {
			i--;
		}
		else {
			j--;
		}
	}

	return [s4, s5];
}