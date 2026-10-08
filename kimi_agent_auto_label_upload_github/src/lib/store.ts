import type { Customer, Product, AppSettings } from '@/types';

const KEY_CUSTOMERS = 'sjapp_customers';
const KEY_PRODUCTS = 'sjapp_products';
const KEY_SETTINGS = 'sjapp_settings';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadCustomers(): Customer[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_CUSTOMERS) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomers(list: Customer[]) {
  localStorage.setItem(KEY_CUSTOMERS, JSON.stringify(list));
}

export function loadProducts(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_PRODUCTS) || '[]');
  } catch {
    return [];
  }
}

export function saveProducts(list: Product[]) {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(list));
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'ICETEA LOGISTICS',
  sheetId: '',
  sheetCustomers: 'customers',
  sheetProducts: 'products',
};

export function loadSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

export function newId() {
  return uid();
}

/** Isi data contoh sekali saja (jika localStorage benar-benar kosong). */
export function seedDefaults() {
  if (localStorage.getItem(KEY_CUSTOMERS) === null) {
    saveCustomers([
      {
        id: uid(),
        nama: 'BUDI PERCETAKAN',
        alamat: 'JL. ZAINUL ARIFIN NO. 29, KOTA BARINGIN, SIBOLGA KOTA, KOTA SIBOLGA',
        telp: '063125369',
      },
    ]);
  }
  if (localStorage.getItem(KEY_PRODUCTS) === null) {
    saveProducts([
      {
        id: uid(),
        kode: 'ULT 75 A4',
        nama: 'Kertas FotoCopy Ultima 75 Gsm A4',
        keywords: 'ultima 75 a4, ult 75 a4',
        satuanDasar: 'Rim',
        satuanBesar: 'Box',
        rasio: 5,
      },
      {
        id: uid(),
        kode: 'ULT 75 F4',
        nama: 'Kertas FotoCopy Ultima 75 Gsm Folio',
        keywords: 'ultima 75 f4, ult 75 f4, folio',
        satuanDasar: 'Rim',
        satuanBesar: 'Box',
        rasio: 5,
      },
    ]);
  }
}

// ---------- Google Sheets (mode baca, sheet harus "Anyone with the link can view") ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur);
      cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

async function fetchSheetCsv(sheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal membaca sheet "${sheetName}" (HTTP ${res.status})`);
  return parseCsv(await res.text());
}

export interface SyncResult {
  customers: Customer[];
  products: Product[];
}

export async function syncFromGoogleSheets(settings: AppSettings): Promise<SyncResult> {
  if (!settings.sheetId.trim()) throw new Error('Sheet ID belum diisi');

  const custRows = await fetchSheetCsv(settings.sheetId.trim(), settings.sheetCustomers.trim() || 'customers');
  const prodRows = await fetchSheetCsv(settings.sheetId.trim(), settings.sheetProducts.trim() || 'products');

  const customers: Customer[] = custRows
    .slice(1)
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      id: uid(),
      nama: (r[0] || '').trim(),
      alamat: (r[1] || '').trim(),
      telp: (r[2] || '').trim(),
    }));

  const products: Product[] = prodRows
    .slice(1)
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      id: uid(),
      kode: (r[0] || '').trim(),
      nama: (r[1] || '').trim(),
      keywords: (r[2] || '').trim(),
      satuanDasar: (r[3] || 'Pcs').trim(),
      satuanBesar: (r[4] || 'Box').trim(),
      rasio: parseFloat((r[5] || '1').replace(',', '.')) || 1,
    }));

  saveCustomers(customers);
  saveProducts(products);
  return { customers, products };
}
