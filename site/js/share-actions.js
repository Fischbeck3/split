// Invoke browser sharing in the click's call stack, before any image work or wait.
// The UI owns confirmations and the selected-text fallback for a manual copy.
function nativePayload(text){
  if (typeof text !== 'string') return {text};
  const lineBreak = text.lastIndexOf('\n');
  const link = text.slice(lineBreak + 1).trim();
  if (!/^https?:\/\/\S+$/i.test(link)) return {text};
  try {
    const parsed = new URL(link);
    if (!parsed.hostname || !['http:', 'https:'].includes(parsed.protocol)) return {text};
    // The URL gets its own native item, allowing Messages to recognize a link.
    // Keep it out of the native text so targets do not receive a duplicate URL.
    return {text:lineBreak < 0 ? '' : text.slice(0, lineBreak).replace(/\r$/, ''), url:link};
  } catch {
    return {text};
  }
}

export async function copyResultText(text, platform = globalThis.navigator){
  try {
    if (typeof platform?.clipboard?.writeText !== 'function') return 'manual';
    await platform.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}

export async function shareResultText(text, platform = globalThis.navigator){
  try {
    if (typeof platform?.share === 'function'){
      await platform.share(nativePayload(text));
      return 'shared';
    }
  } catch (error){
    // Cancelling the native sheet is complete; it must not cause another action.
    if (error?.name === 'AbortError') return 'cancelled';
  }
  return copyResultText(text, platform);
}
