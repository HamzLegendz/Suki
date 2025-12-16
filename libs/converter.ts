import { join } from 'path';
import { $ } from 'bun';

const __dirname = import.meta.dir;

interface FFmpegResult {
  data: Buffer;
  filename: string;
  delete: () => Promise<void>;
}

async function ffmpeg(
  buffer: Buffer,
  args: string[] = [],
  ext: string = '',
  ext2: string = ''
): Promise<FFmpegResult> {
  const tmp = join(__dirname, '../tmp', `${Date.now()}.${ext}`);
  const out = `${tmp}.${ext2}`;

  try {
    await Bun.write(tmp, buffer);

    const result = await $`ffmpeg -y -i ${tmp} ${args} ${out}`.quiet();
    await Bun.write(tmp, '').then(() =>
      $`rm ${tmp}`.quiet()
    );

    if (result.exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${result.exitCode}`);
    }

    const file = Bun.file(out);
    const exists = await file.exists();

    if (!exists) {
      throw new Error('Output file not found');
    }

    const data = Buffer.from(await file.arrayBuffer());

    return {
      data,
      filename: out,
      async delete() {
        await $`rm ${out}`.quiet();
      }
    };
  } catch (e) {
    try {
      await $`rm -f ${tmp} ${out}`.quiet();
    } catch { }
    throw e;
  }
}

/**
 * Convert Audio to Playable WhatsApp Audio (PTT/Voice Note)
 * @param buffer Audio Buffer
 * @param ext File Extension 
 * @returns Promise with converted audio data
 */
function toPTT(buffer: Buffer, ext: string): Promise<FFmpegResult> {
  return ffmpeg(
    buffer,
    ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'],
    ext,
    'ogg'
  );
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param buffer Audio Buffer
 * @param ext File Extension 
 * @returns Promise with converted audio data
 */
function toAudio(buffer: Buffer, ext: string): Promise<FFmpegResult> {
  return ffmpeg(
    buffer,
    ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'],
    ext,
    'opus'
  );
}

/**
 * Convert Video to Playable WhatsApp Video
 * @param buffer Video Buffer
 * @param ext File Extension 
 * @returns Promise with converted video data
 */
function toVideo(buffer: Buffer, ext: string): Promise<FFmpegResult> {
  return ffmpeg(
    buffer,
    ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'],
    ext,
    'mp4'
  );
}

export { toAudio, toPTT, toVideo, ffmpeg };
export type { FFmpegResult };
