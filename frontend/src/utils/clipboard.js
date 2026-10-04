/**
 * Universal copyToClipboard helper.
 * Works seamlessly in both Secure Contexts (HTTPS, localhost)
 * and Insecure Contexts (HTTP on mobile LAN IP like http://192.168.x.x:5173).
 *
 * @param {string} text - text to copy
 * @returns {Promise<boolean>} whether copy succeeded
 */
export async function copyToClipboard(text) {
  if (text === undefined || text === null) return false;
  const str = String(text);

  // 1. Try modern Clipboard API if supported and available (HTTPS / localhost)
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText failed, attempting fallback:', err);
    }
  }

  // 2. Fallback for insecure contexts (HTTP over LAN IP on mobile devices)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = str;

    // Prevent scrolling and viewport zooming on mobile devices
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', ''); // Prevents virtual keyboard from opening on mobile

    document.body.appendChild(textArea);

    // Mobile selection range support
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, str.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    return Boolean(success);
  } catch (err) {
    console.error('[Clipboard] Fallback document.execCommand copy failed:', err);
    return false;
  }
}
