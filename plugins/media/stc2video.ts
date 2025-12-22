import type { PluginHandler } from "@yuki/types";
import sharp from "sharp";
import { unlink } from "fs/promises";
import { randomBytes } from "crypto";

let handler: PluginHandler = {
  name: "Convert sticker/audio to video",
  description: "Convert a sticker or audio to video",
  usage: [".tovideo <reply-to-sticker>"],
  tags: ["media"],
  register: true,
  limit: true,
  cmd: ["tovideo", "tovidio", "tovid"],
  exec: async (m, { conn, usedPrefix, command }) => {
    if (!m.quoted) throw `• *Reply to the sticker or audio by sending the command:* ${usedPrefix + command!!}`;

    m.react("⏳");

    let mime = m.quoted.mimetype || "";
    if (!/webp|audio/.test(mime)) throw `Reply sticker or audio with caption *${usedPrefix + command!!}*`;

    let media = await m.quoted.download();
    let out = Buffer.alloc(0);

    try {
      if (/webp/.test(mime)) {
        const tempFile = `/tmp/video-${randomBytes(8).toString('hex')}.mp4`;

        const metadata = await sharp(media, { animated: true }).metadata();
        const isAnimated = (metadata.pages || 1) > 1;

        if (isAnimated) {
          // Since WhatsApp uses ".was" as the animated sticker format, we can't get the frames easily.
          // TODO: We have to find another way, for example, is it true that .was format is for animated stickers?
          // If not, then we can easily extract the frame.
          m.react("❌");
          return m.reply("❌ You can't convert animated stickers to videos at this time.")
        } else {
          const pngBuffer = await sharp(media)
            .flatten({ background: '#ffffff' })
            .png()
            .toBuffer();

          const proc = Bun.spawn([
            "ffmpeg",
            "-loop", "1",
            "-framerate", "25",
            "-i", "pipe:0",
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-t", "3",
            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white",
            "-movflags", "+faststart",
            "-y",
            tempFile
          ], {
            stdin: "pipe",
            stderr: "pipe",
          });

          proc.stdin.write(pngBuffer);
          proc.stdin.end();

          const stderrText = await new Response(proc.stderr).text();
          const exitCode = await proc.exited;

          if (exitCode !== 0) {
            console.error("FFmpeg stderr:", stderrText);
            throw new Error(`FFmpeg failed with exit code ${exitCode}`);
          }
        }

        out = Buffer.from(await Bun.file(tempFile).arrayBuffer());

        await unlink(tempFile).catch(() => { });

        if (out.length === 0) {
          throw new Error("Output file is empty");
        }

      } else if (/audio/.test(mime)) {
        const tempFile = `/tmp/video-${randomBytes(8).toString('hex')}.mp4`;

        const proc = Bun.spawn([
          "ffmpeg",
          "-f", "lavfi",
          "-i", "color=c=black:s=640x480:r=25",
          "-i", "pipe:0",
          "-c:v", "libx264",
          "-tune", "stillimage",
          "-c:a", "aac",
          "-b:a", "192k",
          "-pix_fmt", "yuv420p",
          "-shortest",
          "-movflags", "+faststart",
          "-y",
          tempFile
        ], {
          stdin: "pipe",
          stderr: "pipe",
        });

        proc.stdin.write(media);
        proc.stdin.end();

        const stderrText = await new Response(proc.stderr).text();
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          console.error("FFmpeg stderr:", stderrText);
          throw new Error(`FFmpeg failed with exit code ${exitCode}`);
        }

        out = Buffer.from(await Bun.file(tempFile).arrayBuffer());
        await unlink(tempFile).catch(() => { });

        if (out.length === 0) {
          throw new Error("Output file is empty");
        }
      }

      m.react("✅");
      await conn!!.sendFile(m.chat, out, `video-${Date.now()}.mp4`, "Success!", m);

    } catch (e: any) {
      console.error("Conversion error:", e);
      m.react("❌");
      throw `Failed to convert to video: ${e.message}`;
    }
  }
}

export default handler;
