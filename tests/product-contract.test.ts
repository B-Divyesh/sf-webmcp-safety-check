import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('product contract', () => {
  it('@claim:asset-provenance ships the generated image source, prompt, and provenance record', async () => {
    const [design, prompt, source] = await Promise.all([
      readFile(resolve('.factory/design.md'), 'utf8'),
      readFile(resolve('assets/src/field-guide-hero.prompt.json'), 'utf8'),
      stat(resolve('assets/src/field-guide-hero.png'))
    ]);
    expect(design).toContain('Generated with the factory Azure image deployment');
    expect(JSON.parse(prompt)).toMatchObject({ deployment: 'factory-image' });
    expect(source.size).toBeGreaterThan(1_000);
  });
});
