// Invoke browser sharing in the click's call stack, before any image work or wait.
// The UI owns confirmations and the selected-text fallback for a manual copy.
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
      await platform.share({text});
      return 'shared';
    }
  } catch (error){
    // Cancelling the native sheet is complete; it must not cause another action.
    if (error?.name === 'AbortError') return 'cancelled';
  }
  return copyResultText(text, platform);
}
