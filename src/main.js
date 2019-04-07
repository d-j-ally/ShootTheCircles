var canvas;
var ctx;

var midX;
var midY;

var mouseX;
var mouseY;

const playerSpeed = 0.8;
const playerSize = 20;
const bulletSpeed = 10;
const bulletXSize = 1;
const bulletYSize = 5;
const enemySpeed = 1;
const enemySize = 15;
const turretFR = 2;
const turretAccuracy = 0.95;
const turretSize = 20;
const moneySize = 5;

const finalFrames = 25;

var currentFinalFrames = 0;
var lengthOfGametick = 1;
var currentTime = 0;
var currentScore = 0;
var currentMoney = 0;
var currentSpawnRate = 0.01;

var player;
var objects = [];

var bullets = [];
objects.push(bullets);

var enemies = [];
objects.push(enemies);

var turrets = [];
objects.push(turrets);

var moneys = [];
objects.push(moneys);

var wastedImg = new Image();

var gameOver = false
var gameActive = true;

function init() {
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    midX = canvas.width/2;
    midY = canvas.height/2;
    
    player = new Player();

    canvas.addEventListener("mousemove", moveMouse, false);
    canvas.addEventListener("mousedown", player.shootBullet, false);
    document.addEventListener("keydown", keyPress, false);
    document.addEventListener("keyup", keyUp, false);

    wastedImg.src = "assets/wasted.png";
    
    window.setInterval(() => {
        if (currentTime >= lengthOfGametick) {
            if (gameActive && currentFinalFrames < finalFrames) {
                update();
                draw();
            } 
            if (gameOver) {
                displayGameOver();
                currentFinalFrames++;
                lengthOfGametick *= 1.05;
            }
            currentTime = 0;
        } else {
            currentTime++;
        }
    }, 2);
}

function draw() {
    drawBack();
    player.draw();
    drawObjects();
    displayStats();
}

function update() {
    player.update();
    updateObjects();
    spawnEnemies();
    // console.log({moneys});
    // console.log({currentSpawnRate});
}

/* Put other non core stuff down here */

function drawObjects() {
    objects.forEach(collection => {
        collection.forEach(element => {
            element.draw();
        });
    })
}

function updateObjects() {  
    for (var i = 0; i < objects.length; i++) {
        objects[i].forEach((element, index) => {
            element.update();
            if (!objects[i][index].active){
                objects[i].splice(index, 1);
            }
        });    
    }
}

function moveMouse(event) {
    mouseX = event.pageX - canvas.offsetLeft;
    mouseY = event.pageY - canvas.offsetTop;
}

function keyPress(event) {
    if (event.key === "t") {
        spawnTurret(mouseX, mouseY);
    }

    if (event.key === "h") {
        currentSpawnRate *= 1.1;
    }

    if (event.key === "s") {
        player.dirY = 1;
    } else if (event.key === "d"){
        player.dirX = 1;
    } else if (event.key === "w"){
        player.dirY = -1;
    } else if (event.key === "a"){
        player.dirX = -1;
    }

    if (event.key === "c") {
        player.shootBullet();
    }
}


function keyUp(event) {
    if (event.key === "s" || event.key === "w") {
        player.dirY = 0;
    } else if (event.key === "d" || event.key === "a") {
        player.dirX = 0;
    }
}

function Player() {

    this.rotation = 0;
    this.x = midX;
    this.y = midY;

    this.lookDir = 0;
    this.dirX = 0;
    this.dirY = 0;

    this.vx = 0;
    this.vy = 0;
    
    this.update = function() {
        this.getLookDir();
        this.rotation = calculateAngle(this.x, this.y, this.x+this.dirX, this.y+this.dirY);
        calculateVelocity(this, playerSpeed);
        calculatePos(this);
        this.checkEnemyCollisions();
    }
    
    this.draw = () => {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.lookDir);
        ctx.fillStyle = "#d8ebf6";
        ctx.fillRect(-playerSize/2, -playerSize/2, playerSize, playerSize);
        ctx.restore();
    }

    this.shootBullet = () => {
        bullets.push(new Bullet(this.x, this.y, this.lookDir));
    }

    this.checkEnemyCollisions = () => {
        enemies.find(this.collidesWithEnemy);
        moneys.find(this.collidesWithMoney);
    } 

    this.collidesWithMoney = (money) => {
        if (Math.pow(this.x-money.x, 2)+Math.pow(this.y-money.y, 2) < (playerSize/2)*(playerSize/2)) {
            money.consume();
            return true;
        }
        return false;
    }

    this.collidesWithEnemy = (enemy) => {
        if (Math.pow(this.x-enemy.x, 2)+Math.pow(this.y-enemy.y, 2) < enemySize*enemySize) {
            endGame();
            return true;
        }
        return false;
    }

    this.getLookDir = () => {        
        this.lookDir = calculateAngle(this.x, this.y, mouseX, mouseY);
    }
}

