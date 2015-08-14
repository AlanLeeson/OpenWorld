"use strict";

var app = app || {};

app.Main = {

	canvas : undefined,
	ctx : undefined,
	topCanvas : undefined,
	topctx : undefined,
	canvasWidth : 750,
	canvasHeight : 600,
	
	//var used for finding dt
	updatedTime : 0,
	FPS : 0,
	mousePos : [],
	canvasOffset : undefined,
	offsetX : 0,
	offsetY : 0,
	paused : false,
	keydown : [],
	firing : false,
	bulletSpeed : 10,

	viewDistance : 700,
	
	entity : undefined,
	gameObjects : [],
	bullets : [],

	init : function(){
		
		//assign the canvas and the canvas context
		this.topCanvas = document.querySelector('#foreground');
		this.topctx = this.topCanvas.getContext('2d');
		this.canvas = document.querySelector('#background');
		this.ctx = this.canvas.getContext('2d');
		this.mousePos = vec2.create();
		
		this.canvasOffset = document.getElementsByTagName('canvas')[0].getBoundingClientRect();
		this.offsetX = this.canvasOffset.left;
		this.offsetY = this.canvasOffset.top;
		
		document.getElementsByTagName('canvas')[0].onmousedown = function(e){app.Main.handleMouseDown(e)};
		document.getElementsByTagName('canvas')[0].onmouseup = function(e){app.Main.handleMouseUp(e)};
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
		if(!this.paused){
    		this.update();
    	}
    	this.render(this.ctx,this.topctx);
	},
	
	//renders all objects in the game
	render : function(ctx,topctx){
		app.draw.rect(ctx,0,0,this.canvas.width,this.canvas.height,"#aaa");
		topctx.clearRect(0,0,this.canvas.width,this.canvas.height);

		ctx.save();
		topctx.save();
		ctx.translate(-this.entity.location[0] + this.canvasWidth/2,-this.entity.location[1] + this.canvasHeight/2);
		topctx.translate(-this.entity.location[0] + this.canvasWidth/2,-this.entity.location[1] + this.canvasHeight/2);
		for(var i = 0; i < this.gameObjects.length; i++){
			if(this.withinViewOfPlayer(this.gameObjects[i].location,this.entity.location))
			this.gameObjects[i].render(ctx,topctx);
		}
		for(var i = 0; i < this.bullets.length; i++){
			this.bullets[i].render(ctx);
		}

		this.entity.render(ctx);
		app.draw.circle(ctx,this.mousePos[0],this.mousePos[1],5,"#c00");
		ctx.restore(); 
		topctx.restore();
		if(this.paused){
			this.renderPause(topctx);
		}
		else{
			this.renderUI(topctx);
		}
		//app.draw.text(topctx,parseInt(this.FPS),30,30,30,'#000');
	},
	
	//updates the objects in the game
	update : function(){
		//find deltaTime
		var dt  = this.calculateDeltaTime();
		//update the player
		this.entity.update(dt,this.keydown);

		//update the game objects
		for(var i = 0; i < this.gameObjects.length; i++){
			if(this.withinViewOfPlayer(this.gameObjects[i].location,this.entity.location)){
				this.gameObjects[i].update(dt);
				if(this.gameObjects[i].type == "base" || this.gameObjects[i].type == "boss"){
					for(var j = 0; j < this.bullets.length; j++){
						if(this.gameObjects[i].type == "base" ){
							if(this.circleCollision(this.bullets[j],this.gameObjects[i])){
								this.gameObjects[i].checkInternalCollisions(this.bullets[j])
							}
						}
						else if(this.gameObjects[i].type == "boss"){
							this.gameObjects[i].checkInternalCollisions(this.bullets[j])
						}
					}
				}

				if(this.gameObjects[i].remove){
	    			this.gameObjects.splice(i,1);
	    			i -= 1;
	    		}
    		}
		}

		for(var i = 0; i < this.bullets.length; i++){
			this.bullets[i].update(dt);
			if(this.bullets[i].remove){
    			this.bullets.splice(i,1);
    			i -= 1;
    		}
		}

		//when the player is holding down the click button
		if(this.firing && this.entity.fire){
			this.bullets.push(new app.Bullet(this.entity.location[0],this.entity.location[1],
    			this.calculateBulletDirection(this.entity.location,this.mousePos,10),"entityBullet","#7E0058"));
    		this.entity.fire = false;
    	}
	},

	withinViewOfPlayer : function(loc1,loc2){
		var dx = loc1[0] - loc2[0];
		var dy = loc1[1] - loc2[1];
		var distance = Math.sqrt(dx*dx + dy*dy);
		return distance < this.viewDistance;
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
		for(var i = -20; i < 20; i++){
			for(var j = -20; j < 20; j++){
				if(parseInt(Math.random()*3) % 3 == 0 && 
				  (i != 0 && j != 0)){
					this.createBase(i*400,j*400);

					if(parseInt(Math.random() * 6)%6 == 0 && (i > 2 || i < -2) && (j > 2 || j < -2)){
						this.createBoss(i*400,j*400,parseInt(Math.random()*2));
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
		//this.firing = false;
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
			this.paused = !this.paused;
		}
		if(this.keydown[32]){
			this.firing = true;
		}
	},

	handleKeyUp : function(){
		//if(!this.keydown[32]){
		//	this.firing = false;
		//}
	},

	renderUI : function(ctx){
		//represents health
		app.draw.rect(ctx,0,this.canvasHeight-30,this.entity.health*15,20,"rgba(200,50,0,0.7)");
		//represents firerate
		//text: function(ctx,string,x,y,size,col){
		app.draw.text(ctx,"Fire Rate " + this.entity.fireRate + "%",0,this.canvasHeight-40,15,"rgba(20,20,20,0.8)");
		//app.draw.rect(ctx,0,440,this.entity.fireRate*150,20,"rgba(20,20,20,0.8)");
		app.draw.text(ctx,"Level " + this.entity.level,this.canvasWidth/2-25,20,20,"#000");
		app.draw.rect(ctx,100,50,this.canvasWidth-200,20,"rgba(50,50,50,0.5)");
		app.draw.rect(ctx,100,50,(this.canvasWidth-200)*(this.entity.xp/this.entity.xpCap),20,"rgb(120,80,0)");
	},

	renderPause : function(ctx){
		app.draw.rect(ctx,0,0,this.canvasWidth,this.canvasHeight,"rgba(80,80,80,0.5)");
		app.draw.text(ctx,"PAUSED",this.canvasWidth/4 + 30,this.canvasHeight/2,75,"#fff");
		app.draw.text(ctx,"Use W A S D to move.",this.canvasWidth/4 + 60,this.canvasHeight/2+50,25,"#ddd");
		app.draw.text(ctx,"Press '_' to fire continuously.",this.canvasWidth/4 + 10,this.canvasHeight/2+90,25,"#ddd");	
		app.draw.text(ctx,"Aim bullets with the mouse.",this.canvasWidth/4 + 20,this.canvasHeight/2+130,25,"#ddd");	
	}

};

window.addEventListener("keydown", function(e){
	app.Main.keydown[e.keyCode] = true;
	app.Main.handleKeyDown();
});
window.addEventListener("keyup", function(e){
	app.Main.keydown[e.keyCode] = false;
	app.Main.handleKeyUp();
});
