import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { success, failure, print } from '../../src/lib/output.js';

describe('success', () => {
  it('creates an ok:true envelope with data', () => {
    const result = success({ foo: 'bar' });
    expect(result).toEqual({ ok: true, data: { foo: 'bar' } });
  });

  it('creates an ok:true envelope with empty data', () => {
    const result = success({});
    expect(result).toEqual({ ok: true, data: {} });
  });
});

describe('failure', () => {
  it('creates an ok:false envelope with error string', () => {
    const result = failure('Something went wrong');
    expect(result).toEqual({ ok: false, error: 'Something went wrong' });
  });
});

describe('print', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it('outputs compact JSON by default', () => {
    print(success({ x: 1 }), false);
    expect(writeSpy).toHaveBeenCalledWith('{"ok":true,"data":{"x":1}}\n');
  });

  it('outputs pretty JSON when pretty=true', () => {
    print(success({ x: 1 }), true);
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('  "ok": true');
    expect(output).toContain('  "data":');
  });
});
