import LaneDetection from "@/components/lane-detection"
import OpenCVUploader from "@/components/opencv-uploader"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Interactive Lane Detection</h1>
        <p className="text-center mb-8 text-muted-foreground">
          Upload an image to detect road lanes or try with the sample images
        </p>

        <Tabs defaultValue="detection" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detection">Lane Detection</TabsTrigger>
            <TabsTrigger value="opencv">OpenCV.js Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="detection">
            <LaneDetection />
          </TabsContent>

          <TabsContent value="opencv">
            <Card>
              <CardContent className="pt-6">
                <OpenCVUploader />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
