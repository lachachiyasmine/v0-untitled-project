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
      ctx.fillText("OpenCV.js n'a pas pu être chargé", 10, 50)
      ctx.fillText("Utilisation de l'implémentation de secours", 10, 80)
      ctx.fillText("avec des fonctionnalités limitées", 10, 110)

      // Draw a simple lane visualization
      ctx.strokeStyle = "blue"
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(canvas.width * 0.2, canvas.height)
      ctx.lineTo(canvas.width * 0.45, canvas.height * 0.6)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(canvas.width * 0.8, canvas.height)
      ctx.lineTo(canvas.width * 0.55, canvas.height * 0.6)
      ctx.stroke()

      // Draw lane area
      ctx.fillStyle = "rgba(0, 200, 0, 0.3)"
      ctx.beginPath()
      ctx.moveTo(canvas.width * 0.2, canvas.height)
      ctx.lineTo(canvas.width * 0.45, canvas.height * 0.6)
      ctx.lineTo(canvas.width * 0.55, canvas.height * 0.6)
      ctx.lineTo(canvas.width * 0.8, canvas.height)
      ctx.closePath()
      ctx.fill()
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
    zeros: (rows, cols, type) => ({
      rows: rows || 0,
      cols: cols || 0,
      data: new Uint8ClampedArray((rows || 0) * (cols || 0) * 4),
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
