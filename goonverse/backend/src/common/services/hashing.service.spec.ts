import { HashingService } from './hashing.service';

describe('HashingService', () => {
  let service: HashingService;

  beforeEach(() => {
    service = new HashingService();
  });

  it('should hash and verify passwords using Argon2id', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await service.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await service.verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);

    const isInvalid = await service.verifyPassword(hash, 'WrongPassword123!');
    expect(isInvalid).toBe(false);
  });

  it('should generate secure random tokens and hash them with SHA-256', () => {
    const token = service.generateSecureToken(32);
    expect(token).toHaveLength(64); // 32 bytes in hex = 64 characters

    const hash1 = service.hashToken(token);
    const hash2 = service.hashToken(token);
    expect(hash1).toHaveLength(64);
    expect(hash1).toEqual(hash2);
  });
});
