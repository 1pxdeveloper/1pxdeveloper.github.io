$module.template("ai-app-screen")`

	<template>
		<section>
			<section>
				<!--<p class="msg" state="done">-->
					<!--Well, that's something I'm not familiar with. Why don't we talk about 'Cafe' today?-->
					<!--<br>-->
					<!--<span style="color:#999; font-size: 27px">(음.. 그건 내가 잘 모르겠는데.. 오늘은 나랑 카페 얘기 해보는게 어떄?)</span>-->
				<!--</p>-->
				<!---->
				<p $p class="msg" state="speak">
					Why don't we talk about 'Cafe' today?
					<br>
					<div $a style="transition: all 0.5s 0.8s; position:absolute; top: 72px; padding: 0 12px; width: 80%; color:#999; font-size: 16px; opacity: 0">(음.. 그건 내가 잘 모르겠는데.. 오늘은 나랑 카페 얘기 해보는게 어떄?)</div>
				</p>

				
				<!--<p class="msg">Hello world</p>-->
				
				
				<!--&lt;!&ndash;<h2 *foreach="query as text, index" class="msg me" [class.isfinal]="isFinal" style="" [leave]="mySpeakCompleteAnimate.bind(this)"><div>{{ animate2(text, mySpeakComplete.bind(this)) }}</div></h2>&ndash;&gt;-->


				<h2 $hint class="msg" style="text-align: right; color: #888; font-size: 26px; width: 80%; right: 0">
					<div style="margin-top: 8px"></div>
					{{ prev_ask }}<br>

					<div style="border-radius: 13px; border: 1px solid #ccc; font-size: 13px; display: inline-block; padding: 4px 8px">MISSION</div>

					<div class="hints">
						<p class="hint" style="text-align: right;">{{ hint }}</p>
						<p class="hint hint2" style="text-align: right">{{ hint2 }}</p>
					</div>
					
				</h2>

			</section>
			<mic-wave $wave></mic-wave>
		</section>
	</template>

`;


$module.component("ai-app-screen", function(STT, DB) {

	const {Observable} = require("1px");

	function capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	return class AIApp {
		init($) {
			this.isstart = false;

			this.texts = [];
			this.query = [];

			this.flag = true;

			this.tutorLegacyNode = null;
			this.myLegacyNode = null;

			this.stage = 0;

			this.$p.setAttribute("state", "done");
			this.$a.style.opacity = 1;


			this.prev_ask = "원하는 종류의 카페메뉴를 주문해보세요.";
			this.hint = "Can I have a cup of cafe latee?";
			this.hint2 = "I want a cup of americano?";


			// $.on$(document, ["mousedown", "touchstart", "keydown"], true).subscribe(() => {
			//
			//
			// 	this.$p.setAttribute("state", "done");
			// 	this.$a.style.opacity = 1;
			//
			// });

			window.app = this;
		}


		start() {
			this.isstart = true;
			this.next();


			/// 2문장 연속으로 출력


			// this.$dialog.ask(DB[this.stage][0]);
			//
			// setTimeout(() => {
			//
			// this.$dialog.ask(DB[this.stage+1][0]);
			//
			// }, 2000);
			//


		}

		next() {

			this.$dialog.ask(DB[this.stage][0]).then(res => {


				this.prev_ask = DB[this.stage + 1][1];
				this.hint = DB[this.stage + 1][0];


				this.stage += 2;
				this.stage = this.stage % DB.length;


				return this.$ui_stt.listen(() => {

					this.prev_ask = this.hint = "";

				})

			}).then(query => {


				return this.$dialog.speak(query);


			}).then(res => {

				this.next();

			});

		}
	}.prototype;

})

