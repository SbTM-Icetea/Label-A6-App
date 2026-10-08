import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseDeliverySlip } from '@/lib/pdf';
import { loadCustomers, loadProducts, loadSettings } from '@/lib/store';
import { matchCustomer, matchProduct, convertQty } from '@/lib/match';
import { labelHeaderForSuratJalan } from '@/lib/company';
import { ShippingLabel } from '@/components/ShippingLabel';
import type { Customer, LabelData, ParsedSlip } from '@/types';

const MANUAL = '__manual__';

export function CreateLabel() {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedSlip | null>(null);
  const [label, setLabel] = useState<LabelData | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [copies, setCopies] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = loadSettings();
  const customers = loadCustomers();
  const headerLabel = labelHeaderForSuratJalan(label?.noSuratJalan || '') || settings.companyName;

  const buildLabel = useCallback(
    (slip: ParsedSlip, custOverride?: Customer | null) => {
      const cust = custOverride !== undefined ? custOverride : matchCustomer(slip.namaPelanggan, loadCustomers());
      setMatchedCustomer(cust);
      const prods = loadProducts();
      const items = slip.items.map((it) => {
        const prod = matchProduct(it, prods);
        const conv = convertQty(it, prod);
        return {
          namaBarang: prod?.nama || it.deskripsi,
          qtyText: conv.qtyText,
          satuanText: conv.satuanText,
          dikonversi: conv.dikonversi,
        };
      });
      setLabel({
        noSuratJalan: slip.noSuratJalan,
        tanggalKirim: slip.tanggalKirim,
        penerima: cust?.nama || slip.namaPelanggan,
        alamat: cust?.alamat || slip.alamatPdf,
        telp: cust?.telp || slip.telpPdf,
        items,
      });
    },
    []
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('File harus berformat PDF');
        return;
      }
      setLoading(true);
      try {
        const slip = await parseDeliverySlip(file);
        setParsed(slip);
        buildLabel(slip);
      } catch (e) {
        setError('Gagal membaca PDF: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setLoading(false);
      }
    },
    [buildLabel]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const pickCustomer = (val: string) => {
    if (!parsed || !label) return;
    if (val === MANUAL) {
      buildLabel(parsed, null);
      return;
    }
    const cust = customers.find((c) => c.id === val) || null;
    setMatchedCustomer(cust);
    setLabel({
      ...label,
      penerima: cust?.nama || parsed.namaPelanggan,
      alamat: cust?.alamat || parsed.alamatPdf,
      telp: cust?.telp || parsed.telpPdf,
    });
  };

  const doPrint = () => window.print();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Kolom kiri: upload + hasil parsing */}
      <div className="space-y-4 no-print">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'
          }`}
        >
          <div className="text-4xl mb-2">📄</div>
          <div className="font-semibold text-slate-700">
            {loading ? 'Membaca PDF…' : 'Drag & drop PDF Surat Jalan di sini'}
          </div>
          <div className="text-sm text-slate-400 mt-1">atau klik untuk memilih file</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2">{error}</div>}

        {parsed && label && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hasil Baca Surat Jalan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">No. Surat Jalan</div>
                  <Input
                    value={label.noSuratJalan}
                    onChange={(e) => setLabel({ ...label, noSuratJalan: e.target.value })}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Header Label</div>
                  <Input value={headerLabel} readOnly />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Otomatis dari awalan S/SJ, SJ/, atau J/SJ.
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Tanggal Kirim</div>
                  <Input
                    value={label.tanggalKirim}
                    onChange={(e) => setLabel({ ...label, tanggalKirim: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                  Penerima (dari PDF: <b>{parsed.namaPelanggan || '?'}</b>)
                  {matchedCustomer ? (
                    <Badge variant="default" className="bg-green-600">✓ cocok master</Badge>
                  ) : (
                    <Badge variant="secondary">tidak ada di master</Badge>
                  )}
                </div>
                <Select value={matchedCustomer?.id || MANUAL} onValueChange={pickCustomer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MANUAL}>— pakai data dari PDF —</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">Alamat (otomatis dari master customer)</div>
                <Textarea
                  rows={3}
                  value={label.alamat}
                  onChange={(e) => setLabel({ ...label, alamat: e.target.value })}
                />
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">Barang (qty otomatis dikonversi dari master produk)</div>
                <div className="space-y-2">
                  {label.items.map((it, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-2.5 space-y-1.5">
                      <Input
                        value={it.namaBarang}
                        onChange={(e) => {
                          const items = [...label.items];
                          items[i] = { ...it, namaBarang: e.target.value };
                          setLabel({ ...label, items });
                        }}
                      />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400 text-xs">
                          asli: {parsed.items[i]?.qty} {parsed.items[i]?.satuan}
                        </span>
                        <span className="text-slate-300">→</span>
                        <Input
                          className="w-24 h-8"
                          value={it.qtyText}
                          onChange={(e) => {
                            const items = [...label.items];
                            items[i] = { ...it, qtyText: e.target.value };
                            setLabel({ ...label, items });
                          }}
                        />
                        <Input
                          className="w-24 h-8"
                          value={it.satuanText}
                          onChange={(e) => {
                            const items = [...label.items];
                            items[i] = { ...it, satuanText: e.target.value };
                            setLabel({ ...label, items });
                          }}
                        />
                        {it.dikonversi && <Badge className="bg-blue-600">dikonversi</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Kopian:</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="w-16"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  />
                </div>
                <Button onClick={doPrint} className="flex-1">
                  🖨️ Cetak Label A6
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kolom kanan: preview label */}
      <div className="no-print">
        <div className="text-sm font-semibold text-slate-500 mb-2">Preview Label A6 (105 × 148 mm)</div>
        <div className="inline-block shadow-lg rounded" style={{ zoom: 1 }}>
          {label ? (
            <ShippingLabel data={label} companyName={headerLabel} />
          ) : (
            <ShippingLabel
              data={{
                noSuratJalan: '',
                tanggalKirim: '',
                penerima: '',
                alamat: '',
                telp: '',
                items: [],
              }}
              companyName={headerLabel}
            />
          )}
        </div>
      </div>

      {/* Area cetak: hanya tampil saat print */}
      <div className="print-area">
        {label &&
          Array.from({ length: copies }).map((_, i) => (
            <div key={i} className="print-page">
              <ShippingLabel data={label} companyName={headerLabel} />
            </div>
          ))}
      </div>
    </div>
  );
}
