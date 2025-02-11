// ***** Geometry Classes *****

class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }

  class Line {
    constructor(startPoint, endPoint, width) {
      this.startPoint = startPoint;
      this.endPoint = endPoint;
      this.width = width || 20; // Default width
      this.isExist = true;
    }
    setMiddlePoint() {
      this.middlePoint = new Point(
        (this.startPoint.x + this.endPoint.x) / 2,
        (this.startPoint.y + this.endPoint.y) / 2
      );
    }
    getCentroid() {
      let lineCentroid = new Point(
        (this.startPoint.x + this.endPoint.x) / 2,
        (this.startPoint.y + this.endPoint.y) / 2
      );
      let dx = this.endPoint.x - this.startPoint.x;
      let dy = this.endPoint.y - this.startPoint.y;
      let lineLength = Math.hypot(dx, dy);
      let offsetX = (this.width / 2) * dy / lineLength;
      let offsetY = (this.width / 2) * dx / lineLength;
      return new Point(lineCentroid.x + offsetX, lineCentroid.y + offsetY);
    }
    getLength() {
      return Math.hypot(
        this.endPoint.x - this.startPoint.x,
        this.endPoint.y - this.startPoint.y
      ) + this.width;
    }
  }

  class Arc {
    constructor(centerPoint, startPoint, endPoint, startAngle, endAngle, radius, width) {
      this.centerPoint = centerPoint;
      this.startPoint = startPoint;
      this.endPoint = endPoint;
      this.startAngle = startAngle;
      this.endAngle = endAngle;
      this.radius = radius;
      this.width = width || 20;
      this.isExist = true;
      let midAngle = (this.startAngle + this.endAngle) / 2;
      this.middlePoint = new Point(
        this.centerPoint.x + this.radius * Math.cos(midAngle),
        this.centerPoint.y + this.radius * Math.sin(midAngle)
      );
    }
    setMiddlePoint() {
      let midAngleRad = ((this.startAngle + this.endAngle) / 2) * (Math.PI / 180);
      this.middlePoint = new Point(
        this.centerPoint.x + this.radius * Math.cos(midAngleRad),
        this.centerPoint.y + this.radius * Math.sin(midAngleRad)
      );
    }
    getCentroid() {
      let theta = (this.endAngle - this.startAngle) / 2;
      let alpha = (this.startAngle + this.endAngle) / 2;
      let centroidX = this.centerPoint.x + (2 * this.radius * Math.sin(theta) / (3 * theta)) * Math.cos(alpha);
      let centroidY = this.centerPoint.y + (2 * this.radius * Math.sin(theta) / (3 * theta)) * Math.sin(alpha);
      let offsetX = (this.width / 2) * Math.cos(alpha);
      let offsetY = (this.width / 2) * Math.sin(alpha);
      return new Point(centroidX + offsetX, centroidY + offsetY);
    }
    getLength() {
      return this.radius * Math.abs(this.endAngle - this.startAngle) + this.width;
    }
  }

  class Cell {
    constructor(outerArcs, innerArc, firstLine, secondLine, rowNum, colNum) {
      this.outerArcs = outerArcs || [];
      this.innerArc = innerArc;
      this.firstLine = firstLine;
      this.secondLine = secondLine;
      this.neighbors = [];
      this.isVisited = false;
      this.rowNum = rowNum;
      this.colNum = colNum;
    }
    calculateCentroid() {
      let totalArea = 0, weightedSumX = 0, weightedSumY = 0;
      let elements = [...this.outerArcs, this.innerArc, this.firstLine, this.secondLine];
      for (let element of elements) {
        if (!element) continue;
        let centroid = element.getCentroid();
        let weight = element.getLength();
        totalArea += weight;
        weightedSumX += centroid.x * weight;
        weightedSumY += centroid.y * weight;
      }
      return new Point(weightedSumX / totalArea, weightedSumY / totalArea);
    }
    setCentroidOfConcentricArcs() {
      let p1 = (this.outerArcs && this.outerArcs.length > 1) ? this.outerArcs[0].endPoint :
        new Point((this.outerArcs[0].startPoint.x + this.outerArcs[0].endPoint.x) / 2,
                  (this.outerArcs[0].startPoint.y + this.outerArcs[0].endPoint.y) / 2);
      let p2 = this.innerArc.middlePoint;
      this.centroid = new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
    setAdditionalPointsOnCircle() {
      if (!this.centroid || !this.innerArc) return;

      let center = this.innerArc.centerPoint;
      let centroid = this.centroid;
      let pointA = this.firstLine ? this.firstLine.middlePoint : null;
      let pointB = this.secondLine ? this.secondLine.middlePoint : null;

      // Step 1: Compute midpoints with centroid
      let tempHelperA = pointA ? this.getMidpoint(centroid, pointA) : centroid;
      let tempHelperB = pointB ? this.getMidpoint(centroid, pointB) : centroid;

      // Step 2: Compute the radius offset (distance from centroid to center)
      let radiusOffset = Math.hypot(centroid.x - center.x, centroid.y - center.y);

      // Step 3: Compute final helper points along the line from center → tempHelperX
      this.helperStartPoint = this.getPointOnLine(center, tempHelperA, radiusOffset);
      this.helperEndPoint = this.getPointOnLine(center, tempHelperB, radiusOffset);
    }

    /**
     * Finds the midpoint between two points
     */
    getMidpoint(p1, p2) {
      return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }

    /**
     * Finds a point along the line from `center` → `targetPoint` at a fixed `distance`
     */
    getPointOnLine(center, targetPoint, distance) {
      let dx = targetPoint.x - center.x;
      let dy = targetPoint.y - center.y;
      let angle = Math.atan2(dy, dx);

      return new Point(
        center.x + distance * Math.cos(angle),
        center.y + distance * Math.sin(angle)
      );
    }

    findMiddleArcPoint() {
      if (!this.innerArc || this.outerArcs.length === 0) {
        return null; // No valid arcs to work with
      }

      let center = this.innerArc.centerPoint;
      let startAngle = this.innerArc.startAngle;
      let endAngle = this.innerArc.endAngle;
      let midAngle = (startAngle + endAngle) / 2; // Get the middle angle in degrees

      let innerRadius = this.innerArc.radius;
      let outerRadius;

      if (this.outerArcs.length === 1) {
        outerRadius = this.outerArcs[0].radius;
      } else {
        outerRadius = (this.outerArcs[0].radius + this.outerArcs[1].radius) / 2;
      }

      let middleRadius = (innerRadius + outerRadius) / 2; // Improved spacing

      return new Point(
        center.x + middleRadius * Math.cos(midAngle * (Math.PI / 180)),
        center.y + middleRadius * Math.sin(midAngle * (Math.PI / 180))
      );
    }

  }
  function selectRandomCentroids(grid, numSprites) {
    let availableCells = [];

    // Collect all valid cells except those in the 0th row
    for (let row = 1; row < grid.length; row++) { // Start from row 1
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col].centroid) {
                availableCells.push(grid[row][col]);
            }
        }
    }

    // Shuffle the list to ensure randomness
    availableCells.sort(() => Math.random() - 0.5);

    // Select `numSprites` unique cells
    let selectedCentroids = availableCells.slice(0, Math.min(numSprites, availableCells.length))
        .map(cell => cell.centroid);

    return selectedCentroids;
}

  // ***** Maze and Drawing Variables *****

  const keys = [1, 2, 4, 8];
  const numberOfRings = 7;
  const baseRadius = 40;
  const rounds = [...Array(numberOfRings)].map((_, i) =>
    2 ** (keys.findLastIndex(j => j < i + 1)) * 8
  );

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const colors = [
    "#FF0000", "#FF7F00", "#FFFF00", "#7FFF00",
    "#00FF00", "#00FF7F", "#00FFFF", "#007FFF",
    "#7F00FF", "#FF00FF", "#FF007F", "#7F0000"
  ];

  const mazeWidth = 600;
  const mazeHeight = 600;

  const circle = {
    radius: 10,
    color: 'red',
    x: mazeWidth / 2,
    y: mazeHeight / 2,
    dragging: false,
    offsetX: 0,
    offsetY: 0
  };

  canvas.width = mazeWidth;
  canvas.height = mazeHeight;

let score = 0;
let timeRemaining = 60000; // Initial time in milliseconds (example: 60s)
let timeoutId;
let intervalId;

