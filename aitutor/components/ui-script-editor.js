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

		let multi_comments = /\/\*(\*(?!\/)|[^*])*\*\//g;
		let line_comments = /\/\/[^\n]*\n/g;

		script = script.replace(multi_comments, "");
		script = script.replace(line_comments, "\n");


		let lex = [
			["tag", /\[([^\]]+)]\n\s*/g],
			["text", /`([^`]*)`/g],
			["guide", /\(([^\)]*)\)/g],
			["answer", /-([^\n]+)\n/g],
			["text", /([^\n]+)\n/g],
			["ws", /\s/g],
			["unknown", /./g],
		];

		let re = new RegExp(lex.map(r => r[1].source).join("|"), "g");
		let types = lex.map(r => r[0]);


		let sections = [];
		let section;
		let dialog;

		let prevType;

		script.replace(re, function(a) {

			let type = "";
			let line = "";

			for (let i = 1; i < arguments.length - 2; i++) {
				if (arguments[i] !== undefined) {
					type = types[i - 1];
					line = arguments[i].trim();
					break;
				}
			}

			if (type) {
				console.log("(" + type + ")", line);
			}

			switch (type) {
				case "tag":
					prevType = type;

					let tag = line;
					dialog = {speech: [], answer: []};
					section = {tag, stages: [dialog]};
					sections.push(section);
					break;

				case "guide":
					prevType = type;
					dialog.guide = line;
					break;

				case "answer":
					prevType = type;
					line = line.replace(/\s*\|\s*/g, "|");
					// line = new RegExp(line, "i");
					dialog.answer.push(line);

					// console.log("[answer]", line);
					break;

				case "text":
					line = line.trim().replace(/\n+/g, "\n");
					if (prevType !== "text" && dialog.speech.length !== 0) {
						dialog = {speech: [], answer: []};
						section.stages.push(dialog);
					}

					prevType = type;
					dialog.speech.push(line);
					break;
			}

			return a;
		});


		return sections;
	}
});




