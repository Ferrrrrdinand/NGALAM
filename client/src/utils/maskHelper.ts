/**
 * NGALAM FIX PRO - Mask Helper
 * Menyensor nama pelanggan demi menjaga privasi data.
 * Hanya menampilkan beberapa huruf awal dari setiap kata, sisanya disensor dengan bintang (*).
 *
 * Contoh:
 * - "Dimas Prasetyo"  -> "Di*** Pra*****"
 * - "Siti Rahmawati"  -> "Si** Rah******"
 * - "Budi Santoso"    -> "Bu** San****"
 * - "Rian Pratama"    -> "Ri** Pra****"
 */
export function maskCustomerName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return 'Member Terverifikasi';
  const trimmed = name.trim();
  if (!trimmed) return 'Member Terverifikasi';

  const parts = trimmed.split(/\s+/);
  return parts
    .map((part) => {
      const len = part.length;
      if (len <= 2) {
        return part[0] + '*';
      } else if (len === 3) {
        return part.slice(0, 2) + '*';
      } else {
        const showCount = len <= 4 ? 2 : Math.min(3, Math.floor(len / 2));
        return part.slice(0, showCount) + '*'.repeat(len - showCount);
      }
    })
    .join(' ');
}