// Global variable to store the finish node.
let finishGraphNode = null;
// Global array to store allowed edges (paths) between graph nodes.
let allowedPaths = [];
  // Global flag for game over.
  let gameOver = false;
  let keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  };

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high"; // Optional: "low", "medium", or "high"
let isMovedToCenter = false;
const numSprites = 25; // Number of sprites to display
const gameObjects = []; // Store all objects in the maze

const images = {
    "cash": { src: "assets/cash.png", size: 25, effect: () => { score += 100; } },
    "coins": { src: "assets/coins.png", size: 25, effect: () => { score += 20; } },
    "heart": { src: "assets/heart.png", size: 25, effect: () => { extendTime(30000); } },
    "syringe": { src: "assets/syringe.png", size: 25, effect: () => { isMovedToCenter = true;} },
    "powder": { src: "assets/powder.png", size: 25, effect: () => { isMovedToCenter = true;} },
    "skull": { src: "assets/skull.png", size: 25, effect: () => { isMovedToCenter = true;} },
    "siren": { src: "assets/siren.png", size: 25, effect: () => { isMovedToCenter = true;} }    
};

// Preload images
const loadedImages = {};
// Load sound effects
const sounds = {
  heart: { audio: new Audio("assets/sounds/heart.wav"), startTime: 1500, duration: 2000 }, // Play from 1s to 3s
  coins: { audio: new Audio("assets/sounds/coins.wav"), startTime: 0, duration: 1000 },  // Play from 0.5s to 2s
  cash: { audio: new Audio("assets/sounds/cash.wav"), startTime: 500, duration: 1000 },     // Play from 0s to 3s
  syringe: { audio: new Audio("assets/sounds/syringe.wav"), startTime: 400, duration: 800 },
  powder: { audio: new Audio("assets/sounds/powder.wav"), startTime: 800, duration: 1000 },
  skull: { audio: new Audio("assets/sounds/skull.wav"), startTime: 0, duration: 800 },
  siren: { audio: new Audio("assets/sounds/siren.wav"), startTime: 0, duration: 400 }
};

const backgroundMusic = new Audio("assets/sounds/piano.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

function playMusic() {
    backgroundMusic.play().catch(error => console.error("Autoplay blocked:", error));
}

// Listen for visibility change
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        playMusic(); // Start playing when the window is focused (comes into view)
    }
});

// Play music when the page loads
window.addEventListener("load", () => {
    if (document.visibilityState === "visible") {
        playMusic(); // Play immediately if already visible on load
    }
});

// Play music on canvas click
canvas.addEventListener("click", () => {
    playMusic();
});

// Play music on touch start (valid touch event)
canvas.addEventListener("touchstart", () => {
    playMusic();
});

// ----- Collision Detection for Game Objects -----
function checkCollisions() {
  for (let obj of gameObjects) {
    // Only process objects that haven't been marked as collided.
    if (!obj.collided) {
      // Compute closest point on the object's bounding box to the circle.
      const halfSize = obj.size / 2;
      const closestX = Math.max(obj.x - halfSize, Math.min(circle.x, obj.x + halfSize));
      const closestY = Math.max(obj.y - halfSize, Math.min(circle.y, obj.y + halfSize));
      const distance = Math.hypot(circle.x - closestX, circle.y - closestY);

      // If the ball is overlapping the object, process the collision.
      if (distance < circle.radius) {
        obj.effect();          // Apply the object's effect (score, time, etc.)
        obj.collided = true;   // Mark this object as collided so it won't be processed again.
        startFading(obj);      // Begin fading out the collided object.
        playSound(obj);        // Play its associated sound.
      }
    }
  }
}

function playSound(obj) {
  // Debugging log for sound play
  playSoundSegment(obj.type);
}

function playSoundSegment(type) {
  if (sounds[type]) {
    const { audio, startTime, duration } = sounds[type];
    audio.volume = 1;
    audio.currentTime = startTime / 1000; // Convert ms to seconds (audio expects seconds)
    audio.play();

    // Stop the sound after the segment's duration
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0; // Reset for next play
    }, duration);
  } else {
    console.log(`No sound found for type: ${type}`);
  }
}


function preloadImages(callback) {
  let count = 0;
  const total = Object.keys(images).length;
  for (let key in images) {
    let img = new Image();
    img.src = images[key].src;
    img.onload = () => {
      loadedImages[key] = img;
      count++;
      if (count === total) {
        // All images are loaded—start the game!
        callback();
      }
    };
    img.onerror = () => {
      console.error(`Error loading image: ${images[key].src}`);
      count++;
      if (count === total) {
        callback();
      }
    };
  }
}

function generateGameObjects() {
  // Clear any existing game objects.
  gameObjects.length = 0;

  // Use candidate cells from all rings except the innermost.
  const candidateCells = [];
  for (let i = 1; i < grid.length; i++) { 
      candidateCells.push(...grid[i]);
  }

  // Weighted probabilities: rewards have higher weights than punishments.
  const weightedImageKeys = [
      { key: "cash",    weight: 3 },
      { key: "coins",   weight: 3 },
      { key: "heart",   weight: 2 },
      { key: "syringe", weight: 1 },
      { key: "powder",  weight: 1 },
      { key: "skull",   weight: 1 },
      { key: "siren",   weight: 1 }
  ];
  const totalWeight = weightedImageKeys.reduce((sum, item) => sum + item.weight, 0);

  while (gameObjects.length < numSprites && candidateCells.length > 0) {
      // Pick a random cell and remove it from candidates.
      let randIndex = Math.floor(Math.random() * candidateCells.length);
      let cell = candidateCells[randIndex];
      candidateCells.splice(randIndex, 1);

      if (cell.centroid) {
          // Perform weighted random selection.
          let randomWeight = Math.random() * totalWeight;
          let selectedKey;
          for (let item of weightedImageKeys) {
              randomWeight -= item.weight;
              if (randomWeight <= 0) {
                  selectedKey = item.key;
                  break;
              }
          }
          let selectedImage = images[selectedKey];

          gameObjects.push({
              type: selectedKey,
              x: cell.centroid.x,
              y: cell.centroid.y,
              image: loadedImages[selectedKey],
              size: selectedImage.size,
              effect: selectedImage.effect,
              opacity: 1,       // Fully visible at start.
              fading: false,    // Not fading initially.
              collided: false   // Collision only triggers once.
          });
      }
  }
}

function drawGameObjects() {
  for (let obj of gameObjects) {
    if (obj.image) {
      ctx.globalAlpha = obj.opacity; // Use the current opacity for fading.
      ctx.drawImage(
        obj.image,
        obj.x - obj.size / 2,
        obj.y - obj.size / 2,
        obj.size,
        obj.size
      );
      ctx.globalAlpha = 1; // Reset alpha for subsequent drawing.
    }
  }
}

// ----- Fading Functions -----
function startFading(obj) {
  // Ensure we only start fading once per object.
  if (!obj.fading) {
    obj.fading = true;
    obj.opacity = 1;  // Start fully opaque.
    fadeStep(obj);
  }
}


function fadeStep(obj) {
  // Gradually decrease the opacity.
  if (obj.opacity > 0) {
    obj.opacity -= 0.05; // Adjust the decrement for the desired fade speed.
    requestAnimationFrame(() => fadeStep(obj));
  } else {
    // Once fully faded, ensure opacity is exactly 0,
    // mark fading as complete, and remove the object.
    obj.opacity = 0;
    obj.fading = false;
    const index = gameObjects.indexOf(obj);
    if (index > -1) {
      gameObjects.splice(index, 1);
    }
    // Redraw to update the display.
    redraw();
  }
}



// Animate fading effect before removing object
function updateGameObjects() {
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        let obj = gameObjects[i];
        if (obj.fading) {
            obj.opacity -= 0.05; // Gradually fade out
            if (obj.opacity <= 0) {
                gameObjects.splice(i, 1); // Remove from array
            }
        }
    }
}


