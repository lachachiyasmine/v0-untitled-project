"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, ImageIcon, RefreshCw, Settings, AlertCircle, Info, HelpCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LaneDetector } from "./lane-detection-algorithm"

interface LaneDetectionParams {
  cannyThreshold1: number
  cannyThreshold2: number
  houghThreshold: number
  houghMinLineLength: number
  houghMaxLineGap: number
  roiHeight: number
  roiWidthOffset: number
}

// French tooltips for parameters
const FRENCH_TOOLTIPS = {
  cannyThreshold1:
    "Seuil inférieur pour la détection des contours. Les valeurs plus basses détectent plus de contours mais peuvent inclure du bruit.",
  cannyThreshold2:
    "Seuil supérieur pour la détection des contours. Les valeurs plus élevées détectent moins de contours mais sont plus précises.",
  houghThreshold:
    "Nombre minimum de votes (intersections) nécessaires pour détecter une ligne. Les valeurs plus élevées détectent moins de lignes mais plus précises.",
  houghMinLineLength: "Longueur minimale de ligne. Les lignes plus courtes que cette valeur sont rejetées.",
  houghMaxLineGap: "Écart maximal entre les segments de ligne. Les segments avec un écart inférieur sont fusionnés.",
  roiHeight: "Hauteur de la région d'intérêt depuis le bas de l'image. Ajustez pour cibler la zone de la route.",
  roiWidthOffset:
    "Décalage de la largeur de la région d'intérêt depuis les côtés. Ajustez pour cibler la zone de la route.",
}

const DEFAULT_PARAMS: LaneDetectionParams = {
  cannyThreshold1: 50,
  cannyThreshold2: 150,
  houghThreshold: 40,
  houghMinLineLength: 100,
  houghMaxLineGap: 50,
  roiHeight: 0.4,
  roiWidthOffset: 0.1,
}

// Updated to use the real road images
const SAMPLE_IMAGES = ["/images/road1.jpeg", "/images/road2.jpeg", "/images/road3.jpeg"]

declare global {
  interface Window {
    cv: any
    Module: any
  }
}

