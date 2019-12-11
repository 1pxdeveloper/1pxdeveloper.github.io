import path from "path";


function localResolver() {
	return {
		name: "localResolver",
		resolveId: function(importee, importer) {
			if (!importer) {
				return null;
			}

			if (importee.indexOf('./') === -1) {
				return null;
			}

			if (importee.endsWith(".js")) {
				return null;
			}

			return path.join(path.dirname(importer), importee, 'index.js');
		}
	};
}


export default {
	input: './1px.js.esm/1px.js',

	plugins: [
		localResolver()
	],

	output: {
		file: './dist/1px.js',
		format: 'iife',
	}
}