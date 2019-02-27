$module.template("ui-speech-to-text")`

	<template>
		<section flex hbox>
			<h2 class="msg" style="margin: auto; text-align: right; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);  width: 100%">{{ text1 }}
				<!--<cursor class="blink" [hidden]="isFinal"></cursor>-->
				<!--<wait-dots [hidden]="text1"></wait-dots>-->
			</h2>	
		</section>
		<mic-wave $wave></mic-wave>
	</template>

`;


$module.component("ui-speech-to-text", function(Observable, Subject, STT) {

	function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
	}

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	return class {
		init($) {
			this.isstart = false;

			this.text1 = "";
			this.isFinal = false;

			// $.on$(document, ["mousedown", "touchstart", "keydown"], true).take(1).subscribe(() => this.listen());

		}


		listen(callback) {

			return new Promise(resolve => {

				this.isstart = true;
				this.$wave.start();
				this.$wave.state = "listen";

				this.stt = STT(event => {
					// console.log(event.resultIndex, event.results);

					if (callback) {
						callback();
					}

					let results = Array.from(event.results[event.resultIndex]);
					let ret = results[0];

					this.text1 = capitalize(ret.transcript);
					this.isFinal = event.results[event.resultIndex].isFinal;

					if (this.isFinal) {
						setTimeout(() => {
							resolve(this.text1);
							this.text1 = "";
						}, 1000);
					}
				});


				this.stt.addEventListener("speechstart", () => {
					this.$wave.state = "speech";
				});

				this.stt.addEventListener("speechend", () => {
					this.$wave.state = "listen";
				});
			});
		}


	}.prototype


});
