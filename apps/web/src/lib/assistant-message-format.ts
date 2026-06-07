/** Plain-text chat display — no Markdown symbols in assistant bubbles. */
export function formatAssistantMessage(text: string): string {
  let result = text;

  result = result.replace(/^#{1,6}\s+/gm, '');
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/\*([^*\n]+)\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');
  result = result.replace(/_([^_\n]+)_/g, '$1');
  result = result.replace(/`([^`]+)`/g, '$1');
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  result = result.replace(/^[\s]*[-*•]\s+/gm, '🔹 ');
  result = result.replace(/\*\*/g, '');
  result = result.replace(/__/g, '');
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
