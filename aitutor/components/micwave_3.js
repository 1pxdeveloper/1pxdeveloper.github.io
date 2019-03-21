$module.template("mic-wave")`
	<template>
		<section [attr.state]="state">
			<canvas $canvas width="375" height="80"></canvas>
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
			analyser_node.smoothingTimeConstant = 0.9;
			analyser_node.fftSize = 2048;

			microphone_stream.connect(analyser_node);

			let canvas = this.$canvas;
			let ctx = canvas.getContext("2d");


			let array_freq_domain = new Uint8Array(2048);

			function draw() {
				requestAnimationFrame(draw);

				analyser_node.getByteTimeDomainData(array_freq_domain);
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				let HEIGHT = canvas.height;
				let sliceWidth = 2;
				let x = 0;

				ctx.beginPath();
				ctx.lineWidth = 1;
				ctx.strokeStyle = "#111";

				for (let i = 0; i < canvas.width; i++) {

					let v = array_freq_domain[parseInt(array_freq_domain.length  / canvas.width* i)] / 128.0;
					let y = v * HEIGHT / 2;

					if (i === 0) {
						ctx.moveTo(x, y);
					}
					else {
						ctx.lineTo(x, y);
					}

					x += sliceWidth;
				}

				ctx.stroke();
			}

			draw();
		}

	}.prototype;
});