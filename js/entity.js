"use strict";

var app = app || {};

app.Entity = function(){

	var Entity = function(x,y){
		this.type = "entity";
		this.location = vec2.fromValues(x,y);
		this.col = '#A30233';
		this.radius = 10;
		this.hit = false;
		this.blinkDuration = 50;
		this.blinkRate = 0;
		this.health = 20;
		this.maxHealth = 20;
		this.movementSpeed = 300;
		this.damage = 2;
		//a bullet will fire every quarter second
		this.fireRate = 0.25;
		//this updates intil it reaches 0.25
		this.fireCoolDown = 0;
		this.fire = false;
		this.KEYBOARD = {
			"KEY_LEFT": 65,
			"KEY_UP": 87,
			"KEY_RIGHT": 68,
			"KEY_DOWN": 83,
			"KEY_SPACE": 32,
			"KEY_R": 82
		};

		this.level = 1;
		this.xp = 0;
		this.xpCap = 20;
	};

	var p = Entity.prototype;

	p.update = function(dt, keydown){

		this.handleKeyboardInput(dt,keydown);

		//adds to fireCoolDown
		this.fireCoolDown += 1 * dt;
		//when the entity can fire
		if(this.fireCoolDown >= this.fireRate){
			this.fire = true;
			this.fireCoolDown = 0;
		}

		//When hit
		if(this.hit){
			this.blinkRate += 1;
			if(this.health <= 0){
				app.Main.resetWorld();
			}
		}
	};

	p.render = function(ctx){
		if(this.hit){
			if(this.blinkRate >= this.blinkDuration){
				this.hit = false;
				this.blinkRate = 0;
			}
			if(this.blinkRate % 4 == 0 ){
				app.draw.circle(ctx,this.location[0],this.location[1],this.radius,'#f99');
			}else{
				app.draw.circle(ctx,this.location[0],this.location[1],this.radius,this.col);
			}

		}else{
			app.draw.circle(ctx,this.location[0],this.location[1],this.radius,this.col);
		}
	};

	p.reset = function(){
		this.location = vec2.create();
		this.velocity = vec2.create();
		this.acceleration = vec2.create();
		this.blinkRate = 0;
		this.fireRate = 0.25;
		this.fire = false;
		this.hit = false;
		this.health = 20;
	};

	p.levelUp = function(){
		this.level ++;
		this.health *= 1.075;
		this.movementSpeed *= 1.05;
		this.xpCap *= 1.3;
		this.xp = 0;
	};

	p.handleKeyboardInput = function(dt,keydown){
		if(keydown[this.KEYBOARD.KEY_LEFT]){
			this.location[0] -= dt * this.movementSpeed;
		}
		if(keydown[this.KEYBOARD.KEY_RIGHT]){
			this.location[0] += dt * this.movementSpeed;
		}
		if(keydown[this.KEYBOARD.KEY_UP]){
			this.location[1] -= dt * this.movementSpeed;
		}
		if(keydown[this.KEYBOARD.KEY_DOWN]){
			this.location[1] += dt * this.movementSpeed;
		}

		if(this.location[0] <= app.Main.worldSize[0]*(-400)-200-this.radius*2){
			this.location[0] = app.Main.worldSize[0]*(-400)-200-this.radius*2;
		}else if(this.location[0] >= app.Main.worldSize[0]*400+200+this.radius*2){
			this.location[0] = app.Main.worldSize[0]*400+200+this.radius*2;
		}
		if(this.location[1] <= app.Main.worldSize[1]*(-400)-200-this.radius*2){
			this.location[1] = app.Main.worldSize[1]*(-400)-200-this.radius*2;
		}else if(this.location[1] >= app.Main.worldSize[1]*400+200+this.radius*2){
			this.location[1] = app.Main.worldSize[1]*400+200+this.radius*2;
		}

	};

	return Entity;

}();
