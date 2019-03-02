$module.template("mic-wave")`
	<template>
		<section [attr.state]="state">
			<div $c1 [attr.selected]="index === 0" class="c1"></div>
			<div $c2 [attr.selected]="index === 1"></div>
			<div $c3 [attr.selected]="index === 2" class="c2"></div>
		</section>
	</template>
`;


$module.component("mic-wave", function() {

	let SIZE = 10;

	return class MicWave {

		init($) {
			this.dots = [this.$c1, this.$c2, this.$c3];
			this.state = "stop";
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
			let prev = [SIZE, SIZE, SIZE, SIZE];
			let smoothing = 0.9;

			let loop = 0;

			let self = this;

			function draw() {
				requestAnimationFrame(draw);

				if (self.state === "speech") {
					analyser_node.getByteFrequencyData(array_freq_domain);

					prev = dots.map((dot, i) => {

						let v = array_freq_domain[i + 5] / 128.0;
						v = Math.max(SIZE, v * 18);
						v = (prev[i] * smoothing) + (v * (1 - smoothing));

						dot.style.height = v + "px";

						return v;
					});
				} else {

					dots.forEach((dot, i) => {
						dot.style.height = 10 + "px";
					});
				}
			}

			draw();
		}

	}.prototype;
});