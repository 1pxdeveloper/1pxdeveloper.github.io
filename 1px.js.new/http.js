$module.factory("http", function() {
	
	function Callable(f) {
		return Object.setPrototypeOf(f, new.target.prototype);
	}
	
	Callable.prototype = Function.prototype;
	
	
	let timerId = 0;
	
	class HttpService extends Callable {
		constructor(init = {}, http) {
			super(body => {
				const _body = body;
				
				const url = this.init.url;
				let init = this.init;
				
				if (body) {
					body = init.body ? init.body(body) : body;
					init = {...this.init, body};
				}
				
				// if (typeof init.preScript === "function") {
				// 	init = {...init, ...init.preScript(init)};
				// }
				
				const response = init.response || ((v) => v);
				
				return new Observable(observer => {
					console.group(init.method, url);
					console.log("Request", _body);
					console.time("Time" + (++timerId));
					console.groupEnd();
					
					return Observable.fromAsync(fetch(url, init).then(response))
						.tap(res => console.group("Response", init.method, url))
						.tap(_.log("Response"))
						.tap(() => console.timeEnd("Time" + (timerId--)))
						.finalize(() => {
							console.groupEnd();
						})
						.subscribe(observer);
				});
			});
			
			this.init = http ? {...http.init, ...init} : {...init};
		}
		
		/// Request
		resource = (data) => new HttpService(data, this);
		
		/// Request
		url = (url) => this.resource({url});
		headers = (headers) => this.resource({headers});
		method = (method, url = this.init.url) => this.resource({method, url});
		body = (body) => this.resource({body});
		
		GET = (url) => this.method("GET", url);
		POST = (url) => this.method("POST", url);
		PUT = (url) => this.method("PUT", url);
		DELETE = (url) => this.method("DELETE", url);
		PATCH = (url) => this.method("PATCH", url);
		HEAD = (url) => this.method("HEAD", url);
		OPTION = (url) => this.method("OPTION", url);
		
		
		/// Request
		preScript(preScript) {
			return this.resource({preScript});
		}
		
		body(body) {
			return this.resource({body});
		}
		
		/// Response
		response(response) {
			return this.resource({response});
		}
	}
	
	return new HttpService();
});