export interface Customer {
  id: string;
  nama: string;
  alamat: string;
  telp: string;
}

export interface Product {
  id: string;
  kode: string; // contoh: "ULT 75 A4"
  nama: string; // nama tampil di label
  keywords: string; // kata kunci pencocokan dari deskripsi surat jalan, pisahkan koma
  satuanDasar: string; // contoh: "Rim"
  satuanBesar: string; // contoh: "Box"
  rasio: number; // 1 satuanBesar = rasio satuanDasar, contoh: 5
}

export interface SlipItem {
  no: number;
  deskripsi: string; // teks asli dari surat jalan
  kode: string; // bagian sebelum " - "
  qty: number;
  satuan: string; // contoh: "Rim"
}

export interface ParsedSlip {
  noSuratJalan: string;
  tanggalKirim: string;
  namaPelanggan: string;
  alamatPdf: string;
  telpPdf: string;
  items: SlipItem[];
}

export interface LabelItem {
  namaBarang: string;
  qtyText: string; // hasil konversi, contoh: "100"
  satuanText: string; // contoh: "Box"
  dikonversi: boolean;
}

export interface LabelData {
  noSuratJalan: string;
  tanggalKirim: string;
  penerima: string;
  alamat: string;
  telp: string;
  items: LabelItem[];
}

export interface AppSettings {
  companyName: string;
  sheetId: string;
  sheetCustomers: string;
  sheetProducts: string;
}
