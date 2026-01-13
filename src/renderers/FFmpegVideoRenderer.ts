import ffmpeg from "fluent-ffmpeg";
import { IVideoRenderer } from "../../types/interfaces";

export class FFmpegVideoRenderer implements IVideoRenderer {
  async renderVideo(
    framePath: string,
    audioPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Rendering video...`);
      console.log(`   - Frame: ${framePath}`);
      console.log(`   - Audio: ${audioPath}`);
      console.log(`   - Output: ${outputPath}`);

      ffmpeg()
        .input(framePath)
        .loop() // Loop the image
        .input(audioPath)
        .audioCodec("aac")
        .videoCodec("libx264")
        .outputOptions([
          "-pix_fmt yuv420p", // Ensure compatibility with most players
          "-shortest", // Stop when the shortest input (audio) ends
          "-tune stillimage", // Optimize for static image
          "-r 30" // 30 fps
        ])
        .save(outputPath)
        .on("end", () => {
          console.log(`✅ Video rendered successfully: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error(`❌ Error rendering video:`, err);
          reject(err);
        });
    });
  }
}
