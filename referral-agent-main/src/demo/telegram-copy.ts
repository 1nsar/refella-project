export function demoAction(text: string, awaitingConfirmation = false): 'confirm' | 'purchase' | 'state' | 'message' {
  const value = text.trim().toLowerCase().replace(/[.!?]+$/, '');
  if (awaitingConfirmation && /^(yes|yes please|sounds good|go ahead)$/.test(value)) return 'confirm';
  if (/^(\/confirm|confirm my request|confirm|yes,? send it|send it)$/.test(value)) return 'confirm';
  if (/^(\/purchase|simulate (a )?paid visit|simulate payment|try the payment demo)$/.test(value)) return 'purchase';
  if (/^(\/status|status|my status|show my request|check my rewards)$/.test(value)) return 'state';
  return 'message';
}
export const greeting = "Hey, welcome to Studio Demo. Maya sent you? You're in the right place.\n\nI'm the shop's AI host. Just a haircut, or the beard too?\n\nThis is a test shop: no real appointments or charges. Please keep personal and payment details out of the chat.";
