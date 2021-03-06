import React from 'react';
import Sketch from "react-p5";

class Boids extends React.Component {

    constructor(props) {
      super(props);
      this.p5Setup = this.p5Setup.bind(this);
      this.p5Draw = this.p5Draw.bind(this);
      this.computeAlignmentVelocity = this.computeAlignmentVelocity.bind(this);
      this.computeCohesionVelocity = this.computeCohesionVelocity.bind(this);
      this.computeLeaderAttraction = this.computeLeaderAttraction.bind(this);
      this.computeSeparationVelocity = this.computeSeparationVelocity.bind(this);
  
      this.normalize = this.normalize.bind(this);
      this.boids = [];
      this.alignmentWeight = 1.5;
      this.cohesionWeight = 0.5;
      this.separationWeight = 0.6;
      this.minNeighborDistance = 200;
      this.boidCount = 500;
      this.leaderPercentage = 0.2;
      this.wrapAround = true;
    }
  
    p5Setup(p5, canvasParentRef) {
      p5.createCanvas(this.props.width, this.props.height).parent(canvasParentRef);
  
      for (var i = 0; i < this.boidCount; i++) {
        var b = {
          id: i,
          isLeader: (Math.random() < this.leaderPercentage),
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
  
    computeLeaderAttraction(
      targetBoid = {
        id: 0,
        isLeader: false,
        x: 0.0,
        y: 0.0,
        vx: 0.0,
        vy: 0.0
      },
      mouseX = 0.0,
      mouseY = 0.0) {
      if (targetBoid.isLeader) {
        return this.normalize(
          (mouseX - targetBoid.x),
          (mouseY - targetBoid.y),
          this.attractionWeight);
      }
      return { dx: 0, dy: 0 };
    }
  
    p5Draw(p5) {
      p5.background(0);
      p5.stroke(p5.color(255));
      p5.strokeWeight(2);
  
      for (var i = 0; i < this.boids.length; i++) {
        // draw boid
        p5.point(this.boids[i].x, this.boids[i].y);
        console.log(this.boids[i]);
        // update boids
        var velocityUpdate = [
          this.computeAlignmentVelocity(this.boids[i], this.boids),
          this.computeCohesionVelocity(this.boids[i], this.boids),
          this.computeSeparationVelocity(this.boids[i], this.boids)//,
          //this.computeLeaderAttraction(this.boids, p5.mouseX, p5.mouseY)
        ].reduce(
          function (acc = { dx: 0.0, dy: 0.0 }, cv = { dx: 0.0, dy: 0.0 }) {
            return { dx: (acc.dx + cv.dx), dy: (acc.dy + cv.dy) };
          },
          { dx: 0.0, dy: 0.0 });
        
        velocityUpdate = this.normalize(velocityUpdate.dx, velocityUpdate.dy, 3);
  
        this.boids[i].vx = (0.5 * this.boids[i].vx) + (0.5 * velocityUpdate.dx);
        this.boids[i].vy = (0.5 * this.boids[i].vy) + (0.5 * velocityUpdate.dy);
  
        //var norm = Math.sqrt((this.boids[i].vx * this.boids[i].vx) + (this.boids[i].vy * this.boids[i].vy));
        //this.boids[i].vx = this.boids[i].vx / norm;
        //this.boids[i].vy = this.boids[i].vy / norm;
  
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
        <div>
          <Sketch setup={this.p5Setup} draw={this.p5Draw} />
        </div>);
    }
  }

  export default Boids;