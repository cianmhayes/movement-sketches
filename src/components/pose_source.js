import React from 'react';
import * as posenet from '@tensorflow-models/posenet';

class PoseSource extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        running: false,
        flipHorizontal: true,
        showVideo: true,
        markupVideo: true
      };
  
      this.startCamera = this.startCamera.bind(this);
      this.detectPoses = this.detectPoses.bind(this);
  
      this.videoWidth = this.props.videoWidth;
      this.videoHeight = this.props.videoHeight ? this.props.videoHeight : this.videoWidth;
    }
  
    componentDidMount(){
      this.startCamera();
      
    }

    componentWillUnmount(){
        this.mediaStream.getTracks().forEach(function(track) {
            track.stop();
          });
    }
  
    async startCamera() {
  
      this.poseEstimator = await posenet.load(
        {
          architecture: "MobileNetV1",
          outputStride: 16,
          inputResolution:
          {
            width: this.videoWidth,
            height: this.videoHeight
          },
          multiplier: 0.75
        });
      var constraints = { audio: false, video: { width: this.videoWidth, height: this.videoHeight } };
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = document.getElementById("videoElement");
      this.videoElement.width = this.videoWidth;
      this.videoElement.height = this.videoHeight;
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.onloadeddata = this.detectPoses;
  
      if (this.props.showVideo) {
        this.outputCanvas = document.getElementById("videoOutput");
        this.outputCanvas.width = this.videoWidth;
        this.outputCanvas.height = this.videoHeight;
        this.outputCanvasContext = this.outputCanvas.getContext("2d");
      }
  
      this.setState({ running: true });
    }
  
    async detectPoses() {
      const pose = await this.poseEstimator.estimateSinglePose(this.videoElement, {
        flipHorizontal: this.state.flipHorizontal,
        decodingMethod: 'single-person'
      });
      if (this.props.onPoseUpdated) {
        this.props.onPoseUpdated(pose);
      }
      if (this.props.showVideo) {
        this.outputCanvasContext.clearRect(0, 0, this.videoWidth, this.videoHeight);
        this.outputCanvasContext.save();
        if (this.props.flipHorizontal) {
          this.outputCanvasContext.scale(-1, 1);
          this.outputCanvasContext.translate(-this.videoWidth, 0);
        }
        this.outputCanvasContext.drawImage(this.videoElement, 0, 0, this.videoWidth, this.videoHeight);
        this.outputCanvasContext.restore();
        if (this.props.markupVideo) {
          for (var i = 0; i < pose.keypoints.length; i++) {
            if (pose.keypoints[i].score > 0.4) {
              this.outputCanvasContext.beginPath();
              this.outputCanvasContext.arc(
                pose.keypoints[i].position.x,
                pose.keypoints[i].position.y,
                3,
                0,
                2 * Math.PI);
              this.outputCanvasContext.fillStyle = "aqua";
              this.outputCanvasContext.fill();
            }
          }
          const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, 0.4);
          for(var j = 0; j < adjacentKeyPoints.length; j++){
            this.outputCanvasContext.beginPath();
            this.outputCanvasContext.moveTo(adjacentKeyPoints[j][0].position.x, adjacentKeyPoints[j][0].position.y);
            this.outputCanvasContext.lineTo(adjacentKeyPoints[j][1].position.x, adjacentKeyPoints[j][1].position.y);
            this.outputCanvasContext.lineWidth = 2;
            this.outputCanvasContext.strokeStyle = "aqua";
            this.outputCanvasContext.stroke();
          }
        }
      }

      if (this.state.running)
      {
        requestAnimationFrame(this.detectPoses);
      }
    }
  
    render() {
      return (
        <div>
          <div>
            <video id="videoElement" autoPlay={true} playsInline style={{ display: "none" }} />
            <canvas id="videoOutput" />
          </div>
        </div>
      );
    }
  }
  
  export default PoseSource;