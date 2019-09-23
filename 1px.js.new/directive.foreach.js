(function() {
	const {$module} = require("./1px.module");
	const {$compile} = require("./compile");


	/// Default Template Directive
	$module.directive("*foreach", function() {

		function LCS(s1, s2) {
			s1 = s1 || [];
			s2 = s2 || [];

			let M = [];
			for (let i = 0; i <= s1.length; i++) {
				M.push([]);

				for (let j = 0; j <= s2.length; j++) {
					let currValue = 0;
					if (i === 0 || j === 0) {
						currValue = 0;
					}
					else if (s1[i - 1] === s2[j - 1]) {
						currValue = M[i - 1][j - 1] + 1;
					}
					else {
						currValue = Math.max(M[i][j - 1], M[i - 1][j]);
					}

					M[i].push(currValue);
				}
			}

			let i = s1.length;
			let j = s2.length;

			// let s3 = [];
			let s4 = [];
			let s5 = [];

			while (M[i][j] > 0) {
				if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
					// s3.unshift(s1[i - 1]);

					s4[i - 1] = s1[i - 1];
					s5[j - 1] = s1[i - 1];

					i--;
					j--;
				}
				else if (M[i - 1][j] > M[i][j - 1]) {
					i--;
				}
				else {
					j--;
				}
			}

			return [s4, s5];
		}

		/// @FIXME: 고급스럽게 전환하기
		function createRepeatNode(repeatNode, context, local) {
			let node = repeatNode.cloneNode(true);
			context = context.fork(local);
			$compile(node, context);

			return {node, context, local}
		}

		return function(context, el, script) {

			/// Prepare Placeholder
			let placeholder = document.createComment("foreach: " + script);
			let placeholderEnd = document.createComment("endforeach");
			let repeatNode = el.cloneNode(true);
			repeatNode.removeAttribute("*foreach");

			el.before(placeholder);
			el.replaceWith(placeholderEnd);


			////
			let container = [];
			let prevArray = [];

			context.watch$(script, array => {

				let locals = array.slice();

				/// @FIXME: 고급스럽게 전환하기
				array = array.map(v => v["@@entries"][0]);


				/// LCS 알고리즘을 통해 삭제할 노드와 남길 노드를 분리한다.
				let [d, e] = LCS(prevArray, array);

				let fixed_container = [];
				let values_for_reuse = [];

				prevArray.forEach((value, index) => {
					if (d[index] === undefined) {
						values_for_reuse[index] = value;
						container[index].context.disconnect();
						container[index].node.remove();
					}
					else {
						fixed_container.push(container[index]);
					}
				});
				fixed_container.push({node: placeholderEnd});


				/// 변경되지 않는 노드를 중심으로 새로운 노드들을 추가/재배치 한다.
				let placeholder_index = 0;
				let placeholder = fixed_container[placeholder_index].node;

				container = array.map((value, index) => {
					if (e[index] === undefined) {
						let idx = values_for_reuse.indexOf(value);
						let r = container[idx];
						if (r) {
							placeholder.before(r.node);
							delete container[idx];
						}
						else {
							r = createRepeatNode(repeatNode, context, locals[index]);
							placeholder.before(r.node);

							/// @FIXME...
							if (r.node.hasAttribute("css-transition")) {
								requestAnimationFrame(function() {
									requestAnimationFrame(function() {
										let enter = r.node.getAttribute("css-transition") || "transition";
										r.node.classList.add(enter + "-enter");
									});
								});
							}
						}

						return r;
					}

					let r = fixed_container[placeholder_index];
					placeholder = fixed_container[++placeholder_index].node;
					return r;
				});

				prevArray = array.slice();
			});
		}
	});

})();