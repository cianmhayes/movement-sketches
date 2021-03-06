import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import Sketch from "react-p5";
import * as posenet from '@tensorflow-models/posenet';

import Boids from './boids';
import ShapedBoids from './shaped_boids';
import PoseSource from './components/pose_source';

import './App.css';

class ProcesingTest extends React.Component {

  constructor(props) {
    super(props);
    this.p5Setup = this.p5Setup.bind(this);
    this.p5Draw = this.p5Draw.bind(this);
    this.notifyNewPose = this.notifyNewPose.bind(this);
    this.currentPose = { keypoints: [] };
    this.processingScale = this.props.processingScale ? this.props.processingScale : 1;
  }

  notifyNewPose(pose) {
    this.currentPose = pose;
  }

  p5Setup(p5, canvasParentRef) {
    p5.createCanvas(this.props.videoWidth * this.processingScale, this.props.videoHeight * this.processingScale).parent(canvasParentRef);
  }

  p5Draw(p5) {
    p5.background(0);

    p5.stroke(p5.color('aqua'));
    p5.strokeWeight(3);
    if (this.currentPose.keypoints.length > 0) {
      const adjacentKeyPoints = posenet.getAdjacentKeyPoints(this.currentPose.keypoints, 0.4);
      for (var i = 0; i < adjacentKeyPoints.length; i++) {
        p5.line(
          adjacentKeyPoints[i][0].position.x * this.processingScale,
          adjacentKeyPoints[i][0].position.y * this.processingScale,
          adjacentKeyPoints[i][1].position.x * this.processingScale,
          adjacentKeyPoints[i][1].position.y * this.processingScale);
      }
    }

    p5.strokeWeight(7);
    for (var j = 0; j < this.currentPose.keypoints.length; j++) {
      if (this.currentPose.keypoints[j].score > 0.4) {
        p5.point(
          this.currentPose.keypoints[j].position.x * this.processingScale,
          this.currentPose.keypoints[j].position.y * this.processingScale);
      }
    }
  }

  render() {
    return (
      <div>
        <PoseSource
          showVideo={this.props.showVideo ? this.props.showVideo : false}
          markupVideo={this.props.showVideo ? this.props.showVideo : false}
          flipHorizontal
          videoWidth={this.props.videoWidth}
          videoHeight={this.props.videoHeight}
          onPoseUpdated={this.notifyNewPose} />
        <Sketch setup={this.p5Setup} draw={this.p5Draw} />
      </div>);
  }
}

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/basic-with-video">
            <ProcesingTest showVideo videoWidth={1050} videoHeight={700} />
          </Route>
          <Route path="/basic-without-video">
            <ProcesingTest videoWidth={1050} videoHeight={700} processingScale={2} />
          </Route>
          <Route path="/basic-boids">
            <Boids width={1050} height={700} />
          </Route>
          <Route path="/shape-boids">
            <ShapedBoids width={1050} height={700} />
          </Route>
          <Route path="/">
            <p>
              <Link to="/basic-with-video">Basic visualization and source video together.</Link>
            </p>
            <p>
              <Link to="/basic-without-video">Basic visualization alone.</Link>
            </p>
            <p>
              <Link to="/basic-boids">Birds flocking.</Link>
            </p>
            <p>
              <Link to="/shape-boids">Birds flocking with shapes.</Link>
            </p>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