function breakRandomOuterWall() {
  // Get the outer ring of cells.
  const outerRing = grid[grid.length - 1];
  if (!outerRing || outerRing.length === 0) return;

  // Pick a random cell from the outer ring.
  const randomIndex = Math.floor(Math.random() * outerRing.length);
  const cell = outerRing[randomIndex];

  // Ensure the cell has outer arcs.
  if (!cell.outerArcs || cell.outerArcs.length === 0) return;

  // Choose one outer arc to break. (If you prefer, you could choose based on additional logic.)
  const arc = cell.outerArcs[0];
  arc.isExist = false;  // "Break" the wall.

  // Determine the finish position.
  // Here we use the arc's middlePoint (or average the endpoints if not set).
  const finishPos = arc.middlePoint || new Point(
    (arc.startPoint.x + arc.endPoint.x) / 2,
    (arc.startPoint.y + arc.endPoint.y) / 2
  );

  // Create the finish node at the broken wall's location.
  // We mark it as the finish and also store it in the global variable.
  finishGraphNode = addGraphNode(finishPos, "finish", cell);
  finishGraphNode.isFinish = true;

  // Look for the closest node from the cell (or neighboring cells) to connect to.
  let possibleNodes = [];
  if (cell.centroidNode) possibleNodes.push(cell.centroidNode);
  if (cell.helperStartNode) possibleNodes.push(cell.helperStartNode);
  if (cell.helperEndNode) possibleNodes.push(cell.helperEndNode);

  let closestNode = null;
  let minDistance = Infinity;
  for (let node of possibleNodes) {
    let dist = distanceBetweenPoints(finishPos, node.pos);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  }

  // If no node is found in the current cell, check the neighboring cells in the same outer ring.
  if (!closestNode) {
    const leftNeighbor = outerRing[(randomIndex - 1 + outerRing.length) % outerRing.length];
    const rightNeighbor = outerRing[(randomIndex + 1) % outerRing.length];
    const neighborNodes = [];
    if (leftNeighbor) {
      if (leftNeighbor.centroidNode) neighborNodes.push(leftNeighbor.centroidNode);
      if (leftNeighbor.helperStartNode) neighborNodes.push(leftNeighbor.helperStartNode);
      if (leftNeighbor.helperEndNode) neighborNodes.push(leftNeighbor.helperEndNode);
    }
    if (rightNeighbor) {
      if (rightNeighbor.centroidNode) neighborNodes.push(rightNeighbor.centroidNode);
      if (rightNeighbor.helperStartNode) neighborNodes.push(rightNeighbor.helperStartNode);
      if (rightNeighbor.helperEndNode) neighborNodes.push(rightNeighbor.helperEndNode);
    }
    for (let node of neighborNodes) {
      let dist = distanceBetweenPoints(finishPos, node.pos);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }
  }

  // If still no node is found, search the entire graph.
  if (!closestNode) {
    for (let node of graphNodes) {
      let dist = distanceBetweenPoints(finishPos, node.pos);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }
  }

  // Connect the finish node to the chosen node using your allowed edge logic.
  if (closestNode) {
    addAllowedEdge(closestNode, finishGraphNode);
  }
  
  redraw();
}

  // ***** Collision Detection (for drawing / wall blocking) *****

  function isPathCollidingWithMaze(circle, newX, newY) {
    let steps = 10;
    let stepX = (newX - circle.x) / steps;
    let stepY = (newY - circle.y) / steps;
    for (let i = 1; i <= steps; i++) {
      let checkX = circle.x + stepX * i;
      let checkY = circle.y + stepY * i;
      if (isCollidingWithMaze({ x: checkX, y: checkY, radius: circle.radius })) {
        return true;
      }
    }
    return false;
  }

  function isCollidingWithMaze(circle) {
    for (let ring of grid) {
      for (let cell of ring) {
        if (cell.innerArc?.isExist && isCircleCollidingWithArc(circle, cell.innerArc)) {
          return true;
        }
        for (let arc of cell.outerArcs) {
          if (arc.isExist && isCircleCollidingWithArc(circle, arc)) {
            return true;
          }
        }
        if (cell.firstLine?.isExist && isCircleCollidingWithLine(circle, cell.firstLine)) {
          return true;
        }
        if (cell.secondLine?.isExist && isCircleCollidingWithLine(circle, cell.secondLine)) {
          return true;
        }
      }
    }
    return false;
  }
  
  function isCircleCollidingWithArc(circle, arc) {
    let distToCenter = Math.hypot(circle.x - arc.centerPoint.x, circle.y - arc.centerPoint.y);
    // Take the wall width into account: the effective collision threshold is the ball's radius plus half the arc's width.
    let withinArcRange = Math.abs(distToCenter - arc.radius) <= (circle.radius + arc.width / 4);
    if (withinArcRange) {
      let angleToCircle = Math.atan2(circle.y - arc.centerPoint.y, circle.x - arc.centerPoint.x);
      if (angleToCircle < 0) angleToCircle += 2 * Math.PI;
      return arc.startAngle <= angleToCircle && angleToCircle <= arc.endAngle;
    }
    return false;
  }
  
  function isCircleCollidingWithLine(circle, line) {
    let dist = distancePointToLine(circle, line.startPoint, line.endPoint);
    // Include half the line's width in the collision threshold.
    return dist <= (circle.radius + line.width / 4);
  }
  
  function distancePointToLine(circle, lineStart, lineEnd) {
    let A = circle.x - lineStart.x;
    let B = circle.y - lineStart.y;
    let C = lineEnd.x - lineStart.x;
    let D = lineEnd.y - lineStart.y;
    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = len_sq !== 0 ? dot / len_sq : -1;
    let closestX, closestY;
    if (param < 0) {
      closestX = lineStart.x;
      closestY = lineStart.y;
    } else if (param > 1) {
      closestX = lineEnd.x;
      closestY = lineEnd.y;
    } else {
      closestX = lineStart.x + param * C;
      closestY = lineStart.y + param * D;
    }
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    return Math.hypot(dx, dy);
  }
  
  // ***** Utility Functions *****

  function polarToCartesian(centerX, centerY, radius, angle) {
    return new Point(
      Math.round(centerX + radius * Math.cos(angle)),
      Math.round(centerY + radius * Math.sin(angle))
    );
  }

  function drawArc(centerX, centerY, radius, startAngle, endAngle, color = "#00FF00", width = 10) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawLine(point1, point2, color = "#00FF00", width = 10) {
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawDot(point, color = "red", size = 5) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ***** Maze Creation *****

  let grid = [];

  function createConcentricCircles(centerX, centerY) {
    let previousRing = [];
    grid[0] = [];
    let innermostCell = new Cell();
    let innermostRadius = baseRadius;
    let numArcs = rounds[0];
    let innermostArcs = [];
    innermostCell.rowNum = 0;
    innermostCell.colNum = 0;
    for (let j = 0; j < numArcs; j++) {
      let startAngle = (j * 2 * Math.PI) / numArcs;
      let endAngle = ((j + 1) * 2 * Math.PI) / numArcs;
      let startPoint = polarToCartesian(centerX, centerY, innermostRadius, startAngle);
      let endPoint = polarToCartesian(centerX, centerY, innermostRadius, endAngle);
      startPoint.x = Math.round(startPoint.x);
      startPoint.y = Math.round(startPoint.y);
      endPoint.x = Math.round(endPoint.x);
      endPoint.y = Math.round(endPoint.y);
      let innerArc = new Arc(new Point(centerX, centerY), startPoint, endPoint, startAngle, endAngle, innermostRadius);
      innermostArcs.push(innerArc);
    }
    innermostCell.outerArcs = innermostArcs;
    innermostCell.centroid = innermostCell.calculateCentroid();
    innermostCell?.firstLine?.setMiddlePoint();
    innermostCell?.secondLine?.setMiddlePoint();
    grid[0] = [innermostCell];
    previousRing = grid[0];

    for (let i = 1; i < numberOfRings; i++) {
      grid[i] = [];
      let radius = baseRadius * (i + 1);
      let numArcs = rounds[i];
      let numCells = rounds[i - 1];
      let currentRing = [];
      for (let j = 0; j < numCells; j++) {
        let startAngle = (j * 2 * Math.PI) / numCells;
        let endAngle = ((j + 1) * 2 * Math.PI) / numCells;
        let startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
        let endPoint = polarToCartesian(centerX, centerY, radius, endAngle);
        startPoint.x = Math.round(startPoint.x);
        startPoint.y = Math.round(startPoint.y);
        endPoint.x = Math.round(endPoint.x);
        endPoint.y = Math.round(endPoint.y);
        let cell = new Cell();
        cell.rowNum = i;
        cell.colNum = j;
        grid[i].push(cell);
        currentRing.push(cell);
        let outerArcs = [];
        for (let k = 0; k < numArcs / numCells; k++) {
          let arcStartAngle = startAngle + (k * 2 * Math.PI) / numArcs;
          let arcEndAngle = startAngle + ((k + 1) * 2 * Math.PI) / numArcs;
          let arcStartPoint = polarToCartesian(centerX, centerY, radius, arcStartAngle);
          let arcEndPoint = polarToCartesian(centerX, centerY, radius, arcEndAngle);
          arcStartPoint.x = Math.round(arcStartPoint.x);
          arcStartPoint.y = Math.round(arcStartPoint.y);
          arcEndPoint.x = Math.round(arcEndPoint.x);
          arcEndPoint.y = Math.round(arcEndPoint.y);
          let outerArc = new Arc(new Point(centerX, centerY), arcStartPoint, arcEndPoint, arcStartAngle, arcEndAngle, radius);
          outerArcs.push(outerArc);
        }
        cell.outerArcs = outerArcs;
        if (i > 0) {
          let innerRadius = baseRadius * i;
          let innerStartPoint = polarToCartesian(centerX, centerY, innerRadius, startAngle);
          let innerEndPoint = polarToCartesian(centerX, centerY, innerRadius, endAngle);
          let innerArc = new Arc(new Point(centerX, centerY), innerStartPoint, innerEndPoint, startAngle, endAngle, innerRadius);
          cell.innerArc = innerArc;
          for (let currentArc of cell.outerArcs) {
            if (arePointsOnSameRadialLine(new Point(centerX, centerY), innerArc.startPoint, currentArc.startPoint, 1)) {
              let connectionLine = new Line(innerArc.startPoint, currentArc.startPoint);
              cell.firstLine = connectionLine;
              cell.firstLine.setMiddlePoint();
            }
            if (arePointsOnSameRadialLine(new Point(centerX, centerY), innerArc.endPoint, currentArc.startPoint, 1)) {
              let connectionLine = new Line(innerArc.endPoint, currentArc.startPoint);
              cell.firstLine = connectionLine;
              cell.firstLine.setMiddlePoint();
            }
            if (arePointsOnSameRadialLine(new Point(centerX, centerY), innerArc.endPoint, currentArc.endPoint, 1)) {
              let connectionLine = new Line(innerArc.endPoint, currentArc.endPoint);
              cell.secondLine = connectionLine;
              cell.secondLine.setMiddlePoint();
            }
            if (arePointsOnSameRadialLine(new Point(centerX, centerY), innerArc.startPoint, currentArc.endPoint, 1)) {
              let connectionLine = new Line(innerArc.startPoint, currentArc.endPoint);
              cell.secondLine = connectionLine;
              cell.secondLine.setMiddlePoint();
            }
          }
        }
        cell.setCentroidOfConcentricArcs();
        cell.setAdditionalPointsOnCircle();
      }
      previousRing = currentRing;
    }
  }

  function arePointsOnSameRadialLine(center, pointA, pointB, toleranceDegrees = 1) {
    const angleA = Math.atan2(pointA.y - center.y, pointA.x - center.x);
    const angleB = Math.atan2(pointB.y - center.y, pointB.x - center.x);
    const angleADegrees = (angleA * 180) / Math.PI;
    const angleBDegrees = (angleB * 180) / Math.PI;
    const angularDifference = Math.abs(angleADegrees - angleBDegrees);
    const normalizedDifference = Math.min(angularDifference, 360 - angularDifference);
    return normalizedDifference <= toleranceDegrees;
  }

  function findNeighbors() {
    let flatGrid = grid.flat();
    flatGrid.forEach(cell => {
      let neighbors = [];
      flatGrid.forEach(otherCell => {
        if (otherCell === cell) return;
        if (findNeighbor(cell, otherCell, false)) {
          neighbors.push(otherCell);
        }
      });
      cell.neighbors = neighbors;
    });
  }

  function findNeighbor(cell1, cell2, isBreakWall) {
    if (cell1.outerArcs && cell2.outerArcs) {
      for (let arc1 of cell1.outerArcs) {
        for (let arc2 of cell2.outerArcs) {
          if (areArcsEqual(arc1, arc2)) {
            if (isBreakWall) {
              arc1.isExist = false;
              arc2.isExist = false;
            }
            return true;
          }
        }
      }
    }
    if (cell1.innerArc && cell2.outerArcs) {
      for (let arc2 of cell2.outerArcs) {
        if (areArcsEqual(cell1.innerArc, arc2)) {
          if (isBreakWall) {
            cell1.innerArc.isExist = false;
            arc2.isExist = false;
          }
          return true;
        }
      }
    }
    if (cell1.outerArcs && cell2.innerArc) {
      for (let arc1 of cell1.outerArcs) {
        if (areArcsEqual(arc1, cell2.innerArc)) {
          if (isBreakWall) {
            arc1.isExist = false;
            cell2.innerArc.isExist = false;
          }
          return true;
        }
      }
    }
    if (cell1.innerArc && cell2.innerArc) {
      if (areArcsEqual(cell1.innerArc, cell2.innerArc)) {
        if (isBreakWall) {
          cell1.innerArc.isExist = false;
          cell2.innerArc.isExist = false;
        }
        return true;
      }
    }
    for (let line1 of [cell1.firstLine, cell1.secondLine]) {
      for (let line2 of [cell2.firstLine, cell2.secondLine]) {
        if (areLinesEqual(line1, line2)) {
          if (isBreakWall) {
            line1.isExist = false;
            line2.isExist = false;
          }
          return true;
        }
      }
    }
    return false;
  }

  function areArcsEqual(arc1, arc2, tolerance = 2) {
    if (arc1 && arc2) {
      return (Math.abs(arc1.startPoint.x - arc2.startPoint.x) <= tolerance &&
              Math.abs(arc1.startPoint.y - arc2.startPoint.y) <= tolerance &&
              Math.abs(arc1.endPoint.x - arc2.endPoint.x) <= tolerance &&
              Math.abs(arc1.endPoint.y - arc2.endPoint.y) <= tolerance &&
              Math.abs(arc1.centerPoint.x - arc2.centerPoint.x) <= tolerance &&
              Math.abs(arc1.centerPoint.y - arc2.centerPoint.y) <= tolerance);
    }
    return false;
  }


  function areLinesEqual(line1, line2) {
    if (line1 && line2) {
      return (line1.startPoint.x === line2.startPoint.x &&
              line1.startPoint.y === line2.startPoint.y &&
              line1.endPoint.x === line2.endPoint.x &&
              line1.endPoint.y === line2.endPoint.y) ||
             (line1.startPoint.x === line2.endPoint.x &&
              line1.startPoint.y === line2.endPoint.y &&
              line1.endPoint.x === line2.startPoint.x &&
              line1.endPoint.y === line2.startPoint.y);
    }
    return false;
  }

  function drawRadialLines(outerArcs, innerArc) {
    outerArcs.forEach(arc => {
      let centerX = arc.centerPoint.x;
      let centerY = arc.centerPoint.y;
      let startAngleRad = arc.startAngle;
      let endAngleRad = arc.endAngle;

      let innerStartX = centerX + innerArc.radius * Math.cos(startAngleRad);
      let innerStartY = centerY + innerArc.radius * Math.sin(startAngleRad);
      let outerStartX = centerX + arc.radius * Math.cos(startAngleRad);
      let outerStartY = centerY + arc.radius * Math.sin(startAngleRad);

      let innerEndX = centerX + innerArc.radius * Math.cos(endAngleRad);
      let innerEndY = centerY + innerArc.radius * Math.sin(endAngleRad);
      let outerEndX = centerX + arc.radius * Math.cos(endAngleRad);
      let outerEndY = centerY + arc.radius * Math.sin(endAngleRad);

      drawLine({ x: innerStartX, y: innerStartY }, { x: outerStartX, y: outerStartY }, "blue", 2);
      drawLine({ x: innerEndX, y: innerEndY }, { x: outerEndX, y: outerEndY }, "blue", 2);
    });
  }

  function drawIntermediateArc(arcArray, arc2) {
    ctx.beginPath();
    arcArray.forEach(outerArc => {
      let innerRadius = arc2.radius;
      let outerRadius = outerArc.radius;
      let midRadius = (innerRadius + outerRadius) / 2;
      ctx.arc(
        outerArc.centerPoint.x,
        outerArc.centerPoint.y,
        midRadius,
        outerArc.startAngle,
        outerArc.endAngle
      );
    });
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ***** Maze Generation (Optional) *****

  function generateMaze() {
    let stack = [];
    let currentCell = grid[0][0];
    currentCell.isVisited = true;
    stack.push(currentCell);
    while (grid.flat().some(cell => !cell.isVisited)) {
      let unvisitedNeighbors = currentCell.neighbors.filter(cell => !cell.isVisited);
      if (unvisitedNeighbors.length > 0) {
        let randomIndex = Math.floor(Math.random() * unvisitedNeighbors.length);
        let selectedNeighbor = unvisitedNeighbors[randomIndex];
        findNeighbor(currentCell, selectedNeighbor, true);
        currentCell = selectedNeighbor;
        currentCell.isVisited = true;
        stack.push(currentCell);
      } else {
        currentCell = stack.pop();
      }
    }
  }

  // ***** Graph Building for Movement *****
  //
  // Graph node structure: { id, pos, type, cell, neighbors: [nodeIds] }
  //
  let graphNodes = [];
  let nodeIdCounter = 0;

  function addGraphNode(pos, type, cell) {
    let node = { id: nodeIdCounter++, pos, type, cell, neighbors: [] };
    graphNodes.push(node);
    return node;
  }

  function addEdge(nodeA, nodeB) {
    if (!nodeA.neighbors.includes(nodeB.id)) nodeA.neighbors.push(nodeB.id);
    if (!nodeB.neighbors.includes(nodeA.id)) nodeB.neighbors.push(nodeA.id);
  }

  function distanceBetweenPoints(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  function isEdgeBlocked(fromNode, toNode) {
    if (fromNode.cell === toNode.cell) return false;
    let sharedWall = getSharedWall(fromNode.cell, toNode.cell);
    if (sharedWall && sharedWall.isExist) return true;
    return false;
  }


  function getSharedWall(cell1, cell2) {
    if (cell1.outerArcs && cell2.outerArcs) {
      for (let arc1 of cell1.outerArcs) {
        for (let arc2 of cell2.outerArcs) {
          if (areArcsEqual(arc1, arc2)) return arc1;
        }
      }
    }
    if (cell1.innerArc && cell2.outerArcs) {
      for (let arc2 of cell2.outerArcs) {
        if (areArcsEqual(cell1.innerArc, arc2)) return cell1.innerArc;
      }
    }
    if (cell1.outerArcs && cell2.innerArc) {
      for (let arc1 of cell1.outerArcs) {
        if (areArcsEqual(arc1, cell2.innerArc)) return arc1;
      }
    }
    if (cell1.innerArc && cell2.innerArc) {
      if (areArcsEqual(cell1.innerArc, cell2.innerArc)) return cell1.innerArc;
    }
    for (let line1 of [cell1.firstLine, cell1.secondLine]) {
      for (let line2 of [cell2.firstLine, cell2.secondLine]) {
        if (areLinesEqual(line1, line2)) return line1;
      }
    }
    return null;
  }

// Helper: Compute the minimum distance from a point to a line segment.
function distancePointToSegment(pt, segStart, segEnd) {
    const vx = segEnd.x - segStart.x;
    const vy = segEnd.y - segStart.y;
    const wx = pt.x - segStart.x;
    const wy = pt.y - segStart.y;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) {
      return Math.hypot(pt.x - segStart.x, pt.y - segStart.y);
    }
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) {
      return Math.hypot(pt.x - segEnd.x, pt.y - segEnd.y);
    }
    const b = c1 / c2;
    const pbx = segStart.x + b * vx;
    const pby = segStart.y + b * vy;
    return Math.hypot(pt.x - pbx, pt.y - pby);
  }

  // Helper: Compute the minimal distance between two line segments.
  function distanceBetweenSegments(p1, p2, q1, q2) {
    // If they intersect, the distance is zero.
    if (lineSegmentsIntersect(p1, p2, q1, q2)) return 0;
    // Otherwise, return the minimum of the distances between endpoints and the opposite segment.
    return Math.min(
      distancePointToSegment(p1, q1, q2),
      distancePointToSegment(p2, q1, q2),
      distancePointToSegment(q1, p1, p2),
      distancePointToSegment(q2, p1, p2)
    );
  }

  // (Existing) Helper: Check if two line segments (p→p2 and q→q2) intersect.
  function lineSegmentsIntersect(p, p2, q, q2) {
    function orientation(a, b, c) {
      const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
      if (Math.abs(val) < 1e-10) return 0; // collinear
      return (val > 0) ? 1 : 2; // 1: clockwise, 2: counterclockwise
    }
    const o1 = orientation(p, p2, q);
    const o2 = orientation(p, p2, q2);
    const o3 = orientation(q, q2, p);
    const o4 = orientation(q, q2, p2);

    return (o1 !== o2 && o3 !== o4);
  }

  function lineSegmentIntersectsThickLine(p, p2, wallStart, wallEnd, wallWidth) {
    // If the minimal distance between segments is less than half the wall width, assume collision.
    const d = distanceBetweenSegments(p, p2, wallStart, wallEnd);
    return d < (wallWidth / 2);
  }

  // Helper: Check if the candidate edge (from p to p2) intersects a "thick" arc.
  // The arc is defined by its center (arc.centerPoint), radius (arc.radius),
  // angular span [arc.startAngle, arc.endAngle], and its width (arc.width).
  function lineSegmentIntersectsThickArc(p, p2, arc) {
    // Find the closest point on the candidate edge to the arc center.
    const pt = { x: arc.centerPoint.x, y: arc.centerPoint.y };
    // Compute projection factor b for point pt onto line segment p→p2.
    const vx = p2.x - p.x, vy = p2.y - p.y;
    const wx = pt.x - p.x, wy = pt.y - p.y;
    const c1 = vx * wx + vy * wy;
    const c2 = vx * vx + vy * vy;
    let b = c1 / c2;
    if (b < 0) b = 0;
    if (b > 1) b = 1;
    const closest = { x: p.x + b * vx, y: p.y + b * vy };

    // Compute the difference between the distance from center to the closest point and the arc's radius.
    const dist = Math.hypot(closest.x - arc.centerPoint.x, closest.y - arc.centerPoint.y);
    if (Math.abs(dist - arc.radius) > (arc.width / 2)) return false;

    // Now, check if the angle for the closest point falls within the arc's angular span.
    let angle = Math.atan2(closest.y - arc.centerPoint.y, closest.x - arc.centerPoint.x);
    if (angle < 0) angle += 2 * Math.PI;

    let startAngle = arc.startAngle;
    let endAngle = arc.endAngle;
    if (startAngle < 0) startAngle += 2 * Math.PI;
    if (endAngle < 0) endAngle += 2 * Math.PI;
    if (endAngle < startAngle) endAngle += 2 * Math.PI;
    if (angle < startAngle) angle += 2 * Math.PI;

    return (angle >= startAngle && angle <= endAngle);
  }

  // Check if the candidate edge (line from 'from' to 'to') intersects any maze wall,
  // taking into account the wall's thickness (width).
  function isEdgeIntersectingMazeWalls(from, to) {
    for (let ring of grid) {
      for (let cell of ring) {
        // Check the inner arc if it exists and is active.
        if (cell.innerArc && cell.innerArc.isExist) {
          if (lineSegmentIntersectsThickArc(from, to, cell.innerArc)) return true;
        }
        // Check all outer arcs.
        if (cell.outerArcs) {
          for (let arc of cell.outerArcs) {
            if (arc.isExist && lineSegmentIntersectsThickArc(from, to, arc)) return true;
          }
        }
        // Check first and second lines.
        if (cell.firstLine && cell.firstLine.isExist) {
          if (lineSegmentIntersectsThickLine(from, to, cell.firstLine.startPoint, cell.firstLine.endPoint, cell.firstLine.width)) return true;
        }
        if (cell.secondLine && cell.secondLine.isExist) {
          if (lineSegmentIntersectsThickLine(from, to, cell.secondLine.startPoint, cell.secondLine.endPoint, cell.secondLine.width)) return true;
        }
      }
    }
    return false;
  }

  function addAllowedEdge(nodeA, nodeB) {
    // Do not allow a node to be connected to itself.
    if (nodeA.id === nodeB.id) {
      return;
    }

    // Check if the edge is blocked using your provided function.
    if (isEdgeBlocked(nodeA, nodeB)) return;
    // Also check if the edge (line from nodeA.pos to nodeB.pos) crosses any wall.
    if (isEdgeIntersectingMazeWalls(nodeA.pos, nodeB.pos)) return;

    // Add neighbor references if not already present.
    if (!nodeA.neighbors.includes(nodeB.id)) nodeA.neighbors.push(nodeB.id);
    if (!nodeB.neighbors.includes(nodeA.id)) nodeB.neighbors.push(nodeA.id);

    // Create a unique identifier for the edge so that it isn't added twice.
    let edgeId = [Math.min(nodeA.id, nodeB.id), Math.max(nodeA.id, nodeB.id)].join('-');
    if (!allowedPaths.some(edge => edge.id === edgeId)) {
      allowedPaths.push({ id: edgeId, from: nodeA, to: nodeB });
    }
  }


function addGraphNode(pos, type, cell, order) {
    // For centroids, we can default order to "centroid" if not provided.
    if (!order) {
      order = (type === 'centroid') ? "centroid" : "";
    }
    let node = { id: nodeIdCounter++, pos, type, cell, order, neighbors: [] };
    graphNodes.push(node);
    return node;
  }

function isOnSameRadialLine(p1, p2, center, toleranceDegrees = 5) {
  let angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  let angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff < toleranceDegrees * (Math.PI / 180);
}

// Remove an edge from allowedPaths and from the neighbor lists.
function removeAllowedEdge(nodeA, nodeB) {
  const edgeId = [Math.min(nodeA.id, nodeB.id), Math.max(nodeA.id, nodeB.id)].join('-');
  allowedPaths = allowedPaths.filter(edge => edge.id !== edgeId);
  nodeA.neighbors = nodeA.neighbors.filter(id => id !== nodeB.id);
  nodeB.neighbors = nodeB.neighbors.filter(id => id !== nodeA.id);
}
function buildGraph() {
  // Reset graphNodes, allowedPaths, and nodeIdCounter.
  graphNodes = [];
  allowedPaths = [];
  nodeIdCounter = 0;
  const center = { x: mazeWidth / 2, y: mazeHeight / 2 };

  // 1. Create nodes for each cell.
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];

      // Create firstLine node only if the wall is broken.
      if (cell.firstLine && !cell.firstLine.isExist) {
        cell.firstLine.setMiddlePoint();
        cell.firstLineNode = addGraphNode(cell.firstLine.middlePoint, 'lineMiddle1', cell, "firstLine");
      }
      // Create first helper node (always available).
      if (cell.helperStartPoint) {
        cell.firstHelperNode = addGraphNode(cell.helperStartPoint, 'helper', cell, "firstHelper");
      }
      if (cell.centroid) {
        cell.centroidNode = addGraphNode(cell.centroid, 'centroid', cell, "centroid");
      } else {
        // Fallback: if no centroid, compute one from the cell’s arcs.
        cell.centroid = cell.calculateCentroid();
        cell.centroidNode = addGraphNode(cell.centroid, 'centroid', cell, "centroid");
      }
      // Create second helper node (always available).
      if (cell.helperEndPoint) {
        cell.secondHelperNode = addGraphNode(cell.helperEndPoint, 'helper', cell, "secondHelper");
      }
      // Create secondLine node only if the wall is broken.
      if (cell.secondLine && !cell.secondLine.isExist) {
        cell.secondLine.setMiddlePoint();
        cell.secondLineNode = addGraphNode(cell.secondLine.middlePoint, 'lineMiddle2', cell, "secondLine");
      }
    }
  }

  // 2. Intra–cell connectivity.
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];
      let nodes = [];
      if (cell.firstLineNode) nodes.push(cell.firstLineNode);
      if (cell.firstHelperNode) nodes.push(cell.firstHelperNode);
      if (cell.centroidNode) nodes.push(cell.centroidNode);
      if (cell.secondHelperNode) nodes.push(cell.secondHelperNode);
      if (cell.secondLineNode) nodes.push(cell.secondLineNode);

      for (let k = 0; k < nodes.length - 1; k++) {
        addAllowedEdge(nodes[k], nodes[k + 1]);
      }
    }
  }

  // 3. Horizontal (intra–ring) connectivity.
  for (let ringIndex = 0; ringIndex < grid.length; ringIndex++) {
    let ringCells = grid[ringIndex];

    // Sort cells by the angle of their centroid relative to the maze center.
    ringCells.sort((a, b) => {
      let angleA = Math.atan2(a.centroid.y - center.y, a.centroid.x - center.x);
      let angleB = Math.atan2(b.centroid.y - center.y, b.centroid.x - center.x);
      return angleA - angleB;
    });

    // Connect the last available node of one cell to the first available node of the next cell.
    for (let j = 0; j < ringCells.length; j++) {
      let cellA = ringCells[j];
      let cellB = ringCells[(j + 1) % ringCells.length]; // wrap–around to first cell

      let nodesA = [];
      if (cellA.firstLineNode) nodesA.push(cellA.firstLineNode);
      if (cellA.firstHelperNode) nodesA.push(cellA.firstHelperNode);
      if (cellA.centroidNode) nodesA.push(cellA.centroidNode);
      if (cellA.secondHelperNode) nodesA.push(cellA.secondHelperNode);
      if (cellA.secondLineNode) nodesA.push(cellA.secondLineNode);

      let nodesB = [];
      if (cellB.firstLineNode) nodesB.push(cellB.firstLineNode);
      if (cellB.firstHelperNode) nodesB.push(cellB.firstHelperNode);
      if (cellB.centroidNode) nodesB.push(cellB.centroidNode);
      if (cellB.secondHelperNode) nodesB.push(cellB.secondHelperNode);
      if (cellB.secondLineNode) nodesB.push(cellB.secondLineNode);

      if (nodesA.length > 0 && nodesB.length > 0) {
        addAllowedEdge(nodesA[nodesA.length - 1], nodesB[0]);
      }
    }
  }

  // 4. Vertical (inter–ring) connectivity.
  // For each pair of adjacent rings:
  for (let ringIndex = 0; ringIndex < grid.length - 1; ringIndex++) {
    const innerRing = grid[ringIndex];
    const outerRing = grid[ringIndex + 1];

    // Special case for the innermost ring: simply connect the centroid of each inner cell
    // with the centroid of every outer cell that shares an open wall.
    if (ringIndex === 0) {
      for (let innerCell of innerRing) {
        for (let outerCell of outerRing) {
          const sharedWall = getSharedWall(innerCell, outerCell);
          if (sharedWall && !sharedWall.isExist) {
            if (innerCell.centroidNode && outerCell.centroidNode) {
              addAllowedEdge(innerCell.centroidNode, outerCell.centroidNode);
              outerCell.verticalConnected = true;
            }
          }
        }
      }
    } else {
      // For all other rings, use a polar–angle matching approach.
      const angleTolerance = 0.1; // tolerance in radians; adjust as needed

      // Helper: return outer cells that share an open wall with innerCell.
      function getCandidateOuterCells(innerCell, outerRing) {
        let candidates = [];
        for (let outerCell of outerRing) {
          const sharedWall = getSharedWall(innerCell, outerCell);
          if (sharedWall && !sharedWall.isExist) {
            candidates.push(outerCell);
          }
        }
        return candidates;
      }

      for (let innerCell of innerRing) {
        const candidateOuterCells = getCandidateOuterCells(innerCell, outerRing);
        if (candidateOuterCells.length === 0) continue;

        // Gather candidate nodes from the inner cell.
        let innerCandidates = [];
        if (innerCell.firstHelperNode) innerCandidates.push(innerCell.firstHelperNode);
        if (innerCell.centroidNode) innerCandidates.push(innerCell.centroidNode);
        if (innerCell.secondHelperNode) innerCandidates.push(innerCell.secondHelperNode);

        // For each candidate node in the inner cell…
        for (let innerCandidate of innerCandidates) {
          const innerAngle = Math.atan2(innerCandidate.pos.y - center.y, innerCandidate.pos.x - center.x);
          let bestMatch = null;
          let bestDiff = Infinity;

          // …find the best matching candidate from the outer cells.
          for (let outerCell of candidateOuterCells) {
            let outerCandidates = [];
            if (outerCell.firstHelperNode) outerCandidates.push(outerCell.firstHelperNode);
            if (outerCell.centroidNode) outerCandidates.push(outerCell.centroidNode);
            if (outerCell.secondHelperNode) outerCandidates.push(outerCell.secondHelperNode);
            for (let outerCandidate of outerCandidates) {
              const outerAngle = Math.atan2(outerCandidate.pos.y - center.y, outerCandidate.pos.x - center.x);
              let diff = Math.abs(innerAngle - outerAngle);
              if (diff > Math.PI) diff = 2 * Math.PI - diff;
              if (diff < bestDiff) {
                bestDiff = diff;
                bestMatch = outerCandidate;
              }
            }
          }

          if (bestMatch && bestDiff < angleTolerance) {
            addAllowedEdge(innerCandidate, bestMatch);
          }
        }
      }
    }
  }

  // (Optional: You can remove or adjust any extra rules if not needed.)
}



  // 4. Vertical (inter–ring) connectivity.
  // Instead of flattening, we now use the inherent 2D (ring) structure of the grid.
  // For each pair of adjacent rings, if the number of cells is equal, we connect centroids directly.
  // Otherwise, for each inner cell, we compute its centroid angle relative to the center and then
  // search the outer ring for the helper node (first or second) that lies most radially in line.
