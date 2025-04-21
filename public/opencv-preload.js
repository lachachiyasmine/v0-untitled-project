// This script helps preload OpenCV.js
console.log("OpenCV.js preloader initialized")

// Set up the Module object for OpenCV.js
window.Module = {
  onRuntimeInitialized: () => {
    console.log("OpenCV.js runtime initialized from preloader")
    // Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent("opencv-ready"))
  },
}

// Attempt to load OpenCV.js
const script = document.createElement("script")
script.src = "https://docs.opencv.org/4.5.5/opencv.js"
script.async = true
script.crossOrigin = "anonymous"
document.head.appendChild(script)
