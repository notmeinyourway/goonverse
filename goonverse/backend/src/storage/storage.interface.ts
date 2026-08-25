import { Readable } from 'stream';

export interface StorageObjectMetadata {
  contentType: string;
  contentLength?: number;
  lastModified?: Date;
  metadata?: Record<string, string>;
}

export interface GetObjectResult {
  stream: Readable;
  contentType: string;
  contentLength?: number;
}

export interface IStorageService {
  isConfigured(): boolean;
  uploadObject(
    key: string,
    body: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<void>;
  getObject(key: string): Promise<GetObjectResult>;
  deleteObject(key: string): Promise<void>;
  createSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Generates canonical, private storage key formatted:
 * users/{userId}/people/{personId}/images/{imageId}/{variant}
 */
export function generateImageStorageKey(
  userId: string,
  personId: string,
  imageId: string,
  variant: 'original' | 'thumbnail' = 'original',
): string {
  return `users/${userId}/people/${personId}/images/${imageId}/${variant}`;
}
