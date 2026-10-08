import type { Customer, Product, SlipItem } from '@/types';

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cocokkan nama pelanggan dari PDF ke master customer (fuzzy). */
export function matchCustomer(namaPdf: string, customers: Customer[]): Customer | null {
  if (!namaPdf) return null;
  const target = norm(namaPdf);
  let best: Customer | null = null;
  let bestScore = 0;
  for (const c of customers) {
    const cn = norm(c.nama);
    if (!cn) continue;
    let score = 0;
    if (cn === target) score = 100;
    else if (target.includes(cn) || cn.includes(target)) score = 80;
    else {
      const a = new Set(target.split(' '));
      const b = new Set(cn.split(' '));
      const overlap = [...a].filter((w) => b.has(w) && w.length > 2).length;
      const denom = Math.max(1, Math.min(a.size, b.size));
      score = (overlap / denom) * 60;
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return bestScore >= 50 ? best : null;
}

/** Cocokkan item surat jalan ke master produk. */
export function matchProduct(item: SlipItem, products: Product[]): Product | null {
  const kode = norm(item.kode);
  const desc = norm(item.deskripsi);
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of products) {
    let score = 0;
    const pk = norm(p.kode);
    if (pk && (kode === pk || kode.startsWith(pk) || desc.startsWith(pk))) score = 100;
    if (!score && pk && desc.includes(pk)) score = 85;
    if (!score && p.keywords) {
      for (const kw of p.keywords.split(',')) {
        const k = norm(kw);
        if (k && desc.includes(k)) {
          score = Math.max(score, 70 + Math.min(k.length, 20));
        }
      }
    }
    if (!score && p.nama && desc.includes(norm(p.nama))) score = 60;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 60 ? best : null;
}

export interface Conversion {
  qtyText: string;
  satuanText: string;
  dikonversi: boolean;
}

/** Konversi qty sesuai ratio master produk. Contoh: 500 Rim, rasio 5 -> "100" "Box". */
export function convertQty(item: SlipItem, product: Product | null): Conversion {
  if (
    product &&
    product.rasio > 1 &&
    item.qty > 0 &&
    item.satuan.toLowerCase() === product.satuanDasar.toLowerCase()
  ) {
    const besar = item.qty / product.rasio;
    if (Number.isInteger(besar)) {
      return { qtyText: String(besar), satuanText: product.satuanBesar, dikonversi: true };
    }
    const bulat = Math.floor(besar);
    const sisa = item.qty - bulat * product.rasio;
    return {
      qtyText: `${bulat} ${product.satuanBesar} ${sisa} ${product.satuanDasar}`,
      satuanText: '',
      dikonversi: true,
    };
  }
  return {
    qtyText: String(item.qty),
    satuanText: item.satuan,
    dikonversi: false,
  };
}
