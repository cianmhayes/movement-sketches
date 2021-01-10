import React from 'react';
import Sketch from "react-p5";

class ShapedBoids extends React.Component {

  constructor(props) {
    super(props);
    this.p5Setup = this.p5Setup.bind(this);
    this.p5Draw = this.p5Draw.bind(this);

    this.handleClick = this.handleClick.bind(this);
    this.segmentIndex = 0;

    this.computeAlignmentVelocity = this.computeAlignmentVelocity.bind(this);
    this.computeCohesionVelocity = this.computeCohesionVelocity.bind(this);
    this.computePheromoneAttraction = this.computePheromoneAttraction.bind(this);
    this.computeSeparationVelocity = this.computeSeparationVelocity.bind(this);
    this.computeBoundaryVelocity = this.computeBoundaryVelocity.bind(this);

    this.normalize = this.normalize.bind(this);
    this.boids = [];
    this.alignmentWeight = 1.5;
    this.cohesionWeight = 0.5;
    this.separationWeight = 0.4;
    this.peheromoneWeight = 1.0;
    this.boundaryWeight = 10.0;
    this.minNeighborDistance = 200;
    this.boidCount = 500;
    this.leaderPercentage = 0.2;
    this.wrapAround = false;

    this.margin = 0.05;

  }

  handleClick() {
    this.segmentIndex = (this.segmentIndex + 1) % 2;
  }

  p5Setup(p5, canvasParentRef) {
    p5.createCanvas(this.props.width, this.props.height).parent(canvasParentRef);

    for (var i = 0; i < this.boidCount; i++) {
      var b = {
        id: i,
        isLeader: (Math.random() < this.leaderPercentage),
        pheromoneDensity: 0.0,
        x: (Math.random() * this.props.width),
        y: (Math.random() * this.props.height),
        vx: (Math.random() * 0.0),
        vy: (Math.random() * 0.0)
      }
      console.log(b);
      this.boids.push(b);
    }
    console.log(Math.random());
    console.log(this.boids);
  }

  normalize(dx = 0.0, dy = 0.0, weight = 0.0) {
    var magnitude = Math.sqrt((dx * dx) + (dy * dy));
    return {
      dx: magnitude === 0.0 ? 0.0 : (dx / magnitude) * weight,
      dy: magnitude === 0.0 ? 0.0 : (dy / magnitude) * weight
    };
  }

  computeCohesionVelocity(
    targetBoid = { id: 0, x: 0.0, y: 0.0, vx: 0.0, vy: 0.0 },
    otherBoids = [{ id: 0, x: 0.0, y: 0.0, vx: 0.0, vy: 0.0 }]) {
    var sum = otherBoids.reduce(
      function (accumulator, currentValue) {
        return { x: accumulator.x + currentValue.x, y: accumulator.y + currentValue.y };
      },
      { x: 0.0, y: 0.0 });
    var center = { x: sum.x / otherBoids.length, y: sum.y / otherBoids.length };
    //console.log(`id: ${targetBoid.id} Center: ${center.x}, ${center.y}  Target: ${targetBoid.x}, ${targetBoid.y}`);
    return this.normalize(
      (center.x - targetBoid.x),
      (center.y - targetBoid.y),
      this.cohesionWeight);
  }

  computeSeparationVelocity(
    targetBoid = {
      id: 0,
      isLeader: false,
      x: 0.0,
      y: 0.0,
      vx: 0.0,
      vy: 0.0
    },
    otherBoids = [
      {
        id: 0,
        x: 0.0,
        y: 0.0,
        vx: 0.0,
        vy: 0.0
      }]) {
    var minNeighborDistance = this.minNeighborDistance;
    var avoidance = otherBoids.reduce(
      function (
        acc = {
          totalDX: 0.0,
          totalDY: 0.0,
          count: 0
        },
        cv = {
          id: 0,
          x: 0.0,
          y: 0.0,
          vx: 0.0,
          vy: 0.0
        }) {
        var dx = cv.x - targetBoid.x;
        var dy = cv.y - targetBoid.y;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        if (distance < minNeighborDistance && cv.id !== targetBoid.id) {
          return {
            totalDX: acc.totalDX - dx,
            totalDY: acc.totalDY - dx,
            count: acc.count + 1
          };
        }
        return acc;
      },
      {
        totalDX: 0.0,
        totalDY: 0.0,
        count: 0
      });
    //console.log(`id: ${targetBoid.id} Avoidance: ${avoidance.totalDX}, ${avoidance.totalDY}, ${avoidance.count}  Target: ${targetBoid.x}, ${targetBoid.y}`);
    if (avoidance.count === 0) {
      return { dx: 0.0, dy: 0.0 };
    }
    var leaderWeight = targetBoid.isLeader ? 10.0 : 1.0;
    return this.normalize(
      (avoidance.totalDX / avoidance.count),
      (avoidance.totalDY / avoidance.count),
      this.separationWeight * leaderWeight);
  }

