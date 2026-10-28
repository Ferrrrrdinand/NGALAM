/**
 * NGALAM FIX PRO - Kontak & Workshop Location Handler
 * Manages address copy to clipboard and customer contact actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('copyAddressBtn')?.addEventListener('click', () => {
    const text = document.getElementById('workshopAddressText')?.textContent.trim();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Alamat workshop berhasil disalin ke clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert('Alamat workshop berhasil disalin ke clipboard!');
      });
    }
  });
});
