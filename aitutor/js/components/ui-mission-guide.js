$module.template("ui-mission-guide")`

	<template>
		<section flex hbox>
			<h2 class="msg me">{{ text1 }}
				<!--<cursor class="blink" [hidden]="isFinal"></cursor>-->
				<!--<wait-dots [hidden]="text1"></wait-dots>-->
			</h2>
		</section>
		<mic-wave $wave></mic-wave>
	</template>

`;


$module.component("ui-mission-guide", function(Observable, Subject, STT) {

	return class {
		init($) {
		}


		listen(callback) {

		}

	}.prototype

});