import { BadRequestException } from '@nestjs/common';

/**
 * Validates image buffer signatures (magic bytes) to prevent MIME spoofing or malicious executable uploads.
 */
export function validateImageSignature(buffer: Buffer, declaredMimeType: string): void {
  if (!buffer || buffer.length < 12) {
    throw new BadRequestException('Invalid or empty image file buffer');
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61;
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  let detectedMimeType: string | null = null;
  if (isJpeg) detectedMimeType = 'image/jpeg';
  else if (isPng) detectedMimeType = 'image/png';
  else if (isGif) detectedMimeType = 'image/gif';
  else if (isRiff) detectedMimeType = 'image/webp';

  if (!detectedMimeType) {
    throw new BadRequestException(
      'Corrupted or unsupported file signature. Upload rejected for security.',
    );
  }

  // Ensure binary content matches declared header
  const normalizedDeclared = declaredMimeType.toLowerCase().trim();
  if (
    normalizedDeclared !== detectedMimeType &&
    !(normalizedDeclared === 'image/jpg' && detectedMimeType === 'image/jpeg')
  ) {
    throw new BadRequestException(
      `MIME type mismatch: declared '${declaredMimeType}' but detected '${detectedMimeType}' from file signature.`,
    );
  }
}
