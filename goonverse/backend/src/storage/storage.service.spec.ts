import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { generateImageStorageKey } from './storage.interface';
import { ServiceUnavailableException } from '@nestjs/common';

describe('StorageService', () => {
  describe('Unconfigured Environment', () => {
    let service: StorageService;

    beforeEach(() => {
      const emptyConfigService = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;
      service = new StorageService(emptyConfigService);
    });

    it('should report isConfigured() as false when credentials are missing', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('should throw ServiceUnavailableException when uploadObject is called without credentials', async () => {
      await expect(
        service.uploadObject('test/key', Buffer.from('data'), 'image/jpeg'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when getObject is called without credentials', async () => {
      await expect(service.getObject('test/key')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when deleteObject is called without credentials', async () => {
      await expect(service.deleteObject('test/key')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when createSignedDownloadUrl is called without credentials', async () => {
      await expect(service.createSignedDownloadUrl('test/key')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('Storage Key Generation', () => {
    it('should generate canonical private storage key for original variant', () => {
      const key = generateImageStorageKey(
        'user-123',
        'person-456',
        'image-789',
        'original',
      );
      expect(key).toBe('users/user-123/people/person-456/images/image-789/original');
    });

    it('should generate canonical storage key for thumbnail variant', () => {
      const key = generateImageStorageKey(
        'user-123',
        'person-456',
        'image-789',
        'thumbnail',
      );
      expect(key).toBe('users/user-123/people/person-456/images/image-789/thumbnail');
    });
  });
});
