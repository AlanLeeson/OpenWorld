"use strict";

var app = app || {};

app.Enemy = function(){

	//difficulty of 1 is a common enemy
	var Enemy = function(x,y,force,col,difficulty,radius,boundsX,boundsY,dimensions){
		this.type = "enemy";
		this.col = col;
		this.difficulty = difficulty;
		this.force = force;
		this.xpScore = 1;
		this.radius = radius;
		this.boundsX = boundsX;
		this.boundsY = boundsY;
		this.dimensions = dimensions;
		switch(this.difficulty){
			case 0:
				this.health = 2;
				this.fireRate = Math.random() * 2 + 3 ;
				this.fireCoolDown = Math.random() * 2 - 1;
				this.seekPoint = this.location;
			break;
			case 1:
				this.originalY = y;
				this.xMul = 1;
				this.health = 5;
				this.fireRate = Math.random() * 2 + 3 ;
				this.fireCoolDown = Math.random() * 2 - 1;
			break;
		}
		this.bullets = [];
		this.location = vec2.fromValues(x,y);
		this.velocity = vec2.create();
		this.acceleration = vec2.create();
		this.remove = false;
	};
	
	var p = Enemy.prototype;
	
	p.update = function(dt,bossLoc,enemies){
		if(this.health <= 0){
			this.remove = true;
			app.Main.entity.xp += this.xpScore;
			if(parseInt(Math.random()*5) % 5 == 0){
				app.Main.gameObjects.push(new app.Powerup(this.location[0],this.location[1],"fireRate","rgb(255,255,50)"));
			}
		}

		switch(this.difficulty){
			case 0:
				if(bossLoc && enemies){
					this.difficulty0(dt,bossLoc,enemies);
				}
			break;
			case 1:
				this.difficulty1(dt);
			break;
		}

		for(var i = 0; i < this.bullets.length; i++){
			this.bullets[i].update(dt);
			if(app.Main.circleCollision(this.bullets[i],app.Main.entity)){
				this.bullets[i].remove = true;
				app.Main.entity.hit = true;
				app.Main.entity.health --;
			}
			if(this.bullets[i].remove){
    			this.bullets.splice(i,1);
    			i -= 1;
    		}
		}

		if(this.fireCoolDown >= this.fireRate){
			this.fire = true;
			this.fireCoolDown = 0;
			var bulletDirection = app.Main.calculateBulletDirection(this.location,app.Main.entity.location,10);
			bulletDirection[0] += Math.random() * 2 - 1;
			bulletDirection[1] += Math.random() * 2 - 1;
			this.bullets.push(new app.Bullet(this.location[0],this.location[1],
				bulletDirection,"enemyBullet",this.col));
		}

		//adds to fireCoolDown 
		this.fireCoolDown += 1 * dt;
	};

	p.difficulty0 = function(dt,bossLoc,enemies){

		var perp = this.calculatePerpendicular(bossLoc);
		applyForce(seek(this.location,perp,this.velocity,5,0.9),this.acceleration);
		applyForce(seek(this.location,bossLoc,this.velocity,0.5,0.5),this.acceleration);
		applyForce(separate(this.location,this.velocity,enemies,100,10,0.9),this.acceleration);
		updateLocation(this.velocity,this.acceleration,this.location);
		//for some reason this doesn't work in the method
		this.acceleration = vec2.create();
	};

	p.difficulty1 = function(dt){
		if(this.location[0]+this.radius >= this.boundsX+this.dimensions){
			this.xMul = -1;
		}else if(this.location[0]-this.radius <= this.boundsX){
			this.xMul = 1;
		}

		this.location[0] += dt * 50 * this.xMul;
		
		this.location[1] = -Math.cos(this.location[0]/100)*50 + this.originalY;
	}

	p.calculatePerpendicular = function(loc){
		var x = this.location[0] - loc[0];
		var y = this.location[1] - loc[1];
		return vec2.fromValues(this.location[0]+y, this.location[1]-x);
	};
	
	p.render = function(ctx){
		app.draw.circle(ctx,this.location[0],this.location[1],this.health+this.radius,this.col);
		for(var i = 0; i < this.bullets.length; i++){
			this.bullets[i].render(ctx);
		}
	};

	return Enemy;

}();