export default function LaneDetection() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [params, setParams] = useState<LaneDetectionParams>(DEFAULT_PARAMS)
  const [activeTab, setActiveTab] = useState("upload")
  const [laneDetector, setLaneDetector] = useState<LaneDetector | null>(null)
  const [isOpenCvReady, setIsOpenCvReady] = useState(false)
  const [isOpenCvLoading, setIsOpenCvLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState("Initialisation...")
  const [loadingStage, setLoadingStage] = useState(0)

  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Load OpenCV.js with improved visual feedback
  useEffect(() => {
    // Clear any previous errors
    setError(null)

    // Check if OpenCV is already loaded
    if (window.cv && typeof window.cv !== "undefined") {
      console.log("OpenCV.js already loaded")
      setIsOpenCvReady(true)
      setIsOpenCvLoading(false)
      setLoadingProgress(100)
      setLoadingStatus("OpenCV.js chargé avec succès!")
      return
    }

    // Set up loading stages
    const loadingStages = [
      "Initialisation...",
      "Chargement du script OpenCV.js...",
      "Initialisation du runtime OpenCV.js...",
      "Préparation de l'environnement...",
      "Finalisation...",
    ]

    // Start loading animation
    let currentStage = 0
    const updateLoadingStatus = () => {
      if (currentStage < loadingStages.length) {
        setLoadingStage(currentStage)
        setLoadingStatus(loadingStages[currentStage])
        setLoadingProgress(Math.min(100, Math.round((currentStage / loadingStages.length) * 100)))
        currentStage++
      }
    }

    // Initial status
    updateLoadingStatus()

    // Update status periodically to show progress
    const loadingInterval = setInterval(() => {
      if (!isOpenCvReady && currentStage < loadingStages.length) {
        updateLoadingStatus()
      } else {
        clearInterval(loadingInterval)
      }
    }, 1500)

    // Set up OpenCV.js module callback
    window.Module = {
      onRuntimeInitialized: () => {
        console.log("OpenCV.js runtime initialized")
        clearInterval(loadingInterval)
        setLoadingProgress(100)
        setLoadingStatus("OpenCV.js chargé avec succès!")
        setIsOpenCvReady(true)
        setIsOpenCvLoading(false)
      },
    }

    // Create script element to load local OpenCV.js
    const script = document.createElement("script")
    script.src = "/opencv.js" // Local copy in public folder
    script.async = true
    script.type = "text/javascript"

    // Handle script events
    script.onload = () => {
      console.log("OpenCV.js script loaded")
      setLoadingProgress(60)
      setLoadingStatus("Script chargé, initialisation du runtime...")
    }

    script.onerror = (e) => {
      console.error("Failed to load OpenCV.js", e)
      clearInterval(loadingInterval)
      setIsOpenCvLoading(false)
      setError("Échec du chargement d'OpenCV.js. Veuillez vérifier que le fichier existe dans le dossier public.")
    }

    // Add script to document
    document.head.appendChild(script)
    scriptRef.current = script

    // Set a timeout to detect if OpenCV.js fails to initialize
    const timeoutId = setTimeout(() => {
      if (!isOpenCvReady) {
        clearInterval(loadingInterval)
        setIsOpenCvLoading(false)
        setError(
          "Le délai d'initialisation d'OpenCV.js a expiré. Veuillez vérifier que le fichier est correctement téléchargé et non corrompu.",
        )
      }
    }, 30000) // 30 seconds timeout

    // Clean up
    return () => {
      clearInterval(loadingInterval)
      clearTimeout(timeoutId)
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current)
      }
    }
  }, [isOpenCvReady])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      loadImage(url)
    }
  }

  const handleSampleImageClick = (url: string) => {
    // Clear previous image data
    if (originalCanvasRef.current && processedCanvasRef.current) {
      const originalCtx = originalCanvasRef.current.getContext("2d")
      const processedCtx = processedCanvasRef.current.getContext("2d")

      if (originalCtx && processedCtx) {
        originalCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height)
        processedCtx.clearRect(0, 0, processedCanvasRef.current.width, processedCanvasRef.current.height)
      }
    }

    // Reset the lane detector to force a new instance for the new image
    setLaneDetector(null)
    setError(null)

    // Set the new image URL and load it
    setImageUrl(url)
    loadImage(url)
    setActiveTab("result") // Automatically switch to the result tab
  }

  const loadImage = (url: string) => {
    if (!isOpenCvReady) {
      setError("OpenCV.js n'est pas encore prêt. Veuillez patienter un moment et réessayer.")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (originalCanvasRef.current && processedCanvasRef.current) {
        try {
          // Set canvas dimensions to match image
          const canvasWidth = Math.min(640, img.width)
          const canvasHeight = Math.floor((img.height / img.width) * canvasWidth)

          originalCanvasRef.current.width = canvasWidth
          originalCanvasRef.current.height = canvasHeight
          processedCanvasRef.current.width = canvasWidth
          processedCanvasRef.current.height = canvasHeight

          // Draw original image
          const originalCtx = originalCanvasRef.current.getContext("2d")
          originalCtx?.drawImage(img, 0, 0, canvasWidth, canvasHeight)

          // Create a new LaneDetector instance
          const newDetector = new LaneDetector(processedCanvasRef.current, params, window.cv)
          setLaneDetector(newDetector)

          // Process image for lane detection
          processImage(newDetector)
        } catch (err) {
          console.error("Error loading image:", err)
          setError(`Erreur lors du chargement de l'image: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }
    img.onerror = () => {
      setError(`Échec du chargement de l'image depuis ${url}`)
    }
    img.src = url
  }

  const processImage = (detector = laneDetector) => {
    if (!originalCanvasRef.current || !processedCanvasRef.current || !detector) return

    setIsProcessing(true)
    setError(null)

    try {
      // Update detector with current parameters
      detector.setParams(params)

      // Process the image with a small delay to show loading state
      setTimeout(async () => {
        try {
          await detector.processImage(originalCanvasRef.current)
          setIsProcessing(false)
        } catch (err) {
          console.error("Error processing image:", err)
          setError(`Erreur lors du traitement de l'image: ${err instanceof Error ? err.message : String(err)}`)
          setIsProcessing(false)
        }
      }, 100)
    } catch (err) {
      console.error("Error setting up image processing:", err)
      setError(
        `Erreur lors de la configuration du traitement d'image: ${err instanceof Error ? err.message : String(err)}`,
      )
      setIsProcessing(false)
    }
  }

  const resetParams = () => {
    setParams(DEFAULT_PARAMS)
    if (imageUrl && laneDetector) {
      processImage()
    }
  }

  const handleParamChange = (key: keyof LaneDetectionParams, value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value
    setParams((prev) => ({ ...prev, [key]: newValue }))

    // Process image immediately when parameters change
    if (imageUrl && laneDetector) {
      processImage()
    }
  }

  useEffect(() => {
    if (imageUrl && activeTab === "result" && laneDetector && isOpenCvReady) {
      processImage()
    }
  }, [activeTab, imageUrl, laneDetector, isOpenCvReady])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {isOpenCvLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chargement d'OpenCV.js</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{loadingStatus}</p>
                <Progress value={loadingProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {loadingProgress}% terminé - Étape {loadingStage + 1}/5
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Télécharger une image</TabsTrigger>
            <TabsTrigger value="result" disabled={!imageUrl}>
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">Cliquez pour télécharger ou glissez-déposez</p>
                  <p className="text-xs text-gray-400">PNG, JPG ou JPEG (max. 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Ou essayez avec des images d'exemple</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMPLE_IMAGES.map((img, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSampleImageClick(img)}
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Exemple de route ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-2 text-center text-sm">Exemple de route {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6">
            {imageUrl && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5" /> Image originale
                      </h3>
                      <div className="relative border rounded-lg overflow-hidden">
                        <canvas ref={originalCanvasRef} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5" /> Image traitée
                        {isProcessing && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                      </h3>
                      <div className="relative border rounded-lg overflow-hidden">
                        <canvas ref={processedCanvasRef} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <Settings className="mr-2 h-5 w-5" /> Paramètres de détection
                      </h3>
                      <Button variant="outline" size="sm" onClick={resetParams} className="flex items-center">
                        <RefreshCw className="mr-2 h-4 w-4" /> Réinitialiser
                      </Button>
                    </div>

                    <Alert variant="default" className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Guide des paramètres</AlertTitle>
                      <AlertDescription className="text-sm">
                        Passez votre souris sur l'icône <HelpCircle className="h-3 w-3 inline" /> à côté de chaque
                        paramètre pour voir une description détaillée en français.
                      </AlertDescription>
                    </Alert>

                    <Accordion type="single" collapsible defaultValue="edge-detection">
                      <AccordionItem value="edge-detection">
                        <AccordionTrigger>Détection des contours</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Seuil Canny 1</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.cannyThreshold1}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">{params.cannyThreshold1}</span>
                              </div>
                              <Slider
                                value={[params.cannyThreshold1]}
                                min={0}
                                max={255}
                                step={1}
                                onValueChange={(value) => handleParamChange("cannyThreshold1", value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Seuil Canny 2</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.cannyThreshold2}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">{params.cannyThreshold2}</span>
                              </div>
                              <Slider
                                value={[params.cannyThreshold2]}
                                min={0}
                                max={255}
                                step={1}
                                onValueChange={(value) => handleParamChange("cannyThreshold2", value)}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="line-detection">
                        <AccordionTrigger>Détection des lignes</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Seuil Hough</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.houghThreshold}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">{params.houghThreshold}</span>
                              </div>
                              <Slider
                                value={[params.houghThreshold]}
                                min={5}
                                max={800}
                                step={1}
                                onValueChange={(value) => handleParamChange("houghThreshold", value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Longueur min. de ligne</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.houghMinLineLength}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">{params.houghMinLineLength}</span>
                              </div>
                              <Slider
                                value={[params.houghMinLineLength]}
                                min={5}
                                max={1600}
                                step={1}
                                onValueChange={(value) => handleParamChange("houghMinLineLength", value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Écart max. de ligne</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.houghMaxLineGap}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">{params.houghMaxLineGap}</span>
                              </div>
                              <Slider
                                value={[params.houghMaxLineGap]}
                                min={-400}
                                max={800}
                                step={1}
                                onValueChange={(value) => handleParamChange("houghMaxLineGap", value)}
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {params.houghMaxLineGap >= 0
                                  ? "Positif: Écart maximal autorisé entre les segments de ligne"
                                  : "Négatif: Chevauchement minimal requis entre les segments de ligne"}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="roi">
                        <AccordionTrigger>Région d'intérêt</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Hauteur ROI (% depuis le bas)</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">{FRENCH_TOOLTIPS.roiHeight}</TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(params.roiHeight * 100)}%
                                </span>
                              </div>
                              <Slider
                                value={[params.roiHeight]}
                                min={0.1}
                                max={0.9}
                                step={0.01}
                                onValueChange={(value) => handleParamChange("roiHeight", value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <label className="text-sm mr-2">Décalage largeur ROI (% depuis les côtés)</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {FRENCH_TOOLTIPS.roiWidthOffset}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(params.roiWidthOffset * 100)}%
                                </span>
                              </div>
                              <Slider
                                value={[params.roiWidthOffset]}
                                min={0.025}
                                max={0.6}
                                step={0.01}
                                onValueChange={(value) => handleParamChange("roiWidthOffset", value)}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
