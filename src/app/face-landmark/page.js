"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import Link from "next/link";

export default function Home() {
  // Refs to the video and canvas elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State for the FaceLandmarker, canvas context, and webcam status
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);

  // Initialize the FaceLandmarker when the component mounts
  useEffect(() => {
    initializeFaceLandmarker();
  }, []);

  // Start the webcam once the FaceLandmarker is initialized
  useEffect(() => {
    if (faceLandmarker) {
      startWebcam();
    }
  }, [faceLandmarker]);

  // Function to initialize the FaceLandmarker and set up the canvas context
  const initializeFaceLandmarker = async () => {
    try {
      // Load the necessary files for the FaceLandmarker
      const filesetResolver = await FilesetResolver.forVisionTasks("/models/wasm");

      // Create the FaceLandmarker instance with the specified options
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task", // Path to the model file
          delegate: "GPU", // Use GPU for faster processing
        },
        outputFaceBlendshapes: true, // Enable face blendshapes output
        runningMode: "VIDEO", // Set running mode to video for real-time processing
        numFaces: 1, // Detect one face at a time
      });

      // Save the FaceLandmarker instance to the state
      setFaceLandmarker(faceLandmarkerInstance);
      console.log("FaceLandmarker initialized:", faceLandmarkerInstance);

      // Initialize the canvas context
      if (canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        setCtx(context);
        console.log("Canvas context initialized:", context);
      }
    } catch (error) {
      console.error("Error initializing FaceLandmarker:", error);
    }
  };

  // Function to start the webcam and begin face detection
  const startWebcam = async () => {
    console.log("Attempting to start webcam...");

    // Check if the FaceLandmarker is ready
    if (!faceLandmarker) {
      alert("Face Landmarker is still loading. Please try again.");
      console.error("Face Landmarker not initialized.");
      return;
    }

    const constraints = {
      video: true, // Request access to the user's webcam
    };

    try {
      // Get the video stream from the user's webcam
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream; // Set the video source to the webcam stream
      videoRef.current.style.display = "block"; // Show the video element
      setWebcamRunning(true); // Update the state to indicate that the webcam is running
      console.log("Webcam stream started.");

      // Start face detection once the video data is loaded
      videoRef.current.addEventListener("loadeddata", () => {
        console.log("Video data loaded, starting detection...");
        setDetectionRunning(true); // Set detection running state to true
        detect(); // Start the detection loop
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  // Function to stop the webcam and face detection
  const stopWebcam = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks (video and audio)
    }
    videoRef.current.style.display = "none"; // Hide the video element
    setWebcamRunning(false); // Update the state to indicate that the webcam is stopped
    setDetectionRunning(false); // Stop the detection loop
    console.log("Webcam stopped.");
  };

  // Function to draw the detected face landmarks on the canvas
  const drawLandmarks = (landmarks, ctx, color) => {
    ctx.fillStyle = color; // Set the color for the landmarks
    ctx.lineWidth = 1; // Set the line width for drawing

    // Loop through each landmark and draw a point on the canvas
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvasRef.current.width; // Scale x-coordinate to canvas width
      const y = landmark.y * canvasRef.current.height; // Scale y-coordinate to canvas height
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 1 * Math.PI); // Draw a small circle at the landmark position
      ctx.fill(); // Fill the circle with the specified color
    });
  };

  // Function to continuously detect face landmarks in the video stream
  const detect = async () => {
    // Check if the necessary elements and states are ready for detection
    if (!faceLandmarker || !ctx || !videoRef.current || !detectionRunning) {
      console.log("Detection prerequisites not met or detection stopped.");
      return;
    }

    // Ensure the video and canvas have valid dimensions
    if (
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0 ||
      canvasRef.current.width === 0 ||
      canvasRef.current.height === 0
    ) {
      console.log("Invalid video or canvas dimensions.");
      return;
    }

    // Run the face landmark detection for the current video frame
    const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());

    // Clear the canvas before drawing new landmarks
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // If landmarks are detected, draw them on the canvas
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      results.faceLandmarks.forEach((landmarks) => {
        console.log("Detected landmarks:", landmarks);
        drawLandmarks(landmarks, ctx, "#ffffff"); // Draw the landmarks in white
      });
    } else {
      console.log("No landmarks detected in this frame.");
    }

    // Continue the detection loop if the webcam is still running
    if (webcamRunning) {
      requestAnimationFrame(detect); // Schedule the next detection
    }
  };

  // Function to take a snapshot of the current video frame and landmarks
  const takeSnapshot = () => {
    if (!canvasRef.current || !ctx) return;

    // Redraw the video frame and the landmarks on the canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Draw landmarks again before taking the snapshot
    if (faceLandmarker) {
      const results = faceLandmarker.detectForVideo(
        videoRef.current,
        performance.now()
      );

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        results.faceLandmarks.forEach((landmarks) => {
          drawLandmarks(landmarks, ctx, "#00FF00"); // Draw the landmarks in green for the snapshot
        });
      }
    }

    // Convert the canvas content to a PNG image and trigger a download
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "snapshot.png"; // Set the filename for the snapshot
    link.click(); // Trigger the download
  };

  // Start the detection loop if detectionRunning is true
  useEffect(() => {
    if (detectionRunning) {
      detect();
    }
  }, [detectionRunning]);

  return (
    <div className="relative overflow-hidden flex items-center justify-center h-screen bg-[#F16B5E] cursor-default">
      {/* Particle Animation Background */}
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div key={i} className={`particle-animation particle-${i % 5}`}></div>
        ))}
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        {/* Title */}
        <h1 className="text-xl md:text-2xl text-white tracking-wider mb-10">
          Face Landmarker
        </h1>
        <div className="relative inline-block">
          {/* Video element for webcam feed */}
          <video
            ref={videoRef}
            id="webcam"
            style={{
              display: "none",
              width: "100%",
              height: "auto",
              position: "relative",
              zIndex: 5,
            }}
            autoPlay
            playsInline
          ></video>
          {/* Canvas element for drawing face landmarks */}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
              pointerEvents: "none",
              width: "100%",
              height: "100%",
            }}
          ></canvas>
        </div>
        <div className='flex flex-col md:flex-row space-x-0 md:space-x-5'>
          {/* Button to take a snapshot */}
          <button
            onClick={takeSnapshot}
            className="bg-[#F16B5E] text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out mt-5"
            style={{ boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.2)' }}
          >
            Take Snapshot
          </button>
          {/* Link to go back to the home page */}
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
  );
}
