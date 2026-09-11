import { describe, it, expect } from 'vitest';
import { isTypeCompatible, getSuggestedTransformers } from '../types/compatibility.js';

describe('Data Types Compatibility Matrix', () => {
  it('should treat identical types as compatible', () => {
    expect(isTypeCompatible('TEXT', 'TEXT')).toBe(true);
    expect(isTypeCompatible('VIDEO', 'VIDEO')).toBe(true);
    expect(isTypeCompatible('JSON', 'JSON')).toBe(true);
  });

  it('should accept compatible coercion paths directly', () => {
    expect(isTypeCompatible('TEXT', 'AI_RESPONSE')).toBe(true);
    expect(isTypeCompatible('AI_RESPONSE', 'TEXT')).toBe(true);
    expect(isTypeCompatible('TRANSCRIPT', 'TEXT')).toBe(true);
    expect(isTypeCompatible('JSON', 'TEXT')).toBe(true);
    expect(isTypeCompatible('TABLE', 'JSON')).toBe(true);
  });

  it('should detect incompatible types that require transformation', () => {
    expect(isTypeCompatible('VIDEO', 'TEXT')).toBe(false);
    expect(isTypeCompatible('IMAGE', 'TEXT')).toBe(false);
    expect(isTypeCompatible('JSON', 'TABLE')).toBe(false);
    expect(isTypeCompatible('AUDIO', 'TEXT')).toBe(false);
  });

  it('should suggest specific transformer nodes for incompatible types', () => {
    const videoToText = getSuggestedTransformers('VIDEO', 'TEXT');
    expect(videoToText.length).toBeGreaterThan(0);
    expect(videoToText[0].transformerNodeType).toBe('extractor-transcript');

    const imageToText = getSuggestedTransformers('IMAGE', 'TEXT');
    expect(imageToText.length).toBeGreaterThan(0);
    expect(imageToText[0].transformerNodeType).toBe('ai-vision');

    const jsonToTable = getSuggestedTransformers('JSON', 'TABLE');
    expect(jsonToTable.length).toBeGreaterThan(0);
    expect(jsonToTable[0].transformerNodeType).toBe('transform-data-formatter');
  });

  it('should return empty suggestions for already compatible types', () => {
    expect(getSuggestedTransformers('TEXT', 'TEXT')).toEqual([]);
  });
});
