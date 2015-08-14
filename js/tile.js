"use strict"

var app = app || {};

app.Tile = function(){

	var Tile = function(x,y,col){
		this.type = "tile";
		this.col = col;
		this.radius = 200;
		this.location = vec2.fromValues(x,y);
		this.remove = false;
	};
	
	var p = Tile.prototype;
	
	p.update = function(dt){
	
	};

	p.render = function(ctx){
		app.draw.rect(ctx,this.location[0]-225,this.location[1]-225,450,450,this.col);
	};

	p.checkInternalCollisions = function(bullet){
	}

	return Tile;

}();