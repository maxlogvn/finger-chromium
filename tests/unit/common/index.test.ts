import { describe, it, expect } from 'vitest';
import { scripts } from '@src/common';

describe('scripts', () => {
  it('chứa waitForResize và getViewport', () => {
    expect(scripts).toHaveProperty('waitForResize');
    expect(scripts).toHaveProperty('getViewport');
  });

  it('waitForResize là function', () => {
    expect(typeof scripts.waitForResize).toBe('function');
  });

  it('getViewport là function', () => {
    expect(typeof scripts.getViewport).toBe('function');
  });

  it('getViewport trả về object với width và height', () => {
    const fnString = scripts.getViewport.toString();
    expect(fnString).toContain('width');
    expect(fnString).toContain('height');
    expect(fnString).toContain('window.innerWidth');
    expect(fnString).toContain('window.innerHeight');
  });

  it('waitForResize dùng ResizeObserver', () => {
    const fnString = scripts.waitForResize.toString();
    expect(fnString).toContain('ResizeObserver');
    expect(fnString).toContain('requestAnimationFrame');
    expect(fnString).toContain('document.body');
  });

  it('scripts là plain object không có prototype lạ', () => {
    expect(Object.keys(scripts)).toEqual(['waitForResize', 'getViewport']);
  });
});
