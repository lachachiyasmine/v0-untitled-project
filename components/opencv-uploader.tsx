"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, Check } from "lucide-react"

export default function OpenCVUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a JavaScript file
    if (!file.name.endsWith(".js")) {
      setError("Please upload a JavaScript file (.js)")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)

      // Send the file to the server
      const response = await fetch("/api/upload-opencv", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload OpenCV.js")
      }

      // Success
      setUploadSuccess(true)

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error("Error uploading OpenCV.js:", err)
      setError(`Error uploading OpenCV.js: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload OpenCV.js</CardTitle>
        <CardDescription>Upload a local copy of OpenCV.js to use with the lane detection application.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center p-4 border border-green-200 rounded-lg bg-green-50">
            <Check className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-green-700">OpenCV.js uploaded successfully!</p>
            <p className="text-sm text-green-600">Reloading page...</p>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-2">Click to upload OpenCV.js</p>
            <p className="text-xs text-gray-400">JavaScript file (.js)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".js"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-gray-500 text-center">
          You can download OpenCV.js from the{" "}
          <a
            href="https://docs.opencv.org/4.5.5/opencv.js"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            official OpenCV website
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  )
}