// Helper function to compute the perpendicular distance from a point to a line defined by two points.
function pointLineDistance(point, lineStart, lineEnd) {
  // Compute the numerator of the distance formula.
  let numerator = Math.abs(
    (lineEnd.y - lineStart.y) * point.x -
    (lineEnd.x - lineStart.x) * point.y +
    lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  let denominator = Math.sqrt(
    Math.pow(lineEnd.y - lineStart.y, 2) + Math.pow(lineEnd.x - lineStart.x, 2)
  );
  return denominator === 0 ? 0 : numerator / denominator;
}


  function getCurrentGraphNode() {
    const snapThreshold = 20;
    for (let node of graphNodes) {
      if (distanceBetweenPoints(circle, node.pos) < snapThreshold) {
        return node;
      }
    }
    return null;
  }
  let lastGraphNode = null;

/**
 * Chooses the next graph node.
 *
 * If there is only one valid neighbor (after excluding the node we just came from),
 * returns that node immediately—allowing the ball to automatically progress along a corridor.
 * Otherwise, it uses the pointer (mouse/touch) movement direction (via dot products)
 * to select the neighbor that best aligns with the user's movement.
 *
 * @param {Object} currentNode - The current graph node.
 * @param {Object} direction - The pointer movement direction, e.g. { x: dx, y: dy }.
 * @returns {Object|null} The chosen neighbor node, or null if none qualifies.
 */
function chooseNextNode(currentNode, direction) {
  // Get all valid neighbors (neighbors that exist and whose connecting edge isn’t blocked).
  let validNeighbors = currentNode.neighbors
    .map(id => graphNodes.find(n => n.id === id))
    .filter(neighbor => neighbor && !isEdgeBlocked(currentNode, neighbor));

  // Exclude the node we just came from (if there is any) unless it is our only option.
  let nonBackNeighbors = validNeighbors.filter(n => !lastGraphNode || n.id !== lastGraphNode.id);

  // If there is exactly one neighbor (ignoring the previous node), then use it automatically.
  if (nonBackNeighbors.length === 1) {
    // This lets the ball continue moving along a corridor until it reaches a junction.
    return nonBackNeighbors[0];
  }
  // Otherwise, if we have more than one candidate, use them;
  // if none remain after exclusion but validNeighbors is not empty, fall back to validNeighbors.
  let candidates = nonBackNeighbors.length > 0 ? nonBackNeighbors : validNeighbors;

  // Now, if there's more than one candidate, select the one that best aligns with the pointer direction.
  let bestNode = null;
  let bestDot = -Infinity;

  // Normalize the pointer movement direction.
  let desiredMag = Math.hypot(direction.x, direction.y);
  if (desiredMag === 0) return null;
  let normDirection = { x: direction.x / desiredMag, y: direction.y / desiredMag };

  // Evaluate each candidate.
  for (let neighbor of candidates) {
    // Compute vector from currentNode to neighbor.
    let vec = {
      x: neighbor.pos.x - currentNode.pos.x,
      y: neighbor.pos.y - currentNode.pos.y
    };
    let mag = Math.hypot(vec.x, vec.y);
    if (mag === 0) continue;
    let normVec = { x: vec.x / mag, y: vec.y / mag };

    // The dot product represents how well the neighbor aligns with the desired direction.
    let dot = normVec.x * normDirection.x + normVec.y * normDirection.y;
    if (dot > bestDot) {
      bestDot = dot;
      bestNode = neighbor;
    }
  }

  if (bestNode) {
    console.log(`Chosen neighbor ${bestNode.id} with dot product ${bestDot.toFixed(3)}`);
  } else {
    console.log(`No eligible neighbor found from node ${currentNode.id}`);
  }
  return bestNode;
}



document.addEventListener('keydown', (event) => {
    if (gameOver) return; // Stop processing if game is over.
    let direction = null;
    switch (event.key) {
      case 'ArrowUp':    direction = { x: 0, y: -1 }; break;
      case 'ArrowDown':  direction = { x: 0, y: 1 };  break;
      case 'ArrowLeft':  direction = { x: -1, y: 0 }; break;
      case 'ArrowRight': direction = { x: 1, y: 0 };  break;
      default: return;
    }

    let currentNode = getCurrentGraphNode();
    if (!currentNode) {
      // Snap to closest node if none are close.
      let closestNode = graphNodes.reduce((prev, curr) => {
        return (distanceBetweenPoints(circle, curr.pos) < distanceBetweenPoints(circle, prev.pos)) ? curr : prev;
      }, graphNodes[0]);
      circle.x = closestNode.pos.x;
      circle.y = closestNode.pos.y;
      redraw();
      return;
    }

    let nextNode = chooseNextNode(currentNode, direction);
    if (nextNode) {
      // Instead of an immediate jump, animate the ball's movement.
      if (!isPathCollidingWithMaze({ x: circle.x, y: circle.y, radius: circle.radius }, nextNode.pos.x, nextNode.pos.y)) {
        moveBallTo(nextNode);
      }
    }
  });


  // ***** Mouse/Touch Controls *****

// Global variables for pointer-based movement.
let pointerDownPos = null;
let dragging = false;
let currentCandidate = null;
let currentNode = null; // The graph node at which the ball currently sits.
const DRAG_THRESHOLD = 50;  // Pixels required to fully traverse an edge.

// ***** Mouse/Touch Controls for Free Movement *****

// Pointer (mouse/touch) down: start dragging.
function pointerDownHandler(e) {
  e.preventDefault();
  dragging = true;
}

// Pointer move: update ball position following the pointer.
function pointerMoveHandler(e) {
  if (!dragging) return;
  e.preventDefault();
  const coords = getEventCoordinates(e);
  
  // Candidate position from pointer.
  let candidate = { x: coords.x, y: coords.y };

  // Check if moving from the current ball position to candidate collides with maze walls.
  if (!isPathCollidingWithMaze(circle, candidate.x, candidate.y)) {
    // No collision: move ball directly to pointer.
    circle.x = candidate.x;
    circle.y = candidate.y;
  } else {
    // Collision detected: find the furthest allowed position along the pointer's drag direction.
    let newPos = getMaxAllowedPosition({ x: circle.x, y: circle.y }, candidate, circle);
    circle.x = newPos.x;
    circle.y = newPos.y;
  }
  checkFinish(); // Check if the finish node has been reached.
  if(isMovedToCenter){
    circle.x = grid[0][0].centroid.x; 
    circle.y = grid[0][0].centroid.y; 
    isMovedToCenter = false;
    dragging = false;
  }
  redraw();

}

// Pointer up: stop dragging.
function pointerUpHandler(e) {
  if (!dragging) return;
  e.preventDefault();
  dragging = false;
  redraw();
}


// Add the pointer event listeners for mouse and touch.
canvas.addEventListener('mousedown', pointerDownHandler);
canvas.addEventListener('mousemove', pointerMoveHandler);
canvas.addEventListener('mouseup', pointerUpHandler);

canvas.addEventListener('touchstart', pointerDownHandler, { passive: false });
canvas.addEventListener('touchmove', pointerMoveHandler, { passive: false });
canvas.addEventListener('touchend', pointerUpHandler, { passive: false });


// Helper to extract proper coordinates from both mouse and touch events,
// adjusted for any CSS scaling.
function getEventCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    // For touchend or touchcancel.
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  // Adjust for the canvas's internal coordinate system.
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}


