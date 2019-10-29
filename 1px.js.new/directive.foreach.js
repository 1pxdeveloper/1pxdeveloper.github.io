(function() {
	const {$module} = require("./1px.module");
	const {$compile} = require("./compile");
	
	window.LCS = LCS;
	
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
		
		while(M[i][j] > 0) {
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
		
		function createRepeatNode(context, repeatNode, value, index, ROW, INDEX) {
			const local = Object.create(null);
			ROW && (local[ROW] = value);
			INDEX && (local[INDEX] = index);
			
			context = context.fork(local);
			
			const node = repeatNode.cloneNode(true);
			$compile(node, context);
			return {node, context, local};
		}
		
		return function(context, el, _script) {
			console.group("*foreach", context, el, _script);
			
			
			/// Parse [script] as [ROW], [INDEX]
			const [script, ROW, INDEX] = _.go(_script,
				_.rpartition(" as "),
				_.spread((script, sep, rest) => ([script, ...rest.split(",", 2)])),
				_.map(_.trim)
			);
			console.log("[script, ROW, INDEX]", script, ROW, INDEX);
			
			
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
				.trace(_script)
				.map(array => Array.from(array))
				.subscribe(array => {
					
					
					const [d, e] = LCS(prevArray, array);
					
					/// @TODO: LCS를 이용해서 같은건 유지하고, 삭제할 노드와 replace될 노드를 구분하는 로직을 짤것.
					
					/// @TODO: d == undeinfed 삭제후보, e === undefined 교체.. e에 없는거 추가...
					

					container = array.map((value, index) => {
						
						if (container[index]) {
							
							/// @FIXME: 이거 이제 중복됨. 아래에서 빼와야 함.
							const local = Object.create(null);
							ROW && (local[ROW] = value);
							INDEX && (local[INDEX] = index);
							
							// console.log()
							
							/// @FIXME: next 호출이 좀 이상하네.. pure하게 assign하는 방법을 강구하자.
							Object.assign(container[index].context.scope$.value, local);
							container[index].context.scope$.next(container[index].context.scope$.value);
							
							return container[index];
						}
						
						const r = createRepeatNode(context, repeatNode, value, index, ROW, INDEX);
						placeholder.before(r.node);
						
						return r;
					});
					
					
					// /// LCS 알고리즘을 통해 삭제할 노드와 남길 노드를 분리한다.
					// let [d, e] = LCS(prevArray, array);
					//
					// let fixed_container = [];
					// let values_for_reuse = [];
					//
					// prevArray.forEach((value, index) => {
					// 	if (d[index] === undefined) {
					// 		values_for_reuse[index] = value;
					// 		container[index].context.disconnect();
					// 		container[index].node.remove();
					// 	}
					// 	else {
					// 		fixed_container.push(container[index]);
					// 	}
					// });
					// fixed_container.push({node: placeholderEnd});
					//
					//
					// /// 변경되지 않는 노드를 중심으로 새로운 노드들을 추가/재배치 한다.
					// let placeholder_index = 0;
					// let placeholder = fixed_container[placeholder_index].node;
					//
					// container = array.map((value, index) => {
					// 	if (e[index] === undefined) {
					// 		let idx = values_for_reuse.indexOf(value);
					// 		let r = container[idx];
					// 		if (r) {
					// 			placeholder.before(r.node);
					// 			delete container[idx];
					// 		}
					// 		else {
					// 			r = createRepeatNode(context, repeatNode, value, index, ROW, INDEX);
					// 			placeholder.before(r.node);
					//
					// 			/// @FIXME...
					// 			if (r.node.hasAttribute("css-transition")) {
					// 				requestAnimationFrame(function() {
					// 					requestAnimationFrame(function() {
					// 						let enter = r.node.getAttribute("css-transition") || "transition";
					// 						r.node.classList.add(enter + "-enter");
					// 					});
					// 				});
					// 			}
					// 		}
					//
					// 		return r;
					// 	}
					//
					// 	let r = fixed_container[placeholder_index];
					// 	placeholder = fixed_container[++placeholder_index].node;
					// 	return r;
					// });
					
					prevArray = array.slice();
				});
			
			console.groupEnd();
			
			return false;
		}
	});
	
})();