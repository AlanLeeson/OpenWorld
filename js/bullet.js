"use strict";

var app = app || {};

app.Bullet = function(){

	var Bullet = function(x,y,speed,damage,col){
		this.type = "bullet";
		this.damage = damage;
		this.col = col;
		this.radius = 3;
		this.location = vec2.fromValues(x,y);
		this.velocity = speed;
		this.acceleration = vec2.create();
		this.lifespan = 0;
		this.remove = false;
	};

	var p = Bullet.prototype;

	p.update = function(dt){
		//applyForce(this.force,this.acceleration);
		updateLocation(this.velocity,this.acceleration,this.location);
		this.lifespan += 1 * dt;
		if(this.lifespan > 3){
			this.remove = true;
			this.lifespan = 0;
		}
	};

	p.render = function(ctx){
		app.draw.circle(ctx,this.location[0],this.location[1],this.radius,this.col);
	};

	return Bullet;

}();
