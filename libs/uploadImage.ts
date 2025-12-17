import { fileTypeFromBuffer } from "file-type";

interface UploadResponse {
  url?: string;
  response?: string;
  ok: boolean;
}

async function uploader(
  imageBuffer: Buffer,
  filename: string = `yuki-${Date.now()}-${Math.random()}`
): Promise<UploadResponse> {
  try {
    const fileType = await fileTypeFromBuffer(imageBuffer);
    const ext = fileType?.ext || 'bin';

    const form = new FormData();
    const blob = new Blob([imageBuffer], {
      type: fileType?.mime || 'application/octet-stream'
    });
    form.append('file', blob, `${filename}.${ext}`);

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    return {
      url: data.data.url.trim().replace("tmpfiles.org/", "tmpfiles.org/dl/"),
      ok: response.status === 200
    };
  } catch (error) {
    console.error(error);
    return {
      response: error instanceof Error ? error.message : 'Unknown error',
      ok: false
    };
  }
}

export { uploader };
