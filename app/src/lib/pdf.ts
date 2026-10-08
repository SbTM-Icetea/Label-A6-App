import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ParsedSlip, SlipItem } from '@/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface TextToken {
  str: string;
  x: number;
  y: number;
}

async function extractLines(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const tokens: TextToken[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const t = item as { str: string; transform: number[] };
      if (!t.str.trim()) continue;
      tokens.push({ str: t.str, x: t.transform[4], y: t.transform[5] });
    }
    // kelompokkan per baris berdasarkan koordinat y
    tokens.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: TextToken[][] = [];
    for (const tok of tokens) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last[0].y - tok.y) < 3) {
        last.push(tok);
      } else {
        lines.push([tok]);
      }
    }
    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      // gabungkan token; beri spasi ganda jika jarak horizontal besar
      let text = '';
      let prevEnd = 0;
      for (const tok of line) {
        if (text) {
          const gap = tok.x - prevEnd;
          text += gap > 12 ? '  ' : ' ';
        }
        text += tok.str;
        prevEnd = tok.x + tok.str.length * 4.5;
      }
      allLines.push(text.trim());
    }
  }
  return allLines;
}

function parseItems(lines: string[]): SlipItem[] {
  const items: SlipItem[] = [];
  // cari area tabel barang: setelah header "KETERANGAN"/"NO." sampai "PESAN"
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/KETERANGAN/i.test(lines[i]) && /QTY/i.test(lines[i])) start = i;
    if (start >= 0 && /^\s*PESAN\s*$/i.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (start < 0) {
    // fallback: cari baris yang diawali nomor urut
    start = 0;
  }
  let pending: SlipItem | null = null;
  for (let i = start + 1; i < end; i++) {
    const line = lines[i];
    if (!line) continue;
    const m = line.match(/^(\d{1,3})\s+(.+?)\s+([\d.,]+)\s*([A-Za-z]+)\s*$/);
    if (m) {
      if (pending) items.push(pending);
      const deskripsi = m[2].trim();
      const kode = deskripsi.split(' - ')[0].trim();
      pending = {
        no: parseInt(m[1], 10),
        deskripsi,
        kode,
        qty: parseFloat(m[3].replace(/\./g, '').replace(',', '.')) || 0,
        satuan: m[4],
      };
    } else if (/^\d{1,3}\s+\S/.test(line) && pending === null) {
      // baris item baru tanpa qty di ujung (qty mungkin di baris lain)
      const deskripsi = line.replace(/^\d{1,3}\s+/, '').trim();
      pending = {
        no: items.length + 1,
        deskripsi,
        kode: deskripsi.split(' - ')[0].trim(),
        qty: 0,
        satuan: '',
      };
    } else if (pending && pending.qty === 0) {
      const q = line.match(/([\d.,]+)\s*([A-Za-z]+)\s*$/);
      if (q) {
        pending.qty = parseFloat(q[1].replace(/\./g, '').replace(',', '.')) || 0;
        pending.satuan = q[2];
      }
    } else if (pending) {
      // lanjutan deskripsi multiline
      pending.deskripsi += ' ' + line.trim();
    }
  }
  if (pending) items.push(pending);
  return items;
}

export async function parseDeliverySlip(file: File): Promise<ParsedSlip> {
  const lines = await extractLines(file);
  const full = lines.join('\n');

  // No. Surat Jalan
  let noSuratJalan = '';
  const mSj =
    full.match(/PENGIRIMAN\s*#\s*:?\s*([A-Z0-9][A-Z0-9\/\-]*)/i) ||
    full.match(/([A-Z]{1,3}\/S?J-\d+)/i);
  if (mSj) noSuratJalan = mSj[1].trim();

  // Tanggal kirim (tanggal pertama di header)
  let tanggalKirim = '';
  const mTgl = full.match(/TANGGAL\s*:?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
  if (mTgl) tanggalKirim = mTgl[1];

  // Nama pelanggan
  let namaPelanggan = '';
  for (const line of lines) {
    const m = line.match(/\bNAMA\s+(.+)/i);
    if (m) {
      let name = m[1];
      // potong jika ada kolom lain di baris yang sama
      const cut = name.search(/\s{2,}|\bPEMESANAN\b|\bSO\//i);
      if (cut > 0) name = name.slice(0, cut);
      namaPelanggan = name.trim();
      break;
    }
  }

  // Alamat & telp dari PDF (sebagai fallback bila master tidak ada)
  let alamatPdf = '';
  let telpPdf = '';
  let inAlamat = false;
  for (const line of lines) {
    if (/\bALAMAT\b/i.test(line)) {
      inAlamat = true;
      let a = line.replace(/.*\bALAMAT\s+/i, '');
      const cut = a.search(/\s{2,}|\bTANGGAL\b/i);
      if (cut > 0) a = a.slice(0, cut);
      alamatPdf = a.trim();
      continue;
    }
    if (inAlamat) {
      if (/\bTELP\b/i.test(line)) {
        const t = line.replace(/.*\bTELP\s+/i, '');
        const cut = t.search(/\s{2,}/);
        telpPdf = (cut > 0 ? t.slice(0, cut) : t).trim();
        inAlamat = false;
        continue;
      }
      // lanjutan alamat multiline
      const cont = line.split(/\s{2,}/)[0];
      if (cont && !/FAX|PEMESANAN|NO\./i.test(cont)) alamatPdf += ' ' + cont.trim();
    }
  }

  const items = parseItems(lines);

  return { noSuratJalan, tanggalKirim, namaPelanggan, alamatPdf, telpPdf, items };
}
