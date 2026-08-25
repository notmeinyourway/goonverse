import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ImagesService', () => {
  let service: ImagesService;
  let prisma: any;
  let storageService: any;

  beforeEach(async () => {
    prisma = {
      person: { findFirst: jest.fn() },
      image: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      tag: { upsert: jest.fn().mockResolvedValue({ id: 'tag-1' }) },
      imageTag: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((callback) => {
        return callback({
          image: {
            create: jest.fn().mockResolvedValue({
              id: 'image-1',
              user_id: 'user-1',
              person_id: 'person-1',
              storage_key: 'users/user-1/people/person-1/images/image-1/original',
              original_filename: 'photo.jpg',
              mime_type: 'image/jpeg',
              file_size: 1024,
              created_at: new Date(),
            }),
          },
          tag: { upsert: jest.fn().mockResolvedValue({ id: 'tag-1' }) },
          imageTag: { create: jest.fn() },
        });
      }),
    };

    storageService = {
      uploadObject: jest.fn().mockResolvedValue(undefined),
      createSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url.com/img'),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
  });

  it('should reject file upload with invalid MIME type', async () => {
    const invalidFile = {
      buffer: Buffer.from('fake'),
      mimetype: 'application/x-executable',
      originalname: 'virus.exe',
      size: 100,
    } as Express.Multer.File;

    await expect(
      service.upload('user-1', invalidFile, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject upload if personId does not belong to user', async () => {
    const validFile = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
      size: 1000,
    } as Express.Multer.File;

    prisma.person.findFirst.mockResolvedValue(null);

    await expect(
      service.upload('user-1', validFile, { personId: 'person-belonging-to-other' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should upload valid image to private storage and save metadata in DB', async () => {
    const validFile = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
      size: 1000,
    } as Express.Multer.File;

    prisma.person.findFirst.mockResolvedValue({ id: 'person-1', user_id: 'user-1' });

    const result = await service.upload('user-1', validFile, {
      personId: 'person-1',
      tags: 'cute,portrait',
    });

    expect(result.original_filename).toBe('photo.jpg');
    expect(result.tags).toEqual(['cute', 'portrait']);
    expect(storageService.uploadObject).toHaveBeenCalled();
  });

  it('should generate temporary signed URL for owner', async () => {
    prisma.image.findFirst.mockResolvedValue({
      id: 'image-1',
      user_id: 'user-1',
      storage_key: 'users/user-1/people/person-1/images/image-1/original',
      original_filename: 'photo.jpg',
      mime_type: 'image/jpeg',
      file_size: 1000,
      deleted_at: null,
    });

    const result = await service.getImageAccess('user-1', 'image-1', 900);
    expect(result.url).toBe('https://signed-url.com/img');
    expect(result.expiresIn).toBe(900);
  });

  it('should throw NotFoundException when non-owner requests signed URL', async () => {
    prisma.image.findFirst.mockResolvedValue(null);
    await expect(service.getImageAccess('user-2', 'image-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
