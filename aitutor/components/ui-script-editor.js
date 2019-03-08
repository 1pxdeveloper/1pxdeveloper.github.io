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

		let sections = [];
		let section;
		let dialog;

		let tag = "";
		let lastStmt = "";
		let commentStart = false;

		let lines = script.split(/\n\n*/);
		lines.forEach(line => {
			let start = line.charAt(0);

			if (line.startsWith("/*")) {
				commentStart = true;
				return;
			}

			if (line.startsWith("*/")) {
				commentStart = false;
				return;
			}

			if (commentStart) {
				return;
			}

			switch (start) {
				case "/":
					break;

				case "[":
					tag = line.slice(1, -1).trim();
					dialog = {speech: [], answer: []};
					section = {tag, stages: [dialog]};
					sections.push(section);

					console.log("[" + tag + "]", tag);
					break;

				case "(":
					lastStmt = start;
					line = line.slice(1, -1).trim();
					console.log("[guide]", line);

					dialog.guide = line;
					break;

				case "-":
					lastStmt = start;
					line = line.slice(1).trim();
					line = line.replace(/\s*\|\s*/g, "|");
					line = new RegExp(line, "i");

					dialog.answer.push(line);

					console.log("[answer]", line);
					break;

				default:
					if (!line) {
						break;
					}

					if (lastStmt !== "" && dialog.speech.length !== 0) {
						dialog = {speech: [], answer: []};
						section.stages.push(dialog);
					}

					lastStmt = "";
					dialog.speech.push(line);
					break;
			}

		});

		return sections;
	}
});




