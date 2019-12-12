import {_} from "./fp.js";
import {Observable, Subject, BehaviorSubject, ReplaySubject, AsyncSubject} from "./observable";
import {Context} from "./compiler/parser/parse.context.js";

import {watch$$} from "./compiler/parser/parse.watch.js";

import {$compile} from "./compiler/compile.js";

import {$module} from "./compiler/module.js";

import {WebComponent} from "./component.js";

import "./compiler/directives/directive.foreach.js"
import "./compiler/directives/directive.if.js"
import "./compiler/directives/directive.template.js"



Object.assign(window, {
	_,
	Observable,
	Subject,
	BehaviorSubject,
	ReplaySubject,
	AsyncSubject
});


window.a = {};

watch$$(window.a, "a").trace("a1").subscribe();
watch$$(window.a, "a").trace("a2").subscribe();
watch$$(window.a, "b").trace("b").subscribe();


window.watch$$ = watch$$;


window.$compile = $compile;
window.$module = $module;