/**
 * Helper function to determine the furthest point along the line from `start` to `candidate`
 * that does not cause a collision.
 * We use a binary search approach along the segment.
 *
 * @param {Object} start - The starting point { x, y }.
 * @param {Object} candidate - The desired candidate point { x, y }.
 * @param {Object} ball - The ball object with a `radius` property.
 * @returns {Object} - The furthest valid point { x, y }.
 */
function getMaxAllowedPosition(start, candidate, ball) {
  let lo = 0, hi = 1, allowedT = 0;
  const iterations = 20;
  for (let i = 0; i < iterations; i++) {
    let mid = (lo + hi) / 2;
    let testX = start.x + (candidate.x - start.x) * mid;
    let testY = start.y + (candidate.y - start.y) * mid;
    if (!isPathCollidingWithMaze(ball, testX, testY)) {
      allowedT = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return {
    x: start.x + (candidate.x - start.x) * allowedT,
    y: start.y + (candidate.y - start.y) * allowedT
  };
}

  // ***** Drawing *****

  function drawCircle() {
    let glowRadius = circle.radius * 2; // Glow size
    let gradient = ctx.createRadialGradient(circle.x, circle.y, circle.radius / 2, circle.x, circle.y, glowRadius);
    
    // Create a glowing effect with a gradient
    gradient.addColorStop(0, "gold");
    gradient.addColorStop(0.5, "yellow");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)"); // Fades out

    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.shadowColor = "gold"; // Glow effect
    ctx.shadowBlur = 15; // Amount of glow
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow
}



  async function drawMaze() {
    for (let ring of grid) {
      for (let cell of ring) {
        if (cell.innerArc?.isExist) {
          drawArc(cell.innerArc.centerPoint.x, cell.innerArc.centerPoint.y, cell.innerArc.radius, cell.innerArc.startAngle, cell.innerArc.endAngle);
        }
        cell.outerArcs.forEach(arc => {
          if (arc.isExist) {
            drawArc(arc.centerPoint.x, arc.centerPoint.y, arc.radius, arc.startAngle, arc.endAngle);
          }
        });
        if (cell.firstLine?.isExist) {
          drawLine(cell.firstLine.startPoint, cell.firstLine.endPoint);
        }
        if (cell.secondLine?.isExist) {
          drawLine(cell.secondLine.startPoint, cell.secondLine.endPoint);
        }
        // if (cell.centroid) {
        //   drawDot(cell.centroid, 'red',5);
        // }
      }
    }
  }
  function drawGraph() {
    // Draw edges between nodes.
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 1;
    // To avoid drawing duplicate edges, only draw when neighbor id > current id.
    graphNodes.forEach(node => {
      node.neighbors.forEach(neighborId => {
        let neighbor = graphNodes.find(n => n.id === neighborId);
        if (neighbor && neighbor.id > node.id) {
          ctx.beginPath();
          ctx.moveTo(node.pos.x, node.pos.y);
          ctx.lineTo(neighbor.pos.x, neighbor.pos.y);
          ctx.stroke();
        }
      });
    });

    // Draw each graph node.
    graphNodes.forEach(node => {
      drawDot(node.pos, "purple", 3);
    });

    // Optionally, highlight the current node if the circle is near one.
    let currentNode = getCurrentGraphNode();
    if (currentNode) {
      drawDot(currentNode.pos, "green", 6);
    }
  }
// Easing function for smooth transitions (easeInOutQuad)
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function animateMovement(startPos, endPos, duration = 300, callback) {
    const center = { x: mazeWidth / 2, y: mazeHeight / 2 };
    // Compute the radii for start and end positions relative to the maze center.
    const rStart = Math.hypot(startPos.x - center.x, startPos.y - center.y);
    const rEnd   = Math.hypot(endPos.x - center.x, endPos.y - center.y);
    // Use a tolerance (in pixels) to decide if both points lie on the same ring.
    const sameRingTolerance = 5;
    const isArc = Math.abs(rStart - rEnd) < sameRingTolerance;

    let startTime = null;
    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      let t = Math.min(elapsed / duration, 1); // normalized time [0, 1]
      let easedT = easeInOutQuad(t); // Apply easing

      if (isArc) {
        // Animate along an arc:
        // Use the average radius (since they’re nearly equal) and compute the angles.
        let r = (rStart + rEnd) / 2;
        let startAngle = Math.atan2(startPos.y - center.y, startPos.x - center.x);
        let endAngle = Math.atan2(endPos.y - center.y, endPos.x - center.x);
        // Normalize the angular difference for the shortest rotation.
        let angleDiff = endAngle - startAngle;
        while (angleDiff > Math.PI)  angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        let currentAngle = startAngle + angleDiff * easedT;
        circle.x = center.x + r * Math.cos(currentAngle);
        circle.y = center.y + r * Math.sin(currentAngle);
      } else {
        // Animate linearly (for radial or other moves):
        circle.x = startPos.x + (endPos.x - startPos.x) * easedT;
        circle.y = startPos.y + (endPos.y - startPos.y) * easedT;
      }

      redraw();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (callback) callback();
        checkFinish(); // Check if the finish node has been reached.
      }
    }
    requestAnimationFrame(animate);
  }


  function moveBallTo(nextNode) {
    const startPos = { x: circle.x, y: circle.y };
    const endPos = { x: nextNode.pos.x, y: nextNode.pos.y };

    animateMovement(startPos, endPos, 300, () => {
      lastGraphNode = nextNode; // Update lastGraphNode here.
    });
  }



