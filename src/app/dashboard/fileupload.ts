'use server';
import { s3 } from '@/lib/s3';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const CLOUDFRONT_URL = 'https://d9ylgh2z4lcdz.cloudfront.net';
const BUCKET_NAME = 'winuwatch';

/**
 * Uploads files to S3 and returns the permalink to the file.
 * If the file is an image, it converts it to WebP.
 * If the file is a video, it converts it to WebM.
 * @param {FormData} formData - The file to be uploaded.
 * @returns {Promise<{url :string|null, error: string|null}>} The permalink to the file or an error message.
 * @throws {Error} if the file is not an image or a video, or if the upload or conversion fails.
 */
export const fileUpload = async (
  formData: FormData,
  folder = 'winners',
): Promise<{
  url: string | null;
  error: string | null;
}> => {
  try {
    if (!formData.has('file')) {
      throw new Error('File name is not defined');
    }
    const file = formData.get('file') as File;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      throw new Error('File extension not found');
    }

    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension);
    const isVideo = ['mp4', 'webm'].includes(fileExtension);
    if (!isImage && !isVideo) {
      throw new Error('File is not an image or a video');
    }

    const fileBuffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    if (fileBuffer.byteLength > 5 * 1024 * 1024) {
      // 5 MB
      throw new Error('File is too big');
    }

    // const fileName = `${file.name.split('.').slice(0, -1).join('.')}.${isImage ? 'webp' : fileExtension}`;
    const fileName_ext = `${folder}/${new Date().getTime()}.${isImage ? 'webp' : fileExtension}`;
    const uploadResult = await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName_ext,
        Body: isImage ? await sharp(fileBuffer).webp().toBuffer() : fileBuffer,
        ContentType: isImage ? 'image/webp' : `video/${fileExtension}`,
      }),
    );
    if (!uploadResult) {
      throw new Error('Upload failed');
    }
    return {
      url: `${CLOUDFRONT_URL}/${fileName_ext}`,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      error: JSON.stringify(error instanceof Error ? error.message : error),
    };
  }
};

// /**
//  * Converts a video buffer to WebM format.
//  * @param {Buffer} buffer - The video buffer to be converted.
//  * @returns {Promise<Buffer>} The converted WebM buffer.
//  */
// const convertVideoToH264 = (buffer: Buffer): Promise<Buffer> => {
//   return new Promise((resolve, reject) => {
//     const chunks: Array<Buffer> = [];
//     const readableStream = new Readable({
//       read() {
//         this.push(buffer);
//         this.push(null);
//       },
//     });

//     ffmpeg(readableStream)
//       .outputOptions([
//         '-c:v libx264', // Use the libx264 codec for H.264 encoding
//         '-crf 23', // Constant Rate Factor (lower means better quality)
//         '-preset medium', // Encoding speed/quality trade-off
//         '-movflags faststart', // Enables streaming-friendly file
//       ])
//       .format('mp4') // Output format as MP4
//       .on('data', (chunk) => chunks.push(chunk as Buffer))
//       .on('end', () => resolve(Buffer.concat(chunks)))
//       .on('error', reject)
//       .run();
//   });
// };
