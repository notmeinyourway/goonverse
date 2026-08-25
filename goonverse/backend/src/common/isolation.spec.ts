import { Test, TestingModule } from '@nestjs/testing';
import { PeopleService } from '../people/people.service';
import { ImagesService } from '../images/images.service';
import { ActivitiesService } from '../activities/activities.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Multi-Tenant Data Isolation & Security (User A vs User B)', () => {
  let peopleService: PeopleService;
  let imagesService: ImagesService;
  let activitiesService: ActivitiesService;
  let prisma: any;

  const USER_A = 'user-uuid-aaaa-aaaa-aaaaaaaaaaaa';
  const USER_B = 'user-uuid-bbbb-bbbb-bbbbbbbbbbbb';

  const USER_B_PERSON_ID = 'person-uuid-bbbb-1111';
  const USER_B_IMAGE_ID = 'image-uuid-bbbb-2222';
  const USER_B_ACTIVITY_ID = 'activity-uuid-bbbb-3333';

  beforeEach(async () => {
    // Mock database with User B's resources
    const dbPeople = [
      {
        id: USER_B_PERSON_ID,
        user_id: USER_B,
        name: 'Bob Private Contact',
        notes: 'Confidential',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        images: [],
        _count: { images: 0, activities: 0 },
      },
    ];

    const dbImages = [
      {
        id: USER_B_IMAGE_ID,
        user_id: USER_B,
        person_id: USER_B_PERSON_ID,
        storage_key: `users/${USER_B}/people/${USER_B_PERSON_ID}/images/${USER_B_IMAGE_ID}/original`,
        original_filename: 'bobs_private_image.jpg',
        mime_type: 'image/jpeg',
        file_size: 2048,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        image_tags: [],
      },
    ];

    const dbActivities = [
      {
        id: USER_B_ACTIVITY_ID,
        user_id: USER_B,
        person_id: USER_B_PERSON_ID,
        image_id: USER_B_IMAGE_ID,
        occurred_at: new Date(),
        notes: 'Secret activity of Bob',
        created_at: new Date(),
        person: { id: USER_B_PERSON_ID, name: 'Bob Private Contact' },
        image: { id: USER_B_IMAGE_ID, original_filename: 'bobs_private_image.jpg', mime_type: 'image/jpeg' },
      },
    ];

    prisma = {
      person: {
        findFirst: jest.fn(({ where }) => {
          const match = dbPeople.find((p) => {
            if (where.id && p.id !== where.id) return false;
            if (where.user_id && p.user_id !== where.user_id) return false;
            if (where.deleted_at === null && p.deleted_at !== null) return false;
            return true;
          });
          return Promise.resolve(match || null);
        }),
        findMany: jest.fn(({ where }) => {
          const list = dbPeople.filter((p) => p.user_id === where.user_id && p.deleted_at === null);
          return Promise.resolve(list);
        }),
        count: jest.fn(({ where }) => {
          const count = dbPeople.filter((p) => p.user_id === where.user_id && p.deleted_at === null).length;
          return Promise.resolve(count);
        }),
        update: jest.fn(),
      },
      image: {
        findFirst: jest.fn(({ where }) => {
          const match = dbImages.find((img) => {
            if (where.id && img.id !== where.id) return false;
            if (where.user_id && img.user_id !== where.user_id) return false;
            if (where.deleted_at === null && img.deleted_at !== null) return false;
            return true;
          });
          return Promise.resolve(match || null);
        }),
        findMany: jest.fn(({ where }) => {
          const list = dbImages.filter((img) => img.user_id === where.user_id && img.deleted_at === null);
          return Promise.resolve(list);
        }),
        count: jest.fn(({ where }) => {
          const count = dbImages.filter((img) => img.user_id === where.user_id && img.deleted_at === null).length;
          return Promise.resolve(count);
        }),
        update: jest.fn(),
      },
      activity: {
        findFirst: jest.fn(({ where }) => {
          const match = dbActivities.find((a) => {
            if (where.id && a.id !== where.id) return false;
            if (where.user_id && a.user_id !== where.user_id) return false;
            return true;
          });
          return Promise.resolve(match || null);
        }),
        findMany: jest.fn(({ where }) => {
          const list = dbActivities.filter((a) => a.user_id === where.user_id);
          return Promise.resolve(list);
        }),
        count: jest.fn(({ where }) => {
          const count = dbActivities.filter((a) => a.user_id === where.user_id).length;
          return Promise.resolve(count);
        }),
        create: jest.fn(),
        delete: jest.fn(),
      },
      tag: { upsert: jest.fn() },
      imageTag: { create: jest.fn() },
      $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
    };

    const storageService = {
      uploadObject: jest.fn().mockResolvedValue(undefined),
      createSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed.url/image'),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeopleService,
        ImagesService,
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    peopleService = module.get<PeopleService>(PeopleService);
    imagesService = module.get<ImagesService>(ImagesService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
  });

  describe('People Isolation', () => {
    it('User A CANNOT view User B person even when User A knows User B personId', async () => {
      await expect(peopleService.findOne(USER_A, USER_B_PERSON_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A CANNOT update User B person', async () => {
      await expect(
        peopleService.update(USER_A, USER_B_PERSON_ID, { name: 'Hacked Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('User A CANNOT delete User B person', async () => {
      await expect(peopleService.remove(USER_A, USER_B_PERSON_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A list of people does NOT contain any of User B people', async () => {
      const listA = await peopleService.findAll(USER_A, { page: 1, limit: 20 });
      expect(listA.data).toHaveLength(0);
      expect(listA.meta.total).toBe(0);
    });
  });

  describe('Image Isolation & Signed URLs', () => {
    it('User A CANNOT get signed URL for User B image even with known imageId', async () => {
      await expect(imagesService.getImageAccess(USER_A, USER_B_IMAGE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A CANNOT delete User B image', async () => {
      await expect(imagesService.remove(USER_A, USER_B_IMAGE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A CANNOT upload image and link it to User B personId', async () => {
      const fakeFile = {
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 100,
      } as Express.Multer.File;

      await expect(
        imagesService.upload(USER_A, fakeFile, { personId: USER_B_PERSON_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('User A list of images does NOT include User B images', async () => {
      const imagesA = await imagesService.findAll(USER_A, { page: 1, limit: 20 });
      expect(imagesA.data).toHaveLength(0);
      expect(imagesA.meta.total).toBe(0);
    });
  });

  describe('Activity Isolation & Cross-Entity Validation', () => {
    it('User A CANNOT view User B activity even with known activityId', async () => {
      await expect(activitiesService.findOne(USER_A, USER_B_ACTIVITY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A CANNOT delete User B activity', async () => {
      await expect(activitiesService.remove(USER_A, USER_B_ACTIVITY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('User A CANNOT create activity referencing User B person', async () => {
      await expect(
        activitiesService.create(USER_A, { personId: USER_B_PERSON_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('User A CANNOT create activity referencing User B image', async () => {
      await expect(
        activitiesService.create(USER_A, { imageId: USER_B_IMAGE_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('User A list of activities does NOT contain User B activities', async () => {
      const activitiesA = await activitiesService.findAll(USER_A, { page: 1, limit: 20 });
      expect(activitiesA.data).toHaveLength(0);
      expect(activitiesA.meta.total).toBe(0);
    });
  });
});
