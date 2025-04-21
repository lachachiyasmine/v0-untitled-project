const fs = require("fs")
const path = require("path")
const https = require("https")

// Multiple sources for OpenCV.js to try
const OPENCV_SOURCES = [
  {
    url: "https://docs.opencv.org/4.5.5/opencv.js",
    name: "OpenCV.js 4.5.5 (Documentation officielle)",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.7.0-release.1/opencv.js",
    name: "OpenCV.js 4.7.0 (CDN JSDelivr)",
  },
  {
    url: "https://unpkg.com/opencv.js@1.2.1/opencv.js",
    name: "OpenCV.js 1.2.1 (CDN Unpkg)",
  },
]

const OUTPUT_PATH = path.join(__dirname, "../public/opencv.js")

// Function to download from a specific URL
function downloadFromUrl(sourceInfo, retryCount = 0) {
  return new Promise((resolve, reject) => {
    console.log(`Téléchargement d'OpenCV.js depuis ${sourceInfo.name}...`)

    // Create a file stream to save the file
    const fileStream = fs.createWriteStream(OUTPUT_PATH)

    // Download the file
    const request = https.get(sourceInfo.url, (response) => {
      // Check if the response is successful
      if (response.statusCode !== 200) {
        fileStream.close()
        fs.unlinkSync(OUTPUT_PATH) // Delete the file if download failed
        return reject(new Error(`Échec du téléchargement: ${response.statusCode} ${response.statusMessage}`))
      }

      // Pipe the response to the file
      response.pipe(fileStream)

      fileStream.on("finish", () => {
        fileStream.close()
        console.log(`OpenCV.js téléchargé avec succès depuis ${sourceInfo.name}`)
        resolve(true)
      })
    })

    request.on("error", (err) => {
      fileStream.close()
      if (fs.existsSync(OUTPUT_PATH)) {
        fs.unlinkSync(OUTPUT_PATH) // Delete the file if download failed
      }
      reject(new Error(`Erreur lors du téléchargement: ${err.message}`))
    })

    // Set a timeout for the request
    request.setTimeout(30000, () => {
      request.abort()
      fileStream.close()
      if (fs.existsSync(OUTPUT_PATH)) {
        fs.unlinkSync(OUTPUT_PATH)
      }
      reject(new Error("Délai d'attente dépassé lors du téléchargement"))
    })
  })
}

// Try downloading from each source until one succeeds
async function downloadOpenCV() {
  console.log("Démarrage du téléchargement d'OpenCV.js...")

  for (let i = 0; i < OPENCV_SOURCES.length; i++) {
    try {
      await downloadFromUrl(OPENCV_SOURCES[i])
      console.log(`OpenCV.js téléchargé avec succès vers ${OUTPUT_PATH}`)

      // Verify file size to ensure it's not corrupted
      const stats = fs.statSync(OUTPUT_PATH)
      if (stats.size < 1000000) {
        // Less than ~1MB is probably not a valid OpenCV.js file
        console.warn("Le fichier téléchargé semble trop petit. Il pourrait être corrompu.")
        continue // Try next source
      }

      return true // Successfully downloaded
    } catch (error) {
      console.error(`Échec avec la source ${i + 1}/${OPENCV_SOURCES.length}: ${error.message}`)
      // Continue to next source
    }
  }

  // If we get here, all sources failed
  console.error("Toutes les sources ont échoué. Création d'un fichier de secours minimal...")

  // Create a minimal fallback file
  const fallbackContent = `
    // Fichier de secours minimal pour OpenCV.js
    console.warn("Utilisation d'une version de secours minimale d'OpenCV.js. Les fonctionnalités seront limitées.");
    
    // Créer un objet cv minimal
    window.cv = {
      // Informations de version
      version: "Fallback 1.0",
      
      // Fonction d'initialisation
      onRuntimeInitialized: function() {
        console.log("Version de secours d'OpenCV.js initialisée");
        if (typeof window.Module === "object" && typeof window.Module.onRuntimeInitialized === "function") {
          window.Module.onRuntimeInitialized();
        }
      }
    };
    
    // Déclencher l'initialisation
    setTimeout(function() {
      if (window.cv && typeof window.cv.onRuntimeInitialized === "function") {
        window.cv.onRuntimeInitialized();
      }
    }, 100);
  `

  fs.writeFileSync(OUTPUT_PATH, fallbackContent)
  console.log("Fichier de secours créé. Les fonctionnalités seront limitées.")
  return false
}

// Run the download process
downloadOpenCV()
  .then((success) => {
    if (success) {
      console.log("Processus de téléchargement terminé avec succès.")
    } else {
      console.log("Processus de téléchargement terminé avec des erreurs. Un fichier de secours a été créé.")
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error(`Erreur inattendue: ${err.message}`)
    process.exit(1)
  })
