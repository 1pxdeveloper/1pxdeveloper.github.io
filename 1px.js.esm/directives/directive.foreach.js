(function() {
	const {$module} = require("./1px.module");
	const {$compile} = require("../compile");
	
	
	
	/// Default Template Directive
	$module.directive("*foreach", function() {
		
		function createRepeatNode(context, repeatNode, local) {
			const node = repeatNode.cloneNode(true);
			context = context.fork(local);
			$compile(node, context);

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
				.map(value => _.isArrayLike(value) ? value : [])
				.map(array => Array.from(array))
				.subscribe(array => {
					/// @TODO: LCS를 이용해서 같은건 유지하고, 삭제할 노드와 replace될 노드를 구분하는 로직을 짤것.
					
					/// @TODO: d == undeinfed 삭제후보, e === undefined 교체.. e에 없는거 추가...
					
					const [d, e] = _.LCS(prevArray, array);
					
					
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
						container[index].context.locals$.next(local);
						
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