const HEADER_RULES = [
  { prefix: 'J/SJ', label: 'JTA' },
  { prefix: 'S/SJ', label: 'SINARBINTANG TIMRA MEDAN' },
  { prefix: 'SJ/', label: 'SINAR BINTANG TUNGGAL MANDIRI' },
] as const;

/**
 * Tentukan header label otomatis berdasarkan awalan nomor surat jalan.
 * Urutan aturan sengaja paling spesifik lebih dulu agar tidak tertukar.
 */
export function labelHeaderForSuratJalan(noSuratJalan: string): string | null {
  const normalized = noSuratJalan.toUpperCase().replace(/\s+/g, '');
  const rule = HEADER_RULES.find((r) => normalized.startsWith(r.prefix));
  return rule?.label ?? null;
}
