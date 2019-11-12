(function() {
	const {$module} = require("./1px.module");
	const {$compile} = require("./compile");

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
		let s4 = Array(i).fill(null);
		let s5 = Array(j).fill(null);

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


	/// Default Template Directive
	$module.directive("*foreach", function() {

		function createRepeatNode(context, repeatNode, local) {
			context = context.fork(local);

			const node = repeatNode.cloneNode(true);


			/// @FIXME:..
			Promise.resolve().then(() => {
				$compile(node, context);
			});

			return {node, context, local};
		}

		return function(context, el, _script) {
			/// Parse [script] as [ROW], [INDEX]
			const [script, ROW, INDEX] = _.go(
				_script,
				_.rpartition(" as "),
				_.spread((script, sep, rest) => ([script, ...rest.split(",", 2)])),
				_.map(_.trim)
			);

			/// Prepare Placeholder
			const repeatNode = el.cloneNode(true);
			repeatNode.removeAttribute("*foreach");

			const placeholder = document.createComment("foreach: " + _script);
			const placeholderEnd = document.createComment("endforeach");
			el.before(placeholder);
			el.replaceWith(placeholderEnd);


			////
			let container = [];
			let prevArray = [];


			context(script)
				.filter(_.isArrayLike)
				.map(array => Array.from(array))
				.subscribe(array => {

					/// @TODO: LCS를 이용해서 같은건 유지하고, 삭제할 노드와 replace될 노드를 구분하는 로직을 짤것.

					/// @TODO: d == undeinfed 삭제후보, e === undefined 교체.. e에 없는거 추가...

					const [d, e] = LCS(prevArray, array);


					let removed = [];
					let nochanged = [];
					let placeholder = placeholderEnd;

					prevArray.forEach((value, index) => {
						(d[index] === null ? removed : nochanged).push(container[index]);
					});
					nochanged.push({node: placeholderEnd});
					placeholder = nochanged[0].node;

					container = array.map((value, index) => {
						/// 변화없음.
						if (e[index] !== null) {
							const r = nochanged.shift();
							placeholder = nochanged[0].node;
							return r;

						}

						const local = Object.create(null);
						ROW && (local[ROW] = value);
						INDEX && (local[INDEX] = index);


						/// 추가
						if (!container[index] || removed.length === 0) {
							const r = createRepeatNode(context, repeatNode, local);
							placeholder.before(r.node);
							return r;

						}

						/// 교체

						/// @FIXME: next 호출이 좀 이상하네.. pure하게 assign하는 방법을 강구하자.
						Object.assign(container[index].context.scope$.value, local);
						container[index].context.scope$.next(container[index].context.scope$.value);

						removed = removed.filter(x => x !== container[index]);

						return container[index];
					});

					/// 삭제
					removed.forEach(r => r.node.remove());


					prevArray = array.slice();
				});

			console.groupEnd();

			return false;
		}
	});

})();