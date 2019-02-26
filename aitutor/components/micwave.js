$module.template("mic-wave")`
	<template>
		<section>
			<div $c1></div>
			<div $c2></div>
			<div $c3></div>
			<div $c4></div>
		</section>
	</template>
`;


$module.component("mic-wave", function() {

	return class MicWave {

		init($) {
			this.dots = [this.$c1, this.$c2, this.$c3, this.$c4];
			this.playing = false;
		}

		start() {
			navigator.getUserMedia({audio: true}, (stream) => {
					this.start_microphone(stream);
				},
				function(e) {
					alert('Error capturing audio.');
				}
			);
		}

		stop() {

		}

		start_microphone(stream) {
			this.playing = true;

			let audioContext = new AudioContext();
			let microphone_stream = audioContext.createMediaStreamSource(stream);

			let analyser_node = audioContext.createAnalyser();
			analyser_node.smoothingTimeConstant = 0;
			analyser_node.fftSize = 2048;

			microphone_stream.connect(analyser_node);


			let array_freq_domain = new Uint8Array(2048);

			let dots = this.dots;
			let prev = [6, 6, 6, 6];
			let smoothing = 0.8;

			function draw() {
				requestAnimationFrame(draw);
				analyser_node.getByteFrequencyData(array_freq_domain);

				prev = dots.map((dot, i) => {

					let v = array_freq_domain[i+5] / 128.0;
					v = Math.max(6, v * 18);
					v = (prev[i] * smoothing) + (v * (1 - smoothing));

					dot.style.height = v + "px";

					return v;
				});
			}

			draw();
		}

	}.prototype;
});


$module.factory("STT", function() {

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

		let x = recognition.start();

		return recognition;
	}
});


function speakSound(msg) {
	let url = "https://ai-tutor-lg-ai.appspot.com/tts?text=" + encodeURIComponent(msg);

	let audio = document.createElement('audio');
	audio.style.display = "none";
	audio.src = url;
	audio.autoplay = true;
	audio.onended = function() {
		audio.remove() //Remove when played.
	};
	document.body.appendChild(audio);
}