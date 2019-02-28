$module.template("mic-wave")`
	<template>
		<section [attr.state]="state">
			<div $c1 class="d1">
				<div $c2 class="d2">
					<div $c3 class="d3"></div>
				</div>
			</div>
		</section>
	</template>
`;


$module.component("mic-wave", function() {

	let SIZE = 1;

	return class MicWave {

		init($) {
			this.dots = [this.$c1, this.$c2, this.$c3];//, this.$c4];
			this.state = "stop";

			$`this.state`.subscribe(state => {
				if (state !== "speech") {
					this.dots.forEach(dot => {
						dot.style.transform = null;
					})
				}
			})
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
			let smoothing = 0.8;

			let loop = 0;

			let self = this;

			function draw() {
				requestAnimationFrame(draw);

				if (self.state === "speech") {
					analyser_node.getByteFrequencyData(array_freq_domain);

					prev = dots.map((dot, i) => {

						let v = array_freq_domain[i + 5] / 128.0;
						v = Math.max(SIZE, v);
						// v = Math.min(v, 1.5);
						v = (prev[i] * smoothing) + (v * (1 - smoothing));

						dot.style.transform = "scale(" + (v * (i + 1) * 0.75) + ")";

						// dot.style.height = v + "px";

						return v;
					});
				}
			}

			draw();
		}

	}.prototype;
});