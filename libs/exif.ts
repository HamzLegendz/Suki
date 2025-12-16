import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import ff from 'fluent-ffmpeg';
import webp from 'node-webpmux';
import { join } from 'path';

const temp = process.platform === 'win32' ? process.env.TEMP! : tmpdir();

interface MediaInput {
  data: Buffer;
  ext?: string;
  mimetype?: string;
}

interface StickerMetadata {
  packId?: string;
  packName?: string;
  packPublish?: string;
  androidApp?: string;
  iOSApp?: string;
  emojis?: string[];
  isAvatar?: number;
}

export async function imageToWebp(media: MediaInput): Promise<Buffer> {
  const tmpFileIn = join(temp, `${randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'png'}`);
  const tmpFileOut = join(temp, `${randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

  await Bun.write(tmpFileIn, media.data);

  try {
    await new Promise<boolean>((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-sws_flags', 'lanczos',
          '-vf',
          "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0",
        ])
        .toFormat('webp')
        .saveToFile(tmpFileOut);
    });

    await Bun.file(tmpFileIn).delete();
    const buff = Buffer.from(await Bun.file(tmpFileOut).arrayBuffer());
    await Bun.file(tmpFileOut).delete();

    return buff;
  } catch (e) {
    const fileIn = Bun.file(tmpFileIn);
    const fileOut = Bun.file(tmpFileOut);

    if (await fileIn.exists()) await fileIn.delete();
    if (await fileOut.exists()) await fileOut.delete();

    throw e;
  }
}

export async function videoToWebp(media: MediaInput): Promise<Buffer> {
  const tmpFileIn = join(temp, `${randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'mp4'}`);
  const tmpFileOut = join(temp, `${randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

  await Bun.write(tmpFileIn, media.data);

  try {
    await new Promise<boolean>((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-sws_flags', 'lanczos',
          '-vf',
          "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,fps=15",
          '-loop', '0',
          '-ss', '00:00:00',
          '-t', '00:00:10',
          '-preset', 'default',
          '-an',
          '-vsync', '0',
        ])
        .toFormat('webp')
        .saveToFile(tmpFileOut);
    });

    await Bun.file(tmpFileIn).delete();
    const buff = Buffer.from(await Bun.file(tmpFileOut).arrayBuffer());
    await Bun.file(tmpFileOut).delete();

    return buff;
  } catch (e) {
    const fileIn = Bun.file(tmpFileIn);
    const fileOut = Bun.file(tmpFileOut);

    if (await fileIn.exists()) await fileIn.delete();
    if (await fileOut.exists()) await fileOut.delete();

    throw e;
  }
}

export async function writeExif(media: MediaInput, metadata?: StickerMetadata): Promise<Buffer | null> {
  let wMedia: Buffer;

  if (/webp/.test(media.mimetype || '')) {
    wMedia = media.data;
  } else if (/image/.test(media.mimetype || '')) {
    wMedia = await imageToWebp(media);
  } else if (/video/.test(media.mimetype || '')) {
    wMedia = await videoToWebp(media);
  } else {
    return null;
  }

  if (metadata && Object.keys(metadata).length !== 0) {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': metadata.packId || `DitzDev-${Date.now()}`,
      'sticker-pack-name': metadata.packName || '',
      'sticker-pack-publisher': metadata.packPublish || '',
      'android-app-store-link': metadata.androidApp || 'https://github.com/DitzDev/Yuki',
      'ios-app-store-link': metadata.iOSApp || 'https://github.com/DitzDev/Yuki',
      emojis: metadata.emojis || ['😋', '😎', '🤣', '😂', '😁'],
      'is-avatar-sticker': metadata.isAvatar || 0,
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(wMedia);
    img.exif = exif;

    return await img.save(null);
  }

  return wMedia;
}
