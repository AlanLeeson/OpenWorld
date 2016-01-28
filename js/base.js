"use strict"

var app = app || {};

app.Base = function(){

	var Base = function(x,y,col){
		this.type = "base";
		this.col = col;
		this.enemies = [];
		this.radius = 250;
		this.renderRadius = 180;
		this.location = vec2.fromValues(x,y);
		this.remove = false;
		var ran = parseInt(Math.random() * 4 + 1);
		for(var i = 0; i < ran; i++){
			this.createCommonEnemy();
			if(parseInt(Math.random() * 10) % 10 == 0){
				this.createPowerup();
			}
			if(parseInt(Math.random() * 10) % 4 == 0){
				this.createStationaryEnemy();
			}
		}
	};

	var p = Base.prototype;

	p.update = function(dt){
		for(var i = 0; i < this.enemies.length; i++){
			this.enemies[i].update(dt);
			if(this.enemies[i].remove){
    			this.enemies.splice(i,1);
    			i -= 1;

					if(this.enemies.length <= 0){
						this.type = "tile";
						this.col = "rgba(128,128,128,0.8)";
				//		this.remove = true;
						app.Main.enemiesLeft --;
					}

    		}
		}
	};

	p.render = function(ctx,topctx){
		app.draw.rect(ctx,this.location[0]-225,this.location[1]-225,450,450,this.col);
		for(var i = 0; i < this.enemies.length; i++){
			this.enemies[i].render(topctx);
		}
	};

	p.createCommonEnemy = function(){
		//function(x,y,force,col,difficulty,radius,boundsX,boundsY,dimensions){
		var loc = this.getAdjacentLocations();
		this.enemies.push(new app.Enemy(loc[0],loc[1],0,"#5015B6",1,12,this.location[0]-225,this.location[1]-225,450));
	};
	
	p.createStationaryEnemy = function(){
		var loc = this.getAdjacentLocations();
		this.enemies.push(new app.Enemy(loc[0],loc[1],0,"#201556",2,15,this.location[0]-225,this.location[1]-225,450));
	};

	p.createBoss = function(){
		var loc = this.getAdjacentLocations();
		this.enemies.push(new app.Boss(loc[0],loc[1],0,"#000"));
	};

	p.createPowerup = function(){
		this.enemies.push(new app.Powerup(this.location[0],this.location[1],"health","rgb(255,0,0)"));
	};

	p.getAdjacentLocations = function(){
		var ran = Math.random() * this.renderRadius*2 - this.renderRadius + this.location[0];
		var ran2 = Math.random() * this.renderRadius*2 - this.renderRadius + this.location[1];
		return vec2.fromValues(ran,ran2);
	};

	p.checkInternalCollisions = function(bullet){
		for(var i = 0; i < this.enemies.length; i++){
			if(this.enemies[i].type != "powerup" && app.Main.circleCollision(this.enemies[i],bullet)){
				this.enemies[i].health -= bullet.damage;
				bullet.remove = true;
			}
		}
	};

	return Base;

}();
