"use strict"

var app = app || {};

app.Boss = function(){

	var Boss = function(x,y,force,col,difficulty){
		this.type = "boss";
		this.difficulty = difficulty;
		this.col = col;
		this.force = force;
		this.radius = 30;
		this.health = 10;
		this.dead = false;
		this.enemies = [];
		this.fireCoolDown = 0;

		this.location = vec2.fromValues(x,y);
		this.velocity = vec2.create();
		this.acceleration = vec2.create();
		this.seekPoint = this.location;
		this.newSeekPoint = 0;
		this.remove = false;

		switch(this.difficulty){
			case 0:
				this.fireRate = 0.5;
				this.maxSpeed = 10;
				this.damage = 1;
			break;
			case 1:
				this.fireRate = 0.3;
				this.maxSpeed = 2;
				for(var i = 0; i < 5; i ++){
					this.createEnemy();
				}
				this.damage = 1.2;
			break;
		}
	};

	var p = Boss.prototype;

	p.update = function(dt){
		if(!this.dead){
			if(this.health <= 0){
				this.dead = true;
				app.Main.enemiesLeft --;
				app.Main.gameObjects.push(new app.Powerup(this.location[0],this.location[1],"dualShot","rgb(255,255,50)"));
			}

			switch(this.difficulty){
				case 0:
					this.difficulty1(dt);
				break;
				case 1:
					this.difficulty2(dt);
				break;
			}

			if(this.fireCoolDown >= this.fireRate){
				this.fire = true;
				this.fireCoolDown = 0;
				var bulletDirection = app.Main.calculateBulletDirection(this.location,app.Main.entity.location,10);
				bulletDirection[0] += Math.random() * 2 - 1;
				bulletDirection[1] += Math.random() * 2 - 1;
				app.Main.enemyBullets.push(new app.Bullet(this.location[0],this.location[1],
					bulletDirection,this.damage,this.col));
			}

			//adds to fireCoolDown
			this.fireCoolDown += dt;

		//drop the loot
		}else{
			if(this.enemies.length <= 0){
				this.remove = true;
			}
		}

		for(var i = 0; i < this.enemies.length; i++){
			this.enemies[i].update(dt,this.location,this.enemies);
			if(this.enemies[i].remove){
    			this.enemies.splice(i,1);
    			i -= 1;
    		}
		}
	};

	p.render = function(ctx,topctx){
		if(!this.dead){
			app.draw.circle(topctx,this.location[0],this.location[1],this.radius,this.col);
		}
		for(var i = 0; i < this.enemies.length; i++){
			this.enemies[i].render(topctx);
		}
	};

	p.difficulty1 = function(dt){
		if(this.velocity[0] <= 0.1 && this.velocity[1] <= 0.1){
			this.seekPoint = vec2.fromValues(app.Main.entity.location[0]+(Math.random()*500-250)
				,app.Main.entity.location[1]+(Math.random()*500-250));
		}

		applyForce(arrive(this.location,this.seekPoint,this.velocity,10,0.5),this.acceleration);
		updateLocation(this.velocity,this.acceleration,this.location);
		//for some reason this doesn't work in the method
		this.acceleration = vec2.create();
	};

	p.difficulty2 = function(dt){
		this.newSeekPoint += dt;

		if(this.velocity[0] <= 0.1 && this.velocity[1] <= 0.1){
			this.seekPoint = vec2.fromValues(this.location[0]+(Math.random()*250-125)
				,this.location[1]+(Math.random()*250-125));
			this.newSeekPoint = 0;
		}

		applyForce(arrive(this.location,this.seekPoint,this.velocity,2,0.5),this.acceleration);
		updateLocation(this.velocity,this.acceleration,this.location);
		//for some reason this doesn't work in the method
		this.acceleration = vec2.create();
	};


	p.createEnemy = function(){
		this.enemies.push(new app.Enemy(this.location[0]+Math.random()*50-25,this.location[1]+Math.random()*50-25,0,"#444",0,10));
	};

	p.checkInternalCollisions = function(bullet){

		if(app.Main.circleCollision(this,bullet)){
			this.health -= bullet.damage;
			this.radius -= bullet.damage;
			bullet.remove = true;
		}

		for(var i = 0; i < this.enemies.length; i++){
			if(app.Main.circleCollision(this.enemies[i],bullet)){
				this.enemies[i].health -= bullet.damage;
				bullet.remove = true;
			}
		}
	};

	return Boss;

}();
