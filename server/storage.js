import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function getEncryptionKey(value) {
  if (!value) {
    throw new Error('Set YOUTUBE_TOKEN_ENCRYPTION_KEY before connecting YouTube.');
  }

  const key = /^[a-f0-9]{64}$/i.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64');

  if (key.length !== 32) {
    throw new Error('YOUTUBE_TOKEN_ENCRYPTION_KEY must be 32 random bytes in hex or base64.');
  }

  return key;
}

export function encryptStore(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);

  return JSON.stringify({
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  });
}

export function decryptStore(value, key) {
  const envelope = JSON.parse(value);
  if (envelope.version !== 1) {
    throw new Error('Unsupported token store format.');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

export function createTokenStore(filePath, getKey) {
  let value = null;
  let writeQueue = Promise.resolve();

  return {
    async load() {
      try {
        const content = await readFile(filePath, 'utf8');
        value = decryptStore(content, getKey());
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }

      return value;
    },
    get() {
      return value;
    },
    async save(nextValue) {
      const key = getKey();
      const directory = path.dirname(filePath);
      await mkdir(directory, { recursive: true });
      const temporaryPath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
      const encrypted = encryptStore(nextValue, key);

      writeQueue = writeQueue.then(async () => {
        await writeFile(temporaryPath, encrypted, { mode: 0o600 });
        await rename(temporaryPath, filePath);
        value = nextValue;
      });

      await writeQueue;
      return value;
    },
    async clear() {
      writeQueue = writeQueue.then(async () => {
        const { unlink } = await import('node:fs/promises');
        try {
          await unlink(filePath);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        value = null;
      });

      await writeQueue;
    },
  };
}