  computeAlignmentVelocity(
    targetBoid = { id: 0, x: 0.0, y: 0.0, vx: 0.0, vy: 0.0 },
    otherBoids = [{ id: 0, x: 0.0, y: 0.0, vx: 0.0, vy: 0.0 }]) {
    var sum = otherBoids.reduce(
      function (accumulator, currentValue) {
        return { vx: accumulator.vx + currentValue.vx, vy: accumulator.vy + currentValue.vy };
      },
      { vx: 0.0, vy: 0.0 });
    var avg = { vx: sum.vx / otherBoids.length, vy: sum.vy / otherBoids.length };
    //console.log(`id: ${targetBoid.id} Alignment: ${avg.vx}, ${avg.vy} Target: ${targetBoid.x}, ${targetBoid.y}`);
    return this.normalize(
      (targetBoid.vx - avg.vx),
      (targetBoid.vy - avg.vy),
      this.alignmentWeight);
  }

  computeBoundaryVelocity(
    targetBoid = { id: 0, x: 0.0, y: 0.0, vx: 0.0, vy: 0.0 }) {
    var dx = 0.0;
    var dy = 0.0;
    if (targetBoid.x <= (this.props.width * this.margin)) {
      dx = 1.0;
    } else if (targetBoid.x >= (this.props.width * (1 - this.margin))) {
      dx = -1.0;
    }

    if (targetBoid.y <= (this.props.height * this.margin)) {
      dy = 1.0;
    } else if (targetBoid.y >= (this.props.height * (1 - this.margin))) {
      dy = -1.0;
    }

    if (dx !== 0.0 || dy !== 0.0) {
      return this.normalize(dx, dy, this.boundaryWeight);
    }
    return { dx: 0.0, dy: 0.0 };
  }

  computePheromoneAttraction(
    targetBoid = {
      id: 0,
      isLeader: false,
      pheromoneDensity: 0.0,
      x: 0.0,
      y: 0.0,
      vx: 0.0,
      vy: 0.0
    },
    otherBoids = [
      {
        id: 0,
        isLeader: false,
        pheromoneDensity: 0.0,
        x: 0.0,
        y: 0.0,
        vx: 0.0,
        vy: 0.0
      }]) {
    var nearby_boids = otherBoids.filter(
      function (b) {
        var dx = b.x - targetBoid.x;
        var dy = b.y - targetBoid.y;
        return Math.sqrt((dx * dx) + (dy * dy)) < 100;
      });
    var aggregates = nearby_boids.reduce(
      function (acc, cv) {
        return {
          totalPheromone: (acc.totalPheromone + cv.pheromoneDensity),
          totalDX: (acc.totalDX + (cv.x * cv.pheromoneDensity)),
          totalDY: (acc.totalDY + (cv.y * cv.pheromoneDensity))
        }
      },
      { totalPheromone: 0.0, totalDX: 0.0, totalDY: 0.0 });
    if ((aggregates.totalPheromone / nearby_boids.length) < targetBoid.pheromoneDensity) {
      return this.normalize(
        aggregates.totalDX / aggregates.totalPheromone,
        aggregates.totalDY / aggregates.totalPheromone,
        this.peheromoneWeight);
    }
    return { dx: 0, dy: 0 };
  }

  p5Draw(p5) {
    p5.background(0);
    p5.stroke(p5.color(255));
    p5.strokeWeight(2);

    var focalX = (this.props.width / 2) - 150;
    var focalY = this.props.height / 2;
    if (this.segmentIndex === 1) {
      focalX += 300;
    }
    console.log(`${focalX}, ${focalY}`)

    for (var j = 0; j < this.boids.length; j++) {
      var dx = this.boids[j].x - focalX;
      var dy = this.boids[j].y - focalY;
      var distance = Math.sqrt((dx*dx)+(dy*dy));
      this.boids[j].pheromoneDensity = Math.max((300 - distance) / 300, 0.0);
    }

    for (var i = 0; i < this.boids.length; i++) {
      // draw boid
      p5.point(this.boids[i].x, this.boids[i].y);
      //console.log(this.boids[i]);
      // update boids
      var velocityUpdate = [
        this.computeAlignmentVelocity(this.boids[i], this.boids),
        this.computeCohesionVelocity(this.boids[i], this.boids),
        this.computeSeparationVelocity(this.boids[i], this.boids),
        this.computePheromoneAttraction(this.boids[i], this.boids),
        this.computeBoundaryVelocity(this.boids[i])
      ].reduce(
        function (acc = { dx: 0.0, dy: 0.0 }, cv = { dx: 0.0, dy: 0.0 }) {
          return { dx: (acc.dx + cv.dx), dy: (acc.dy + cv.dy) };
        },
        { dx: 0.0, dy: 0.0 });

      velocityUpdate = this.normalize(velocityUpdate.dx, velocityUpdate.dy, 3);

      this.boids[i].vx = (0.5 * this.boids[i].vx) + (0.5 * velocityUpdate.dx);
      this.boids[i].vy = (0.5 * this.boids[i].vy) + (0.5 * velocityUpdate.dy);

      this.boids[i].x += this.boids[i].vx;
      this.boids[i].y += this.boids[i].vy;

      if (this.wrapAround) {
        if (this.boids[i].x < 0) {
          this.boids[i].x += this.props.width;
        }
        this.boids[i].x = this.boids[i].x % this.props.width;

        if (this.boids[i].y < 0) {
          this.boids[i].y += this.props.height;
        }
        this.boids[i].y = this.boids[i].y % this.props.height;
      }

    }
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <Sketch setup={this.p5Setup} draw={this.p5Draw} />
      </div>);
  }
}

export default ShapedBoids;