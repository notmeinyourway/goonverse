import { BadRequestException } from '@nestjs/common';
import { validateImageSignature } from './file-signature.validator';

describe('Phase 5 Security & File Validation Suite', () => {
  describe('File Signature & Magic Bytes Validator', () => {
    it('should accept valid JPEG buffer signature', () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(() => validateImageSignature(validJpeg, 'image/jpeg')).not.toThrow();
    });

    it('should accept valid PNG buffer signature', () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(() => validateImageSignature(validPng, 'image/png')).not.toThrow();
    });

    it('should accept valid WebP buffer signature', () => {
      const validWebp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      expect(() => validateImageSignature(validWebp, 'image/webp')).not.toThrow();
    });

    it('should accept valid GIF buffer signature', () => {
      const validGif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      expect(() => validateImageSignature(validGif, 'image/gif')).not.toThrow();
    });

    it('should reject disguised executable (.exe / ELF / sh) disguised as image/jpeg', () => {
      // Windows MZ executable signature
      const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      expect(() => validateImageSignature(fakeExe, 'image/jpeg')).toThrow(BadRequestException);
    });

    it('should reject MIME type mismatch (e.g. PNG buffer sent with image/jpeg header)', () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(() => validateImageSignature(validPng, 'image/jpeg')).toThrow(BadRequestException);
    });

    it('should reject truncated or empty file buffers', () => {
      const truncated = Buffer.from([0xff, 0xd8]);
      expect(() => validateImageSignature(truncated, 'image/jpeg')).toThrow(BadRequestException);
    });
  });
});
