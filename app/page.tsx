import LaneDetection from "@/components/lane-detection"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Interactive Lane Detection</h1>
        <p className="text-center mb-8 text-muted-foreground">
          Upload an image to detect road lanes or try with the sample images
        </p>
        <LaneDetection />
      </div>
    </main>
  )
}
