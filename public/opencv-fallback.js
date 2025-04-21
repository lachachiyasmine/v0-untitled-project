// Fallback implementation with minimal OpenCV functionality
console.log("Loading OpenCV.js fallback implementation")

// Create a minimal cv object with basic functionality
window.cv = {
  // Basic version info
  version: "Fallback 1.0",

  // Basic image processing
  imread: (canvas) => {
    console.log("Fallback imread called")
    // Create a simple Mat-like object
    return {
      rows: canvas.height,
      cols: canvas.width,
      data: new Uint8ClampedArray(canvas.width * canvas.height * 4),
      delete: () => {
        console.log("Fallback Mat deleted")
      },
    }
  },

  imshow: (canvas, mat) => {
    console.log("Fallback imshow called")
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Just draw a placeholder message
      ctx.fillStyle = "red"
      ctx.font = "20px Arial"
      ctx.fillText("OpenCV.js failed to load", 10, 50)
      ctx.fillText("Using fallback implementation", 10, 80)
      ctx.fillText("with limited functionality", 10, 110)
    }
  },

  // Basic constants
  COLOR_RGBA2GRAY: "COLOR_RGBA2GRAY",
  COLOR_GRAY2RGBA: "COLOR_GRAY2RGBA",
  CV_8UC1: "CV_8UC1",
  CV_8UC4: "CV_8UC4",
  BORDER_DEFAULT: "BORDER_DEFAULT",

  // Basic constructors
  Mat: () => ({
    zeros: () => ({
      rows: 0,
      cols: 0,
      data: new Uint8ClampedArray(0),
      delete: () => {
        console.log("Fallback Mat deleted")
      },
    }),
    delete: () => {
      console.log("Fallback Mat deleted")
    },
  }),

  MatVector: () => ({
    push_back: () => {
      console.log("Fallback push_back called")
    },
    delete: () => {
      console.log("Fallback MatVector deleted")
    },
  }),

  Point: (x, y) => ({ x: x, y: y }),

  Size: (width, height) => ({ width: width, height: height }),

  Scalar: (r, g, b, a) => [r, g, b, a],

  // Basic operations (stubs)
  cvtColor: () => {
    console.log("Fallback cvtColor called")
  },
  GaussianBlur: () => {
    console.log("Fallback GaussianBlur called")
  },
  Canny: () => {
    console.log("Fallback Canny called")
  },
  HoughLinesP: () => {
    console.log("Fallback HoughLinesP called")
  },
  fillPoly: () => {
    console.log("Fallback fillPoly called")
  },
  polylines: () => {
    console.log("Fallback polylines called")
  },
  line: () => {
    console.log("Fallback line called")
  },
  bitwise_and: () => {
    console.log("Fallback bitwise_and called")
  },
}

// Notify that the fallback is ready
console.log("OpenCV.js fallback loaded")
if (typeof window.Module === "object" && typeof window.Module.onRuntimeInitialized === "function") {
  window.Module.onRuntimeInitialized()
}
