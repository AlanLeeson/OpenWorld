"use strict";

var app = app || {};

window.onload = function(){

	app.Main.init();

	window.addEventListener("keydown", function(e){
		app.Main.keydown[e.keyCode] = true;
		app.Main.handleKeyDown();
	});
	window.addEventListener("keyup", function(e){
		app.Main.keydown[e.keyCode] = false;
		app.Main.handleKeyUp();
	});

};
