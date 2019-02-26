$module.template("ai-app")`

	<template>
		<main *if="!isstart">
			<section>
				<h1 style="margin: auto">Mission English</h1>
				<h1 style="margin: auto">start to click</h1>
			</section>
		</main>

		<main [hidden]="!isstart">
			<section>
				<div class="prev_ask" [class.me]="prev_ask_turn_me" style="padding: 16px">In Cafe</div>

				<section flex hbox>
					<h2 class="msg" [class.isfinal]="isFinal" style="margin: auto; text-align: right">{{ text1 }}{{isFinal ? '?' : '' }}
						<cursor class="blink" [hidden]="isFinal"></cursor>
					</h2>
				</section>

				<section vbox style="height: 200px">
					<div class="" [class.me]="" style="text-align: center">"{{ prev_ask }}"</div>
					<br>
					<h2 class="hint" style="">{{ hint }}</h2>
				</section>

				<mic-wave $wave></mic-wave>
			</section>
		</main>
	</template>

`;


$module.component("ai-app", function(STT) {

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	let DB = [
		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],
	];

	// DB.sort(() => Math.random() > 0.5 ? 1 : -1);

	return class AIApp {
		init($) {
			this.isstart = false;
			this.text1 = "";
			this.isFinal = false;

			this.ask = "";
			this.text1 = "";

			this.stage = 0;

			$.on$(document, ["mousedown", "touchstart"], true).take(1).subscribe(() => this.start());
		}

		start() {
			this.isstart = true;
			this.$wave.start();

			this.stt = STT(event => {
				console.log(event.resultIndex, event.results);
				let results = Array.from(event.results[event.resultIndex]);
				let ret = results[0];

				this.text1 = capitalize(ret.transcript);
				this.isFinal = event.results[event.resultIndex].isFinal;

				if (this.isFinal) {
					this.stop();
				}
			});

			this.next();
		}

		stop() {
			this.hint = this.original_hint;
			clearInterval(this.timer);
			this.timer = null;

			this.stt.stop();

			setTimeout(() => {
				this.stt.start();
				this.next();
			}, 2000)
		}


		next() {
			let [en, ko] = DB[this.stage++];

			this.prev_ask = ko;
			this.text1 = "";
			this.isFinal = false;

			this.hint = "";
			this.original_hint = en;
			this.hint = this.original_hint.replace(/[a-zA-Z]/g, "_");


			setTimeout(() => {

				let index = 0;
				this.timer = setInterval(() => {

					index++;
					this.hint = this.original_hint.slice(0, index) + this.hint.slice(index);

				}, 250);


			}, 3000);


		}


	}.prototype;


});
