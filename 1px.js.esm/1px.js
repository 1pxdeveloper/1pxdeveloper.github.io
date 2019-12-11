import {Observable} from "./observable";
import {Context} from "./compiler/parse/parse.context.js";

import {watch$$} from "./compiler/parse/parse.watch.js";

window.Observable = Observable;
window.Context = Context;




window.a = {};

watch$$(window.a, "a").trace("a1").subscribe();
watch$$(window.a, "a").trace("a2").subscribe();
watch$$(window.a, "b").trace("b").subscribe();



window.watch$$ = watch$$;



console.log(window);





