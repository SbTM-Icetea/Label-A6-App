import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { loadSettings, saveSettings, syncFromGoogleSheets } from '@/lib/store';
import type { AppSettings } from '@/types';

export function Settings({ onSynced }: { onSynced: () => void }) {
  const [form, setForm] = useState<AppSettings>(loadSettings());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = () => {
    saveSettings(form);
    setMsg({ ok: true, text: 'Pengaturan tersimpan.' });
  };

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      saveSettings(form);
      const res = await syncFromGoogleSheets(form);
      setMsg({
        ok: true,
        text: `Sinkron berhasil: ${res.customers.length} customer, ${res.products.length} produk.`,
      });
      onSynced();
    } catch (e) {
      setMsg({
        ok: false,
        text:
          (e instanceof Error ? e.message : String(e)) +
          ' — pastikan sheet dibagikan "Anyone with the link: Viewer".',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm">
            <div className="text-xs text-slate-500 mb-1">
              Nama perusahaan di header label (dipakai jika No. Surat Jalan tidak diawali S/SJ, SJ/, atau J/SJ)
            </div>
            <Input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
          <Button onClick={save}>Simpan Pengaturan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrasi Google Sheets</CardTitle>
          <p className="text-sm text-slate-500">
            Master customer & produk dibaca dari Google Sheets. Sheet harus dibagikan{' '}
            <b>“Anyone with the link: Viewer”</b>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Spreadsheet ID</div>
              <Input
                value={form.sheetId}
                onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Nama tab Customer</div>
              <Input
                value={form.sheetCustomers}
                onChange={(e) => setForm({ ...form, sheetCustomers: e.target.value })}
                placeholder="customers"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Nama tab Produk</div>
              <Input
                value={form.sheetProducts}
                onChange={(e) => setForm({ ...form, sheetProducts: e.target.value })}
                placeholder="products"
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
            <div className="font-semibold text-slate-700">Format kolom Google Sheets:</div>
            <div>
              <b>Tab customers</b> — kolom A: <code>nama</code>, B: <code>alamat</code>, C: <code>telp</code>
            </div>
            <div>
              <b>Tab products</b> — kolom A: <code>kode</code>, B: <code>nama</code>, C: <code>keywords</code>, D:{' '}
              <code>satuan_dasar</code>, E: <code>satuan_besar</code>, F: <code>rasio</code>
            </div>
            <div className="text-slate-400 text-xs">Baris pertama = header, data mulai baris ke-2.</div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={sync} disabled={busy}>
              {busy ? 'Menyinkronkan…' : '🔄 Sinkron dari Google Sheets'}
            </Button>
            {msg && (
              <span className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
