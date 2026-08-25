import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { IStorageService, GetObjectResult } from './storage.interface';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly configured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('B2_ENDPOINT');
    const region = this.configService.get<string>('B2_REGION') || 'us-east-005';
    const accessKeyId = this.configService.get<string>('B2_APPLICATION_KEY_ID');
    const secretAccessKey = this.configService.get<string>('B2_APPLICATION_KEY');
    this.bucketName = this.configService.get<string>('B2_BUCKET_NAME') || '';

    if (endpoint && accessKeyId && secretAccessKey && this.bucketName) {
      try {
        this.s3Client = new S3Client({
          endpoint,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: true,
        });
        this.configured = true;
        this.logger.log(`StorageService initialized with endpoint: ${endpoint}, bucket: ${this.bucketName}`);
      } catch (err) {
        this.logger.error(`Failed to initialize S3Client: ${(err as Error).message}`);
        this.configured = false;
      }
    } else {
      this.logger.warn(
        'Storage credentials are not fully configured. Storage operations will be unavailable until environment variables are supplied.',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured && this.s3Client !== null;
  }

  private ensureConfigured() {
    if (!this.isConfigured() || !this.s3Client) {
      throw new ServiceUnavailableException(
        'Object storage is not configured. Please supply B2_ENDPOINT, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME in environment configuration.',
      );
    }
  }

  async uploadObject(
    key: string,
    body: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    this.ensureConfigured();

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client!.send(command);
      this.logger.debug(`Uploaded object: ${key} (${contentType}, ${body.length} bytes)`);
    } catch (error) {
      this.logger.error(`Error uploading object ${key}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  async getObject(key: string): Promise<GetObjectResult> {
    this.ensureConfigured();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client!.send(command);
      return {
        stream: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength,
      };
    } catch (error) {
      this.logger.error(`Error fetching object ${key}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to retrieve file from storage');
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.ensureConfigured();

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client!.send(command);
      this.logger.debug(`Deleted object: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting object ${key}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  async createSignedDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    this.ensureConfigured();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client!, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Error generating signed URL for ${key}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to generate secure download URL');
    }
  }
}
