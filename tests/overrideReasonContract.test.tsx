import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { InterviewConflictModal } from '../src/components/Candidate/InterviewConflictModal';
const state = vi.hoisted(() => ({ reason: '', confirmed: false }));
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => actual.useState(
    initial === '' ? state.reason : initial === false ? state.confirmed : initial,
  ) };
});
describe('Override modal uses Backend reason bounds', () => {
  it.each([
    ['a', true], ['abc', true], ['x'.repeat(2000), true], ['x'.repeat(2001), false], ['   ', false], ['', false],
  ])('reason length %s is valid: %s', (reason, valid) => {
    state.reason = reason as string; state.confirmed = true;
    const html = renderToString(<InterviewConflictModal isOpen onClose={vi.fn()} onConfirmOverride={vi.fn()}
      conflictResult={{ hasConflict: true, conflictType: 'ROOM_CONFLICT', conflicts: [] }} />);
    const button = html.match(/<button\b[^>]*>[\s\S]*?<span>Xác nhận lưu lịch<\/span>[\s\S]*?<\/button>/g)?.at(-1);
    // Match only the final action, not earlier close/navigation buttons.
    const opening = button?.slice(button.lastIndexOf('<button'), button.indexOf('>', button.lastIndexOf('<button')) + 1);
    expect(opening).toBeDefined();
    expect(opening?.includes('disabled=""')).toBe(!valid);
    expect(html).toContain('maxLength="2000"');
    expect(html).not.toContain('5 ký tự tối thiểu');
  });
});
