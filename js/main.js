"use strict";

var app = app || {};

app.Main = {

	canvas : undefined,
	ctx : undefined,
	topCanvas : undefined,
	topctx : undefined,
	canvasWidth : 750,
	canvasHeight : 600,

	GAME_STATE_MENU : 0,
	GAME_STATE_PAUSED : 1,
	GAME_STATE_TUTORIAL : 2,
	GAME_STATE_PLAY : 3,
	GAME_STATE_NEXT_ROUND : 4,

	gameState : 0,

	//var used for finding dt
	updatedTime : 0,
	FPS : 0,
	mousePos : [],
	canvasOffset : undefined,
	offsetX : 0,
	offsetY : 0,
	keydown : [],
	firing : false,

	viewDistance : 700,

	entity : undefined,
	gameObjects : [],
	bullets : [],
	enemyBullets : [],
	worldSize : undefined,
	enemiesLeft : 0,

	init : function(){

		//assign the canvas and the canvas context
		this.topCanvas = document.querySelector('#foreground');
		this.topctx = this.topCanvas.getContext('2d');
		this.canvas = document.querySelector('#background');
		this.ctx = this.canvas.getContext('2d');
		this.mousePos = vec2.create();
		this.worldSize = vec2.fromValues(1,1);

		this.canvasOffset = document.getElementsByTagName('canvas')[0].getBoundingClientRect();
		this.offsetX = this.canvasOffset.left;
		this.offsetY = this.canvasOffset.top;

		//document.getElementsByTagName('canvas')[0].onmousedown = function(e){app.Main.handleMouseDown(e)};
		//document.getElementsByTagName('canvas')[0].onmouseup = function(e){app.Main.handleMouseUp(e)};
		document.getElementsByTagName('canvas')[0].onmousemove = function(e){app.Main.handleMouseMove(e)};

		this.entity = new app.Entity(0,0);

		this.createWorld();

		//call the game loop to start the game
		this.gameLoop();
	},

	//loops the game
	gameLoop : function(){
		//calls this method every frame
		requestAnimationFrame(this.gameLoop.bind(this));
		if(!this.gameState !== this.GAME_STATE_PAUSED){
    	this.update();
    }
    this.render(this.ctx,this.topctx);
	},

	//renders all objects in the game
	render : function(ctx,topctx){

		app.draw.rect(ctx,0,0,this.canvas.width,this.canvas.height,"#aaa");
		topctx.clearRect(0,0,this.canvas.width,this.canvas.height);

		//save the context
		ctx.save();
		topctx.save();

		switch(this.gameState){
			case this.GAME_STATE_MENU:
				this.renderMenu(topctx);
			break;
			case this.GAME_STATE_NEXT_ROUND:
				this.renderNextRound(topctx);
			break;
			case this.GAME_STATE_PAUSED:
			case this.GAME_STATE_PLAY:
				//translate the screens
				ctx.translate(-this.entity.location[0] + this.canvasWidth/2,-this.entity.location[1]
					+ this.canvasHeight/2);
				topctx.translate(-this.entity.location[0] + this.canvasWidth/2,-this.entity.location[1]
					 + this.canvasHeight/2);
				//loop through the game objects
				for(var i = 0; i < this.gameObjects.length; i++){
					if(this.withinViewOfPlayer(this.gameObjects[i].location,this.entity.location))
					this.gameObjects[i].render(ctx,topctx);
				}

				//loop through players bullets
				for(var i = 0; i < this.bullets.length; i++){
					this.bullets[i].render(ctx);
				}

				//loop through enemy bullets
				for(var i = 0; i < this.enemyBullets.length; i++){
					this.enemyBullets[i].render(ctx);
				}

				//render the entity
				this.entity.render(ctx);
				app.draw.circle(ctx,this.mousePos[0],this.mousePos[1],5,"#c00");

				//restore the context
				ctx.restore();
				topctx.restore();

				this.renderUI(topctx);
				if(this.gameState === this.GAME_STATE_PAUSED){
					this.renderPause(topctx);
				}
			break;
		}
	},

	//updates the objects in the game
	update : function(){

		switch(this.gameState){
			case this.GAME_STATE_MENU:
			break;
			case this.GAME_STATE_NEXT_ROUND:
			break;
			case this.GAME_STATE_PAUSED:
			break;
			case this.GAME_STATE_PLAY:
				this.checkEndLevel();
				//find deltaTime
				var dt  = this.calculateDeltaTime();
				//update the player
				this.entity.update(dt,this.keydown);

				//update the game objects
				this.updateGameObjects(dt);

				//loop through all the enemyBullets on screen
				this.updateEnemyBullets(dt);

				//go through the bullets and move them
				for(var i = 0; i < this.bullets.length; i++){
					this.bullets[i].update(dt);
					if(this.bullets[i].remove){
		    			this.bullets.splice(i,1);
		    			i -= 1;
		    		}
				}

				//when the player is holding down the click button
				if(this.firing && this.entity.fire){
					this.createEntityBullets();
		    }
			break;
		}
	},

	updateGameObjects : function(dt){
		for(var i = 0; i < this.gameObjects.length; i++){
			//check to see if the gameobject is in view
			if(this.withinViewOfPlayer(this.gameObjects[i].location,this.entity.location)){
				this.gameObjects[i].update(dt);
				//checks if the object is a base or a boss
				if(this.gameObjects[i].type == "base" || this.gameObjects[i].type == "boss"){
					//loop through the player bullets to check collisions
					for(var j = 0; j < this.bullets.length; j++){
						//if the object is a base
						if(this.gameObjects[i].type == "base" ){
							//checks if the bullets land inside the square
							if(this.circleCollision(this.bullets[j],this.gameObjects[i])){
								//if so, check if the bullets hit any enemies
								this.gameObjects[i].checkInternalCollisions(this.bullets[j])
							}
						}//end of if base
						//if object is a boss
						else if(this.gameObjects[i].type == "boss"){
							//checks if the bullets hit the boss
							this.gameObjects[i].checkInternalCollisions(this.bullets[j])
						}//end of elseif
					}//end of for through bullets
				}//end of if base or boss

				//if those objects are ready are dead, remove them
				if(this.gameObjects[i].remove){
	    			this.gameObjects.splice(i,1);
	    			i -= 1;
	    	}//end of if
  		}//end of if within view
		}//end of loop
	},

	updateEnemyBullets : function(dt){
		for(var i = 0; i < this.enemyBullets.length; i++){
			this.enemyBullets[i].update(dt);
			if(this.circleCollision(this.enemyBullets[i],this.entity)){
				this.playerHit(this.enemyBullets[i]);
			}
			if(this.enemyBullets[i].remove){
					this.enemyBullets.splice(i,1);
					i -= 1;
			}
		}
	},

	playerHit : function(bullet){
		bullet.remove = true;
		this.entity.hit = true;
		this.entity.health -= bullet.damage;
	},

	withinViewOfPlayer : function(loc1,loc2){
		var dx = loc1[0] - loc2[0];
		var dy = loc1[1] - loc2[1];
		var distance = Math.sqrt(dx*dx + dy*dy);
		return distance < this.viewDistance;
	},

	checkEndLevel : function(){
		if(this.enemiesLeft <= 0){
			this.worldSize[0] ++;
			this.worldSize[1] ++;
			this.resetWorld();
			this.gameState = this.GAME_STATE_NEXT_ROUND;
		}
	},

	//calculates the velocity for a bullet
	/* @param x1 - the x position of first point
	 * @param x2 - the y position of first point
	 * @param loc2 - the location of second point
	*/
	calculateBulletDirection : function(loc1,loc2,bulletSpeed){
		//calculate the distance by finding the difference in x and y
		var distance = vec2.fromValues(loc2[0]-loc1[0],
			loc2[1]-loc1[1]);
		//normalize the line
		vec2.normalize(distance,distance);
		//scale the line by a specific amount
		vec2.scale(distance,distance,bulletSpeed);
		//return the vector
		return distance;
	},

	createEntityBullets : function(){
		var bulletVec = this.calculateBulletDirection(this.entity.location,this.mousePos,10)
		this.bullets.push(new app.Bullet(this.entity.location[0],this.entity.location[1],
				bulletVec,this.entity.damage,"#7E0058"));
			this.entity.fire = false;
		if(this.entity.dualShot){
			this.bullets.push(new app.Bullet(this.entity.location[0],this.entity.location[1],
					vec2.fromValues(-bulletVec[0],-bulletVec[1]),this.entity.damage,"#7E0058"));
		}
	},

	calculateDeltaTime : function(){
		var now, fps;
		now = (+new Date);
		fps = 1000/(now - this.updatedTime);
		fps = this.clamp(fps,12,60);
		this.FPS = fps;
		this.updatedTime = now;
		return 1/fps;
	},

	createWorld : function(){
		for(var i = -this.worldSize[0]; i <= this.worldSize[0]; i++){
			for(var j = -this.worldSize[1]; j <= this.worldSize[1]; j++){
				if(parseInt(Math.random()*3) % 3 == 0 &&
				  (i != 0 || j != 0)){
					this.createBase(i*400,j*400);
					this.enemiesLeft ++;
					if(parseInt(Math.random() * 5)%5 == 0 && (i > 2 || i < -2) && (j > 2 || j < -2)){
						this.createBoss(i*400,j*400,parseInt(Math.random()*2));
						this.enemiesLeft ++;
					}
				}
				else{
					this.createTile(i*400,j*400);
				}
			}
		}
		//this.createBoss(0,0,1);
	},

	deleteWorld : function(){
		this.gameObjects = [];
		this.bullets = [];
		this.mousePos = [];
	},

	resetWorld : function(){
		this.deleteWorld();
		this.createWorld();
		this.entity.reset();
	},

	createBase : function(x,y){
		this.gameObjects.push(new app.Base(x,y,"Rgba(2, 125, 72,0.5)"));
	},

	createBoss : function(x,y,difficulty){
		this.gameObjects.push(new app.Boss(x,y,0,"#000",difficulty));
	},

	createTile : function(x,y){
		this.gameObjects.push(new app.Tile(x,y,"rgba(74, 162, 2,0.8)"));
	},

	circleCollision : function(circle1,circle2){
		var dx = circle1.location[0] - circle2.location[0];
		var dy = circle1.location[1] - circle2.location[1];
		var distance = Math.sqrt(dx*dx + dy*dy);
		return distance < circle1.radius + circle2.radius;
	},

	clamp : function(val,min,max){
		return Math.max(min,Math.min(max,val));
	},

	handleMouseDown : function(e){
		this.firing = true;
    	this.mousePos[0] = parseInt(e.clientX-this.offsetX + this.entity.location[0] - this.canvasWidth/2);
    	this.mousePos[1] = parseInt(e.clientY-this.offsetY + this.entity.location[1] - this.canvasHeight/2);
	},

	handleMouseUp : function(e){
		this.firing = false;
		this.entity.fire = false;
		this.entity.fireCoolDown = 0;
	},

	handleMouseMove : function(e){
		if(this.firing){
    		this.mousePos[0] = parseInt(e.clientX-this.offsetX + this.entity.location[0] - this.canvasWidth/2);
    		this.mousePos[1] = parseInt(e.clientY-this.offsetY + this.entity.location[1] - this.canvasHeight/2);
    	}
	},

	handleKeyDown : function(){
		if(this.keydown[82]){
			if(this.gameState === this.GAME_STATE_PAUSED){
				this.gameState = this.GAME_STATE_PLAY;
			}else{
				this.gameState = this.GAME_STATE_PAUSED;
			}
		}
		if(this.keydown[32]){
			if(this.gameState === this.GAME_STATE_MENU || 
			  this.gameState === this.GAME_STATE_NEXT_ROUND){
				this.gameState = this.GAME_STATE_PLAY;
				this.firing = true;
			}
		}
	},

	handleKeyUp : function(){
		//if(!this.keydown[32]){
		//	this.firing = false;
		//}
	},

	renderUI : function(ctx){
		//represents health
		//app.draw.rect(ctx,100,this.canvasHeight-20,(this.canvasWidth-200)*(this.entity.maxHealth/this.entity.health),20,"rgba(200,50,0,0.7)");
		//text: function(ctx,string,x,y,size,col){
		app.draw.text(ctx,this.entity.health + "/" + this.entity.maxHealth,40,74,13,"rgba(20,20,20,0.8)");
		app.draw.text(ctx,this.enemiesLeft,40,100,13,"rgba(20,20,20,0.8)");
		app.draw.rect(ctx,100,65,this.canvasWidth-200,10,"rgba(50,50,50,0.5)");
		app.draw.rect(ctx,100,65,(this.canvasWidth-200)*(this.entity.health/this.entity.maxHealth),10,"rgba(200,50,0,0.7)");
		//represents firerate
		//app.draw.rect(ctx,0,440,this.entity.fireRate*150,20,"rgba(20,20,20,0.8)");
		app.draw.text(ctx,"Level " + this.entity.level,this.canvasWidth/2-35,28,25,"#000");
		app.draw.rect(ctx,100,40,this.canvasWidth-200,20,"rgba(50,50,50,0.5)");
		app.draw.rect(ctx,100,40,(this.canvasWidth-200)*(this.entity.xp/this.entity.xpCap),20,"rgb(120,120,0)");
	},

	renderPause : function(ctx){
		app.draw.rect(ctx,0,0,this.canvasWidth,this.canvasHeight,"rgba(80,80,80,0.5)");
		app.draw.text(ctx,"PAUSED",this.canvasWidth/4 + 30,this.canvasHeight/2-50,75,"#fff");
		app.draw.text(ctx,"Use W A S D to move.",this.canvasWidth/4 + 60,this.canvasHeight/2,25,"#ddd");
		app.draw.text(ctx,"Press '_' to fire continuously.",this.canvasWidth/4 + 10,this.canvasHeight/2+40,25,"#ddd");
		app.draw.text(ctx,"Aim bullets with the mouse.",this.canvasWidth/4 + 20,this.canvasHeight/2+80,25,"#ddd");

		//text: function(ctx,string,x,y,size,col){
		app.draw.text(ctx,"* Fire Rate: " + 1/this.entity.fireRate,200,this.canvasHeight-150,20,"rgb(20,20,20)");
		app.draw.text(ctx,"* Movement Speed: " + this.entity.movementSpeed/300, 200,this.canvasHeight-120,20,"rgb(20,20,20)");
	},
	
	renderMenu : function(ctx){
		app.draw.rect(ctx,0,0,this.canvasWidth,this.canvasHeight,"rgba(2, 125, 72, 0.5)");
		app.draw.text(ctx,"Welcome to the Game!",30,this.canvasHeight/4-50,60,"#fff");
		app.draw.text(ctx,"Press Space-Bar to start.",this.canvasWidth/4 + 30,this.canvasHeight/2,25,"#ddd");
	},
	
	renderNextRound : function(ctx){
		app.draw.rect(ctx,0,0,this.canvasWidth,this.canvasHeight,"rgba(2, 125, 72, 0.5)");
		app.draw.text(ctx,"Cleared The Screen!",65,this.canvasHeight/4-50,60,"#fff");
		app.draw.text(ctx,"Press Space-Bar to continue.",this.canvasWidth/4,this.canvasHeight/2,25,"#ddd");
	}

};
