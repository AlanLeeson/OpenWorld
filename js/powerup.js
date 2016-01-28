"use strict"

var app = app || {};

app.Powerup = function(){

	var Powerup = function(x,y,type,col){
		this.type = type;
		this.col = col;
		this.radius = 10;
		this.location = vec2.fromValues(x,y);
		this.remove = false;
	};

	var p = Powerup.prototype;

	p.update = function(dt){
		if(app.Main.circleCollision(this,app.Main.entity)){
			if(this.type === "health"){
				app.Main.entity.health += 5;
				if(app.Main.entity.health >= app.Main.entity.maxHealth){
					app.Main.entity.health = app.Main.entity.maxHealth;
				}
			}else if(this.type === "fireRate"){
				if(!(app.Main.entity.fireRate <= 0.05)){
					app.Main.entity.fireRate -= 0.005;
				}
			}else if(this.type === "dualShot"){
				app.Main.entity.dualShot = true;
			}
			this.remove = true;
		}
	};

	p.render = function(ctx){
		app.draw.circle(ctx,this.location[0],this.location[1],this.radius,this.col);
		//app.draw.text(ctx,this.type.charAt(0).toUpperCase(),this.location[0]-this.radius*2,this.location[1],20,this.col);
	};

	return Powerup;

}();
