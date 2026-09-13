import { expect, it } from 'vitest';
import { demoAction, greeting } from '../../src/demo/telegram-copy';
it('accepts explicit conversational actions without requiring slash commands', () => {
  expect(demoAction('Yes, send it!')).toBe('confirm');
  expect(demoAction('confirm my request')).toBe('confirm');
  expect(demoAction('simulate paid visit')).toBe('purchase');
  expect(demoAction('show my request')).toBe('state');
  expect(demoAction('yes', true)).toBe('confirm');
  expect(demoAction('yes')).toBe('message');
});
it('does not turn questions, quoted intent or real payment claims into actions', () => {
  for (const text of ['I paid', 'yes', 'do not confirm', 'Can you simulate paid visit?', 'What happens if I say send it?']) expect(demoAction(text)).toBe('message');
});
it('discloses AI and test shop without a slash-command menu', () => {
  expect(greeting).toContain('AI host'); expect(greeting).toContain('test shop'); expect(greeting).not.toContain('/confirm');
});
