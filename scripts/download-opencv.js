const fs = require("fs")
const path = require("path")
const https = require("https")

const OPENCV_URL = "https://docs.opencv.org/4.5.5/opencv.js"
const OUTPUT_PATH = path.join(__dirname, "../public/opencv.js")

console.log("Downloading OpenCV.js...")

// Create a file stream to save the file
const fileStream = fs.createWriteStream(OUTPUT_PATH)

// Download the file
https
  .get(OPENCV_URL, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download OpenCV.js: ${response.statusCode} ${response.statusMessage}`)
      fs.unlinkSync(OUTPUT_PATH) // Delete the file if download failed
      process.exit(1)
    }

    // Pipe the response to the file
    response.pipe(fileStream)

    fileStream.on("finish", () => {
      fileStream.close()
      console.log(`OpenCV.js downloaded successfully to ${OUTPUT_PATH}`)
    })
  })
  .on("error", (err) => {
    console.error(`Error downloading OpenCV.js: ${err.message}`)
    fs.unlinkSync(OUTPUT_PATH) // Delete the file if download failed
    process.exit(1)
  })