// This function checks if the ball is near a finish node.
// If so, it stops the game.
function checkFinish() {
    // Look for a graph node flagged as finish.
    const finishNode = graphNodes.find(node => node.isFinish);
    if (finishNode && distanceBetweenPoints({ x: circle.x, y: circle.y }, finishNode.pos) < 10) {
      gameOver = true;
      finishGame();
    }
  }
  // === HELPER FUNCTIONS ===

// Returns true if p1 and p2 lie on nearly the same radial line from center
function isOnSameRadialLine(p1, p2, center, toleranceDegrees = 5) {
  let angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  let angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff < toleranceDegrees * (Math.PI / 180);
}

// (Optional) Returns true if p2 is further from center than p1.
function isRadiallyOutward(p1, p2, center) {
  return Math.hypot(p2.x - center.x, p2.y - center.y) >
         Math.hypot(p1.x - center.x, p1.y - center.y);
}
function updateHUD() {
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('timer').textContent = `Time: ${Math.ceil(timeRemaining / 1000)}s`;
}

// Update the game by redrawing everything
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  //drawGraph();
  drawGameObjects(); // Draw rewards & punishments
  drawCircle();
  checkCollisions(); // Check if ball collects any object
  updateGameObjects(); // Handle fading animations
}

// ===== Initialization =====

