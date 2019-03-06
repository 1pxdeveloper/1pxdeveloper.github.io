$module.template("ui-script-editor")`

	<template>
		<textarea [(value)]="script" (input)="save()"></textarea>
	</template>

`;


$module.component("ui-script-editor", function(parseScript) {

	return class {
		init($) {
			this.name = location.search || "?";
			this.script = localStorage.getItem(this.name) || "";
		}

		save() {
			localStorage.setItem(this.name, this.script);
		}

		getData() {
			return parseScript(this.script);
		}

	}.prototype

});


$module.factory("parseScript", function() {


	return function parseScript(script) {

		let ret = {sections: []};
		let section = {missions: []};
		let mission = {ask: [], answer: []};

		let lastStmt = "";

		let lines = script.split(/\n/);

		lines.forEach((line, lineNo) => {
			if (!line) return;

			try {
				let start = line.charAt(0);

				switch (start) {
					case "#":
						lastStmt = start;
						line = line.slice(1).trim();
						// console.log("[section]", line);

						mission = {ask: [], answer: []};
						section = {missions: [mission]};
						ret.sections.push(section);
						break;

					case "(":
						lastStmt = start;
						line = line.slice(1, -1).trim();
						// console.log("[guide]", line);

						mission.guide = line;

						break;

					case "-":
						lastStmt = start;
						line = line.slice(1).trim();
						line = line.replace(/\s*\|\s*/g, "|");
						line = new RegExp(line, "i");

						mission.answer.push(line);

						// console.log("[answer]", line);
						break;

					default:
						if (lastStmt !== "" && mission.ask.length !== 0) {
							mission = {ask: [], answer: []};
							section.missions.push(mission);
						}

						lastStmt = "";
						mission.ask.push(line);
						// console.log("[ask]", line);
						break;
				}

			} catch (e) {
				console.error(e);
				alert("error: " + lineNo + ":" + line);
			}

		});


		return ret;
	}
});




