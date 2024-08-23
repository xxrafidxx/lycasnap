"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import Link from 'next/link';

export default function FaceDetection() {
  // Refs for the video and canvas elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State for the face detector and canvas context
  const [faceDetector, setFaceDetector] = useState(null);
  const [ctx, setCtx] = useState(null);

  // Effect hook to initialize the face detector when the component mounts
  useEffect(() => {
    const initializeFaceDetector = async () => {
      try {
        // Load the necessary assets for the face detector
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // Create a face detector instance with the specified options
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/models/blaze_face_short_range.tflite`,
            delegate: 'GPU',  // Use GPU for faster processing
          },
          runningMode: 'VIDEO',  // Set mode to video for continuous detection
        });

        // Set the detector instance in state
        setFaceDetector(detector);
        console.log("FaceDetector initialized");
      } catch (error) {
        console.error("Error initializing FaceDetector:", error);
      }
    };

    // Call the initialization function
    initializeFaceDetector();

    // Initialize the canvas context if the canvas ref is available
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      setCtx(context);
      console.log("Canvas context initialized:", context);
    }
  }, []);

  // Effect hook to start the webcam once the face detector is ready
  useEffect(() => {
    if (faceDetector) {
      console.log("FaceDetector is ready, starting webcam...");
      startWebcam();
    }
  }, [faceDetector]);

  // Function to start the webcam and stream video to the video element
  const startWebcam = async () => {
    if (!faceDetector) {
      console.error('Face Detector is not yet initialized.');
      return;
    }

    try {
      // Request access to the user's webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.style.display = 'block';

      // Once the video data is loaded, start the face detection loop
      videoRef.current.addEventListener('loadeddata', () => {
        console.log('Video loaded, starting detection');
        predictWebcam();
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  // Function to continuously detect faces in the video stream
  const predictWebcam = async () => {
    let lastVideoTime = -1;

    const detectFaces = async () => {
      const startTimeMs = performance.now();

      // Check if the video time has changed (i.e., the video is playing)
      if (videoRef.current && videoRef.current.currentTime !== lastVideoTime) {
        lastVideoTime = videoRef.current.currentTime;

        // Run face detection on the current video frame
        const results = await faceDetector.detectForVideo(
          videoRef.current,
          startTimeMs
        );

        // If faces are detected, draw bounding boxes around them
        if (results.detections.length > 0) {
          const detection = results.detections[0];

          // Calculate the bounding box dimensions relative to the canvas size
          const x = detection.boundingBox.originX / videoRef.current.videoWidth * canvasRef.current.width;
          const y = detection.boundingBox.originY / videoRef.current.videoHeight * canvasRef.current.height;
          const width = detection.boundingBox.width / videoRef.current.videoWidth * canvasRef.current.width;
          const height = detection.boundingBox.height / videoRef.current.videoHeight * canvasRef.current.height;

          const confidence = (detection.categories[0].score * 100).toFixed(2);  // Get the confidence score

          // Clear the canvas and draw the detected bounding box and confidence score
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.strokeStyle = '#F16B5E';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = '#F16B5E';
          ctx.font = '14px Arial';
          ctx.fillText(`Confidence: ${confidence}%`, x, y > 20 ? y - 10 : y + 20);

          console.log(`Drew detection box at [${x}, ${y}] with dimensions [${width}, ${height}] and confidence ${confidence}%`);
        } else {
          console.log('No detections in this frame.');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);  // Clear the canvas if no detections
        }
      }

      // Schedule the next frame for detection
      window.requestAnimationFrame(detectFaces);
    };

    detectFaces();
  };

  // Function to take a snapshot of the current video frame and download it as an image
  const takeSnapshot = () => {
    const snapshotCanvas = document.createElement('canvas');
    const context = snapshotCanvas.getContext('2d');

    // Set the canvas dimensions to match the video/canvas
    snapshotCanvas.width = canvasRef.current.width;
    snapshotCanvas.height = canvasRef.current.height;

    // Copy the video frame and any annotations to the snapshot canvas
    context.drawImage(canvasRef.current, 0, 0);

    // Convert the canvas to a data URL and download it as a PNG file
    const dataUrl = snapshotCanvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'snapshot.png';
    link.click();
  };

  // Function to navigate to the home page
  const goHome = () => router.push('/');

  return (
    <div className='relative overflow-hidden flex items-center justify-center h-screen bg-[#F16B5E] cursor-default'>
      {/* Particle Animation Background */}
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div key={i} className={`particle-animation particle-${i % 5}`}></div>
        ))}
      </div>

      <div className='relative z-10 text-center'>
        {/* Title */}
        <h1 className="text-xl md:text-2xl text-white tracking-wider mb-10">
          Face Detection
        </h1>

        <div className='flex flex-col space-y-5 items-center'>
          {/* Video and Canvas for face detection */}
          <div id="liveView" style={{ position: 'relative', display: 'inline-block' }}>
            <video
              ref={videoRef}
              id="webcam"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                position: 'relative',
                zIndex: 5,
              }}
              autoPlay
            ></video>
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
              }}
            ></canvas>
          </div>

          {/* Buttons for taking a snapshot and going home */}
          <div className='flex flex-col md:flex-row space-x-0 md:space-x-5'>
            <button
              onClick={takeSnapshot}
              className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out mt-5"
              style={{ boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)' }}
            >
              Take Snapshot
            </button>
            <Link
              href='/'
              className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out mt-5"
              style={{ boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)' }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
