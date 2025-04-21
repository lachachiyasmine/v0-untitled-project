import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
    }

    // Check if it's a JavaScript file
    if (!file.name.endsWith(".js")) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Please upload a JavaScript file (.js)" },
        { status: 400 },
      )
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save the file to the public directory
    const filePath = join(process.cwd(), "public", "opencv.js")
    await writeFile(filePath, buffer)

    return NextResponse.json({ success: true, message: "File uploaded successfully" })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, message: "Error uploading file" }, { status: 500 })
  }
}
