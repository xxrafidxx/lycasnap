"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

export default function HairSegmenterWithBlur() {
  // Refs to the video and canvas elements
  const videoRef = useRef(null);
  const segmentationCanvasRef = useRef(null);
  const blurCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);

  // State for the ImageSegmenter and webcam status
  const [imageSegmenter, setImageSegmenter] = useState(null);
  const [segmentationCtx, setSegmentationCtx] = useState(null);
  const [blurCtx, setBlurCtx] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // State for captured image
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCaptured, setShowCaptured] = useState(false);

  // Additional settings
  const [colorThreshold, setColorThreshold] = useState(100); // For color-based detection
  const [blurAmount, setBlurAmount] = useState(10); // Blur intensity

  // Initialize the ImageSegmenter when the component mounts
  useEffect(() => {
    initializeImageSegmenter();
  }, []);

  // Set up canvas contexts when available
  useEffect(() => {
    if (segmentationCanvasRef.current) {
      const segContext = segmentationCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
      setSegmentationCtx(segContext);
    }

    if (blurCanvasRef.current) {
      const bContext = blurCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
      setBlurCtx(bContext);
    }
  }, [segmentationCanvasRef.current, blurCanvasRef.current]);

  // Start the webcam once the ImageSegmenter is initialized
  useEffect(() => {
    if (imageSegmenter) {
      startWebcam();
    }
  }, [imageSegmenter]);

  // Function to initialize the ImageSegmenter
  const initializeImageSegmenter = async () => {
    try {
      setIsLoading(true);
      console.log("Initializing ImageSegmenter...");

      // Load the necessary files for the ImageSegmenter
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "/models/wasm"
      );

      // Create the ImageSegmenter instance with the specified options
      const imageSegmenterInstance = await ImageSegmenter.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: "/models/hair_segmenter.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        }
      );

      // Save the ImageSegmenter instance to the state
      setImageSegmenter(imageSegmenterInstance);
      setIsLoading(false);
      console.log("ImageSegmenter initialized successfully");
    } catch (error) {
      console.error("Error initializing ImageSegmenter:", error);
      setIsLoading(false);
    }
  };

  // Function to start the webcam
  const startWebcam = async () => {
    console.log("Starting webcam...");

    // Check if the ImageSegmenter is ready
    if (!imageSegmenter) {
      alert("Image Segmenter is still loading. Please try again.");
      return;
    }

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    };

    try {
      // Get the video stream from the user's webcam
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = "block";

        // Set up the video loaded event
        videoRef.current.onloadedmetadata = () => {
          if (segmentationCanvasRef.current && videoRef.current) {
            segmentationCanvasRef.current.width = videoRef.current.videoWidth;
            segmentationCanvasRef.current.height = videoRef.current.videoHeight;

            // Initialize blur canvas with same dimensions
            if (blurCanvasRef.current) {
              blurCanvasRef.current.width = videoRef.current.videoWidth;
              blurCanvasRef.current.height = videoRef.current.videoHeight;
            }
          }

          setWebcamRunning(true);
          console.log(
            `Webcam started: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
          );
        };

        // Wait for the video to fully load before starting segmentation
        videoRef.current.onloadeddata = () => {
          console.log("Video data loaded, starting segmentation...");
          setDetectionRunning(true);
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert(
        "Could not access webcam. Please ensure you've granted permission."
      );
    }
  };

  // Function to stop the webcam
  const stopWebcam = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());

    videoRef.current.style.display = "none";
    setWebcamRunning(false);
    setDetectionRunning(false);

    // Clear the canvases
    if (segmentationCtx && segmentationCanvasRef.current) {
      segmentationCtx.clearRect(
        0,
        0,
        segmentationCanvasRef.current.width,
        segmentationCanvasRef.current.height
      );
    }

    if (blurCtx && blurCanvasRef.current) {
      blurCtx.clearRect(
        0,
        0,
        blurCanvasRef.current.width,
        blurCanvasRef.current.height
      );
    }

    console.log("Webcam stopped.");
  };

  // Function to capture the current processed frame
  const captureImage = () => {
    if (!segmentationCanvasRef.current) return;

    try {
      // Create a temporary canvas to hold the capture
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = segmentationCanvasRef.current.width;
      tempCanvas.height = segmentationCanvasRef.current.height;
      const tempCtx = tempCanvas.getContext("2d");

      // Draw the segmentation result onto the temp canvas
      tempCtx.drawImage(segmentationCanvasRef.current, 0, 0);

      // Convert the canvas to a data URL
      const dataURL = tempCanvas.toDataURL("image/png");
      setCapturedImage(dataURL);
      setShowCaptured(true);

      console.log("Image captured successfully");
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  };

  // Function to download the captured image
  const downloadImage = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `hair-capture-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to close the captured image view
  const closeCapturedView = () => {
    setShowCaptured(false);
  };

  // Apply a blur to the canvas
  const applyBlur = (ctx, amount) => {
    if (!ctx) return;
    ctx.filter = `blur(${amount}px)`;
  };

  // Reset the canvas filter
  const resetFilter = (ctx) => {
    if (!ctx) return;
    ctx.filter = "none";
  };

  // Apply color-based hair segmentation with blur effect
  const applyHairSegmentationWithBlur = (ctx, width, height) => {
    if (!ctx || !blurCtx) return;

    try {
      // Draw the original video frame to both canvases
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      // Apply blur to the blur canvas
      applyBlur(blurCtx, blurAmount);
      blurCtx.drawImage(videoRef.current, 0, 0, width, height);
      resetFilter(blurCtx);

      // Get the image data from both canvases
      const originalImageData = ctx.getImageData(0, 0, width, height);
      const blurredImageData = blurCtx.getImageData(0, 0, width, height);

      const originalPixels = originalImageData.data;
      const blurredPixels = blurredImageData.data;

      // Create a hair mask based on color
      const hairMask = new Uint8Array(width * height);
      let hairPixelCount = 0;

      // First pass - detect hair pixels
      for (let i = 0; i < width * height; i++) {
        const pixelIndex = i * 4;
        const r = originalPixels[pixelIndex];
        const g = originalPixels[pixelIndex + 1];
        const b = originalPixels[pixelIndex + 2];

        // Calculate luminance (brightness)
        const luminance = r * 0.3 + g * 0.59 + b * 0.11;

        // Hair is typically darker than surroundings
        // Adjust threshold based on user setting
        const isDark = luminance < colorThreshold;

        // Calculate color variation (to exclude plain gray areas)
        const colorVariation = Math.max(r, g, b) - Math.min(r, g, b);
        const isNotGray = colorVariation > 15;

        // Detect dark, colored areas as potential hair
        hairMask[i] = isDark && isNotGray ? 1 : 0;
        hairPixelCount += hairMask[i];
      }

      // Second pass - combine original hair with blurred background
      for (let i = 0; i < width * height; i++) {
        const pixelIndex = i * 4;

        if (hairMask[i] === 1) {
          // Keep hair pixels from original image
          // No change needed as they're already in originalImageData
        } else {
          // Replace non-hair pixels with blurred version
          originalPixels[pixelIndex] = blurredPixels[pixelIndex];
          originalPixels[pixelIndex + 1] = blurredPixels[pixelIndex + 1];
          originalPixels[pixelIndex + 2] = blurredPixels[pixelIndex + 2];
        }
      }

      // Put the modified image data back on the canvas
      ctx.putImageData(originalImageData, 0, 0);

      // Update debug view if enabled
      if (debugMode && document.getElementById("debugCanvas")) {
        const debugCanvas = document.getElementById("debugCanvas");
        debugCanvas.width = width;
        debugCanvas.height = height;
        const debugCtx = debugCanvas.getContext("2d");

        // Create a visualization of the hair mask
        const debugImageData = debugCtx.createImageData(width, height);
        for (let i = 0; i < width * height; i++) {
          const pixelIndex = i * 4;

          if (hairMask[i] === 1) {
            // Hair pixels in red
            debugImageData.data[pixelIndex] = 255;
            debugImageData.data[pixelIndex + 1] = 0;
            debugImageData.data[pixelIndex + 2] = 0;
          } else {
            // Non-hair pixels in dark gray
            debugImageData.data[pixelIndex] = 40;
            debugImageData.data[pixelIndex + 1] = 40;
            debugImageData.data[pixelIndex + 2] = 40;
          }
          debugImageData.data[pixelIndex + 3] = 255; // Alpha
        }

        debugCtx.putImageData(debugImageData, 0, 0);
      }
    } catch (error) {
      console.error("Error in hair segmentation with blur:", error);
    }
  };

  // Main segmentation function
  const applyHairSegmentation = (segmentationResult) => {
    if (!segmentationCtx || !videoRef.current) {
      console.log("Missing context or video for segmentation");
      return;
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    // Apply our color-based approach with blur
    console.log("Using color-based segmentation with blur effect");
    applyHairSegmentationWithBlur(segmentationCtx, width, height);
  };

  // Function to perform segmentation on the video stream
  const performSegmentation = () => {
    if (
      !detectionRunning ||
      !imageSegmenter ||
      !videoRef.current ||
      !segmentationCtx
    ) {
      return;
    }

    try {
      // Run segmentation on the current video frame
      const segmentationResults = imageSegmenter.segmentForVideo(
        videoRef.current,
        performance.now()
      );

      // Check if we have results
      if (segmentationResults) {
        applyHairSegmentation(segmentationResults);
      } else {
        console.log("No segmentation results returned");

        // Fall back to direct color-based approach
        if (videoRef.current && segmentationCtx) {
          const width = videoRef.current.videoWidth;
          const height = videoRef.current.videoHeight;
          applyHairSegmentationWithBlur(segmentationCtx, width, height);
        }
      }
    } catch (error) {
      console.error("Error during segmentation:", error);
      // If there's an error with the model, fall back to color-based approach
      try {
        if (videoRef.current && segmentationCtx) {
          const width = videoRef.current.videoWidth;
          const height = videoRef.current.videoHeight;
          applyHairSegmentationWithBlur(segmentationCtx, width, height);
        }
      } catch (fallbackError) {
        console.error("Error in fallback segmentation:", fallbackError);
      }
    }

    // Continue the loop
    if (detectionRunning) {
      requestAnimationFrame(performSegmentation);
    }
  };

  // Start the segmentation loop when detection is enabled
  useEffect(() => {
    if (detectionRunning) {
      const animationId = requestAnimationFrame(performSegmentation);
      return () => cancelAnimationFrame(animationId);
    }
  }, [detectionRunning, imageSegmenter, videoRef.current, segmentationCtx]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl text-white mb-4">
          Hair Segmentation with Blur
        </h1>

        {/* Video and Canvas Container */}
        <div className="relative mb-4 border-4 border-white rounded-lg overflow-hidden w-full max-w-lg h-96">
          {/* Video element (hidden but needed for processing) */}
          <video
            ref={videoRef}
            style={{
              display: "none",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            autoPlay
            playsInline
          ></video>

          {/* Hidden canvas for blur processing */}
          <canvas
            ref={blurCanvasRef}
            style={{
              display: "none",
            }}
          ></canvas>

          {/* Canvas for displaying the segmented output */}
          <canvas
            ref={segmentationCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          ></canvas>

          {/* Loading or camera off message */}
          {!webcamRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              {isLoading ? "Loading Segmentation Model..." : "Camera Off"}
            </div>
          )}
        </div>

        {/* Debug Canvas (hidden unless debug mode is on) */}
        {debugMode && (
          <div className="mb-4 border-4 border-red-500 rounded-lg overflow-hidden w-full max-w-lg">
            <canvas
              id="debugCanvas"
              style={{
                width: "100%",
                height: "auto",
              }}
            ></canvas>
            <div className="bg-black text-white text-xs p-1">
              Debug View: Detected Hair (Red)
            </div>
          </div>
        )}

        {/* Settings Controls */}
        <div className="mb-4 grid grid-cols-1 gap-4 max-w-lg mx-auto">
          <div>
            <label className="text-white block mb-1">
              Darkness Threshold: {colorThreshold}
            </label>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={colorThreshold}
              onChange={(e) => setColorThreshold(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Lower values = darker hair only, higher values = include lighter
              hair
            </div>
          </div>

          <div>
            <label className="text-white block mb-1">
              Blur Amount: {blurAmount}px
            </label>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={blurAmount}
              onChange={(e) => setBlurAmount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              Controls how much the background is blurred
            </div>
          </div>
        </div>

        {/* Button Controls */}
        <div className="flex justify-center gap-4 flex-wrap">
          {!webcamRunning ? (
            <button
              onClick={startWebcam}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={isLoading}
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={stopWebcam}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Stop Camera
              </button>

              <button
                onClick={captureImage}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                disabled={!webcamRunning}
              >
                Capture Image
              </button>
            </>
          )}

          <button
            onClick={toggleDebugMode}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            {debugMode ? "Hide Debug" : "Show Debug"}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white text-sm max-w-lg mx-auto">
          <p>
            This app keeps your hair visible while blurring the background,
            similar to the reference image.
          </p>
          <p className="mt-2">
            <strong>Adjust the settings</strong> to fine-tune the effect:
          </p>
          <ul className="list-disc list-inside mt-1">
            <li>Darkness threshold: controls what is detected as hair</li>
            <li>Blur amount: adjusts how blurry the background appears</li>
            <li>
              Enable debug mode to see what's being detected as hair (shown in
              red)
            </li>
          </ul>
        </div>

        {/* Captured Image Modal */}
        {showCaptured && capturedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Captured Image</h3>
                <button
                  onClick={closeCapturedView}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 border rounded overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured hair segmentation"
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={downloadImage}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Download Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
