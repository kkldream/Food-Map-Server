import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import {compressImageBufferToBase64} from '../../models/service/imageService';

const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

async function createPngBuffer(width: number, height: number): Promise<Buffer> {
    return sharp({
        create: {
            width,
            height,
            channels: 3,
            background: {r: 255, g: 255, b: 255}
        }
    }).png().toBuffer();
}

describe('imageService', () => {
    it('converts a png buffer to jpeg metadata and base64 content', async () => {
        const input = Buffer.from(tinyPngBase64, 'base64');
        const result = await compressImageBufferToBase64(input, 0.6);

        expect(result.format).toBe('jpeg');
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(result.length).toBeGreaterThan(0);
        expect(Buffer.from(result.data, 'base64').subarray(0, 2).toString('hex')).toBe('ffd8');
    });

    it('resizes oversized portrait images using the legacy long-side limit', async () => {
        const input = await createPngBuffer(1000, 4000);
        const result = await compressImageBufferToBase64(input, 0.6);

        expect(result.width).toBe(256);
        expect(result.height).toBe(600);
        expect(result.format).toBe('jpeg');
    });
});