// Instead of starting immediately, we now wait until all images are loaded.
preloadImages(() => {
  // Now that images are ready, initialize the maze/game.
  createConcentricCircles(300, 300);
  findNeighbors();
  generateMaze();
  buildGraph();
  if (grid[0] && grid[0][0] && grid[0][0].centroid) {
    circle.x = grid[0][0].centroid.x;
    circle.y = grid[0][0].centroid.y;
  }  
  breakRandomOuterWall();
  generateGameObjects();
  startTimer();
  redraw();
});


// Call updateHUD() whenever score or time changes
function startTimer() {
  clearInterval(intervalId); // Clear any previous intervals

  intervalId = setInterval(() => {
      timeRemaining -=1000;
      timeRemaining = Math.max(timeRemaining, 0); // Ensure it doesn't go negative

      if (timeRemaining <= 0) {
          clearInterval(intervalId);
          timeOut();
      }

      updateHUD(); // Update score and timer display
  }, 1000);
}


function extendTime(extraTime) {
  // extraTime is positive to add time, negative to subtract time.
  // You might want to clamp timeRemaining to a minimum value (e.g., 0)
  timeRemaining = Math.max(timeRemaining + extraTime, 0);
  startTimer(); // Restart the timer with updated time
}
function finishGame() {
  clearInterval(intervalId);
  // Save score and remaining time in localStorage
  localStorage.setItem("score", score);
  window.location.href = 'outro.html';
}

function timeOut() {
  // Save score and remaining time in localStorage
  localStorage.setItem("score", score);
  window.location.href = 'timeout.html';
}

// Update score when player earns points
function addScore(points) {
  score += points;
  updateHUD();
}