function Turret(x, y) {

    this.x = x;
    this.y = y;

    this.lookDir = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.timeToShoot = 0;

    this.target;

    this.active = true;
    
    this.update = () => {
        this.getLookDir();
        this.checkTarget();
        this.checkShoot();
    }
    
    this.draw = () => {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.lookDir);
        ctx.fillStyle = "#435274";
        ctx.beginPath();
        ctx.moveTo(-turretSize/2, -turretSize/2);
        ctx.lineTo(turretSize/2, -turretSize/2);
        ctx.lineTo(0, turretSize/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    this.checkShoot = () => {
        if (this.timeToShoot < 0 && this.target) {
            this.timeToShoot = 100;
            this.shootBullet();
        } else {
            this.timeToShoot -= turretFR;
        }
    }

    this.shootBullet = () => {
        var bounds = (1 - turretAccuracy) * Math.PI;
        var offset = getRnd(0, bounds*2) - bounds;
        bullets.push(new Bullet(this.x, this.y, this.lookDir+offset));
    }

    this.checkTarget = () => {
        if (!this.target || !this.target.active) {
            this.target = undefined;
            this.acquireTarget();
        }
    }

    this.acquireTarget = () => {
        var minTar;
        var minDis;
        enemies.forEach(enemy => {
            if (inMap(enemy)) {
                var distance = Math.sqrt(Math.pow(this.x-enemy.x, 2) + Math.pow(this.y-enemy.y, 2));
                if (minDis > distance || !minTar) {
                    minTar = enemy;
                    minDis = distance;
                }
            }
        });
        this.target = minTar;
    }

    this.getLookDir = () => {
        if(this.target) {
            this.lookDir = calculateAngle(this.x, this.y, this.target.x, this.target.y);
        }
    }
}

function spawnTurret(x, y) {
    if (currentMoney >= 10) {
        turrets.push(new Turret(mouseX, mouseY));
        currentMoney -= 10;
    }
}

function Bullet(x, y, r) {    
    this.x = x;
    this.y = y;
    this.rotation = r;

    this.active = true;

    this.vx = 0;
    this.vy = 0;
    calculateVelocity(this, bulletSpeed);

    this.update = () => {
        this.x += this.vx;
        this.y += this.vy;

        if (!inMap(this)) {
            this.active = false;
        }

        this.checkEnemyCollisions();
    }

    this.draw = () => {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.rotation);
        ctx.fillStyle = "#ccff00";
        ctx.fillRect(-bulletXSize/2, -bulletYSize/2, bulletXSize, bulletYSize);
        ctx.restore();
    }

    this.checkEnemyCollisions = () => {
        enemies.find(this.collidesWithEnemy);
    } 

    this.collidesWithEnemy = (enemy) => {
        if (Math.pow(this.x-enemy.x, 2)+Math.pow(this.y-enemy.y, 2) < enemySize*enemySize) {
            enemy.die();
            this.active = false;
            currentScore++;
            return true;
        }
        return false;
    }
}

function Enemy(bearing, player) {
    this.x = Math.round(canvas.width/1.3 * Math.sin(bearing))+canvas.width/2;
    this.y = Math.round(canvas.height/1.3 * Math.cos(bearing))+canvas.height/2;

    this.player = player;

    this.rotation = 0;

    this.vx = 0;
    this.vy = 0;

    this.active = true;

    this.die = () => {
        this.active = false;
        if (Math.random() < 0.1) {
            moneys.push(new Money(this.x, this.y));
        }
    }

    this.draw = () => {
        ctx.fillStyle = "#903C3C";
        ctx.beginPath();
        ctx.arc(this.x, this.y, enemySize, 0, 2 * Math.PI);
        ctx.fill()
    }

    this.update = () => {
        this.rotation = calculateAngle(this.x, this.y, player.x, player.y);
        calculateVelocity(this, enemySpeed);
        calculatePos(this);
    }
}

function Money(x, y) {

    this.x = x;
    this.y = y;

    this.monetaryValue = 10;
    this.active = true;

    this.consume = () => {
        console.log("gay");
        currentMoney += this.monetaryValue;
        this.active = false;
    }

    this.draw = () => {
        ctx.fillStyle = "#F6E481";
        ctx.beginPath();
        ctx.arc(this.x, this.y, moneySize, 0, 2 * Math.PI);
        ctx.fill()
    }

    this.update = () => {
    }
}

function calculatePos(obj) {
    obj.x += obj.vx || 0;
    obj.y += obj.vy || 0;
}

function calculateVelocity(obj, vel) {
    obj.vx = Math.sin(obj.rotation) * vel;
    obj.vy = Math.cos(obj.rotation) * vel;
}

function calculateAngle(subx, suby, objx, objy) {
    let xVec = objx - subx;
    let yVec = objy - suby;

    let rotation;
    
    if (xVec > 0) {
        if (yVec > 0) {
            rotation = Math.atan(xVec/yVec);
        } else if (yVec < 0) {
            rotation = Math.PI + Math.atan(xVec/yVec);
        } else {
            rotation = Math.PI/2;
        }
    } else if (xVec < 0) {
        if (yVec > 0) {
            rotation = Math.PI*2 + Math.atan(xVec/yVec);
        } else if (yVec < 0){
            rotation = Math.PI + Math.atan(xVec/yVec);
        } else {
            rotation = Math.PI*1.5;
        }
    } else {
        if (yVec > 0) {
            rotation = 0;
        } else if (yVec < 0){
            rotation = Math.PI;
        } else {
            rotation = undefined;
        }
    }
    return rotation;
}

function inMap(object) {
    if (object.x < canvas.width && object.x > 0 &&
        object.y < canvas.height && object.y > 0) {
            return true;
    } else {
        return false;
    }
}

function endGame() {
    if (!gameOver) {
        gameOver = true;
        lengthOfGametick *= 10;
    }
}

function spawnEnemy() {
    enemies.push(new Enemy(getRnd(0, Math.PI*2), player));
}

function spawnEnemies() {
    if (Math.random() < currentSpawnRate) {
        spawnEnemy();
    } else {
        currentSpawnRate *= 1.0001;
    }
}

function getRnd(min, max) {
    return Math.random() * (max - min) + min;
}

function drawBack() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function displayStats() {
    ctx.font = "15px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText(`Current score: ${currentScore}\n Money: ${currentMoney}`, 10, 20);
}

function displayGameOver() {
    // ctx.font = "30px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.001)";
    // ctx.fillText(`WASTED`, player.x - 50, player.y + 10);
    ctx.drawImage(wastedImg, midX-wastedImg.width/2, midY-wastedImg.height);
}