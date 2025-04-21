"use client"

// This file contains the real lane detection algorithm implementation using OpenCV.js

export interface LaneDetectionParams {
  cannyThreshold1: number
  cannyThreshold2: number
  houghThreshold: number
  houghMinLineLength: number
  houghMaxLineGap: number
  roiHeight: number
  roiWidthOffset: number
}

export class LaneDetector {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private params: LaneDetectionParams
  private width: number
  private height: number
  private cv: any // OpenCV.js instance

  constructor(canvas: HTMLCanvasElement, params: LaneDetectionParams, cv: any) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.params = params
    this.width = canvas.width
    this.height = canvas.height
    this.cv = cv
  }

  public setParams(params: LaneDetectionParams) {
    this.params = params
  }

  public async processImage(originalCanvas: HTMLCanvasElement): Promise<void> {
    if (!this.ctx || !this.cv) return

    try {
      // Get image data from original canvas
      const originalCtx = originalCanvas.getContext("2d")
      if (!originalCtx) return

      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height)

      // Draw original image
      this.ctx.drawImage(originalCanvas, 0, 0, this.width, this.height)

      // Convert canvas to OpenCV Mat
      const src = this.cv.imread(originalCanvas)

      // 1. Preprocess the image (grayscale, blur, edge detection)
      const edges = this.preprocessImage(src)

      // 2. Apply region of interest mask
      const maskedEdges = this.applyRegionOfInterest(edges)

      // 3. Apply Hough transform to detect lines
      const lines = this.detectLines(maskedEdges)

      // 4. Separate lines into left and right lanes
      const { leftLines, rightLines } = this.separateLaneLines(lines)

      // 5. Average and extrapolate the lines
      const leftLine = this.averageLines(leftLines)
      const rightLine = this.averageLines(rightLines)

      // 6. Draw the lane lines on the image
      this.drawLaneLines(src, leftLine, rightLine)

      // Display the result
      this.cv.imshow(this.canvas, src)

      // Clean up
      src.delete()
      edges.delete()
      maskedEdges.delete()
      lines.delete()
    } catch (error) {
      console.error("Error in processImage:", error)
      throw error
    }
  }

  private preprocessImage(src: any): any {
    try {
      // Convert to grayscale
      const gray = new this.cv.Mat()
      this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY)

      // Apply Gaussian blur
      const blurred = new this.cv.Mat()
      const ksize = new this.cv.Size(5, 5)
      this.cv.GaussianBlur(gray, blurred, ksize, 0, 0, this.cv.BORDER_DEFAULT)

      // Apply Canny edge detection
      const edges = new this.cv.Mat()
      this.cv.Canny(blurred, edges, this.params.cannyThreshold1, this.params.cannyThreshold2, 3, false)

      // Clean up
      gray.delete()
      blurred.delete()

      return edges
    } catch (error) {
      console.error("Error in preprocessImage:", error)
      throw new Error(`Preprocessing failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private applyRegionOfInterest(edges: any): any {
    try {
      const mask = new this.cv.Mat.zeros(edges.rows, edges.cols, this.cv.CV_8UC1)

      // Define region of interest vertices
      const roiVertices = this.getRegionVertices()
      const points = new this.cv.MatVector()
      const point1 = new this.cv.Mat(roiVertices.length, 1, this.cv.CV_32SC2)

      // Fill the points
      for (let i = 0; i < roiVertices.length; i++) {
        point1.data32S[i * 2] = roiVertices[i][0]
        point1.data32S[i * 2 + 1] = roiVertices[i][1]
      }
      points.push_back(point1)

      // Fill the mask with white
      const color = new this.cv.Scalar(255, 255, 255, 255)
      this.cv.fillPoly(mask, points, color)

      // Apply the mask
      const maskedEdges = new this.cv.Mat()
      this.cv.bitwise_and(edges, mask, maskedEdges)

      // Clean up
      mask.delete()
      points.delete()
      point1.delete()

      return maskedEdges
    } catch (error) {
      console.error("Error in applyRegionOfInterest:", error)
      throw new Error(`Region of interest masking failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private getRegionVertices(): [number, number][] {
    const { roiHeight, roiWidthOffset } = this.params
    const roiY = this.height * (1 - roiHeight)
    const roiX1 = this.width * roiWidthOffset
    const roiX2 = this.width * (1 - roiWidthOffset)

    return [
      [roiX1, this.height],
      [this.width / 2 - 30, roiY],
      [this.width / 2 + 30, roiY],
      [roiX2, this.height],
    ]
  }

  private detectLines(maskedEdges: any): any {
    try {
      const lines = new this.cv.Mat()
      this.cv.HoughLinesP(
        maskedEdges,
        lines,
        1,
        Math.PI / 180,
        this.params.houghThreshold,
        this.params.houghMinLineLength,
        Math.max(1, this.params.houghMaxLineGap), // Ensure positive value for OpenCV
      )
      return lines
    } catch (error) {
      console.error("Error in detectLines:", error)
      throw new Error(`Line detection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private separateLaneLines(lines: any): {
    leftLines: { x1: number; y1: number; x2: number; y2: number }[]
    rightLines: { x1: number; y1: number; x2: number; y2: number }[]
  } {
    try {
      const leftLines: { x1: number; y1: number; x2: number; y2: number }[] = []
      const rightLines: { x1: number; y1: number; x2: number; y2: number }[] = []

      // Check if lines were detected
      if (lines.rows === 0) {
        console.log("No lines detected")
        return { leftLines, rightLines }
      }

      // Process each line
      for (let i = 0; i < lines.rows; i++) {
        const x1 = lines.data32S[i * 4]
        const y1 = lines.data32S[i * 4 + 1]
        const x2 = lines.data32S[i * 4 + 2]
        const y2 = lines.data32S[i * 4 + 3]

        // Calculate slope
        // Avoid division by zero
        if (x2 - x1 === 0) continue
        const slope = (y2 - y1) / (x2 - x1)

        // Filter out lines with small slope (horizontal lines)
        if (Math.abs(slope) < 0.5) continue

        // Separate left and right lines based on slope and position
        if (slope < 0 && x1 < this.width / 2) {
          // Left lane (negative slope)
          leftLines.push({ x1, y1, x2, y2 })
        } else if (slope > 0 && x1 > this.width / 2) {
          // Right lane (positive slope)
          rightLines.push({ x1, y1, x2, y2 })
        }
      }

      return { leftLines, rightLines }
    } catch (error) {
      console.error("Error in separateLaneLines:", error)
      return { leftLines: [], rightLines: [] }
    }
  }

  private averageLines(
    lines: { x1: number; y1: number; x2: number; y2: number }[],
  ): { x1: number; y1: number; x2: number; y2: number } | null {
    if (lines.length === 0) return null

    try {
      // Average the position and slope of the lines
      let sumX1 = 0
      let sumY1 = 0
      let sumX2 = 0
      let sumY2 = 0
      let sumSlope = 0
      let sumIntercept = 0

      for (const line of lines) {
        const { x1, y1, x2, y2 } = line
        sumX1 += x1
        sumY1 += y1
        sumX2 += x2
        sumY2 += y2

        // Calculate slope and intercept
        if (x2 - x1 === 0) continue // Skip vertical lines
        const slope = (y2 - y1) / (x2 - x1)
        const intercept = y1 - slope * x1
        sumSlope += slope
        sumIntercept += intercept
      }

      const avgSlope = sumSlope / lines.length
      const avgIntercept = sumIntercept / lines.length

      // Extrapolate the line to the bottom of the image
      const bottomY = this.height
      const bottomX = (bottomY - avgIntercept) / avgSlope

      // Extrapolate the line to the top of the ROI
      const topY = this.height * (1 - this.params.roiHeight * 0.8)
      const topX = (topY - avgIntercept) / avgSlope

      return {
        x1: bottomX,
        y1: bottomY,
        x2: topX,
        y2: topY,
      }
    } catch (error) {
      console.error("Error in averageLines:", error)
      return null
    }
  }

  private drawLaneLines(
    src: any,
    leftLine: { x1: number; y1: number; x2: number; y2: number } | null,
    rightLine: { x1: number; y1: number; x2: number; y2: number } | null,
  ): void {
    try {
      // Draw region of interest for reference
      this.drawROI(src)

      // Draw left lane line
      if (leftLine) {
        const pt1 = new this.cv.Point(leftLine.x1, leftLine.y1)
        const pt2 = new this.cv.Point(leftLine.x2, leftLine.y2)
        this.cv.line(src, pt1, pt2, [255, 0, 0, 255], 5)
      }

      // Draw right lane line
      if (rightLine) {
        const pt1 = new this.cv.Point(rightLine.x1, rightLine.y1)
        const pt2 = new this.cv.Point(rightLine.x2, rightLine.y2)
        this.cv.line(src, pt1, pt2, [255, 0, 0, 255], 5)
      }

      // Draw lane area if both lines are detected
      if (leftLine && rightLine) {
        // Create points for the polygon
        const points = new this.cv.MatVector()
        const point1 = new this.cv.Mat(4, 1, this.cv.CV_32SC2)

        // Bottom left, top left, top right, bottom right
        point1.data32S[0] = leftLine.x1
        point1.data32S[1] = leftLine.y1
        point1.data32S[2] = leftLine.x2
        point1.data32S[3] = leftLine.y2
        point1.data32S[4] = rightLine.x2
        point1.data32S[5] = rightLine.y2
        point1.data32S[6] = rightLine.x1
        point1.data32S[7] = rightLine.y1
        points.push_back(point1)

        // Fill the polygon with a semi-transparent green color
        const color = new this.cv.Scalar(0, 200, 0, 50)
        this.cv.fillPoly(src, points, color)

        // Clean up
        points.delete()
        point1.delete()
      }
    } catch (error) {
      console.error("Error in drawLaneLines:", error)
      // Continue execution even if drawing fails
    }
  }

  private drawROI(src: any): void {
    try {
      const vertices = this.getRegionVertices()
      const points = new this.cv.MatVector()
      const point1 = new this.cv.Mat(vertices.length, 1, this.cv.CV_32SC2)

      // Fill the points
      for (let i = 0; i < vertices.length; i++) {
        point1.data32S[i * 2] = vertices[i][0]
        point1.data32S[i * 2 + 1] = vertices[i][1]
      }
      points.push_back(point1)

      // Draw the polygon
      const color = new this.cv.Scalar(0, 255, 0, 100)
      this.cv.polylines(src, points, true, color, 2)

      // Clean up
      points.delete()
      point1.delete()
    } catch (error) {
      console.error("Error in drawROI:", error)
      // Continue execution even if drawing fails
    }
  }
}
