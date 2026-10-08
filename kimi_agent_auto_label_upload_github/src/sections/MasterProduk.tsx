import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { loadProducts, saveProducts, newId } from '@/lib/store';
import type { Product } from '@/types';

const empty: Omit<Product, 'id'> = {
  kode: '',
  nama: '',
  keywords: '',
  satuanDasar: 'Rim',
  satuanBesar: 'Box',
  rasio: 5,
};

export function MasterProduk() {
  const [list, setList] = useState<Product[]>(loadProducts());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const persist = (next: Product[]) => {
    setList(next);
    saveProducts(next);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ ...p });
    setOpen(true);
  };

  const save = () => {
    if (!form.kode.trim() && !form.nama.trim()) return;
    const data = { ...form, rasio: form.rasio > 0 ? form.rasio : 1 };
    if (editId) {
      persist(list.map((p) => (p.id === editId ? { ...p, ...data } : p)));
    } else {
      persist([...list, { id: newId(), ...data }]);
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    if (confirm('Hapus produk ini?')) persist(list.filter((p) => p.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Master Produk & Ratio Konversi</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Contoh: rasio 5, satuan dasar <b>Rim</b>, satuan besar <b>Box</b> → qty 500 Rim otomatis menjadi{' '}
            <b>100 Box</b> di label.
          </p>
        </div>
        <Button onClick={openAdd}>+ Tambah Produk</Button>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            Belum ada data. Tambahkan manual atau sinkron dari Google Sheets.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">Kode</th>
                  <th className="py-2 pr-4">Nama di Label</th>
                  <th className="py-2 pr-4">Keywords</th>
                  <th className="py-2 pr-4">Konversi</th>
                  <th className="py-2 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono font-medium">{p.kode}</td>
                    <td className="py-2 pr-4">{p.nama}</td>
                    <td className="py-2 pr-4 text-slate-500">{p.keywords}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                        1 {p.satuanBesar} = {p.rasio} {p.satuanDasar}
                      </span>
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Kode (sesuai surat jalan)</div>
                <Input
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  placeholder="ULT 75 A4"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Nama tampil di label</div>
                <Input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Kertas HVS Ultima 75 A4"
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Keywords pencocokan (opsional, pisahkan dengan koma)
              </div>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="ultima 75 a4, ult 75 a4"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Satuan dasar</div>
                <Input
                  value={form.satuanDasar}
                  onChange={(e) => setForm({ ...form, satuanDasar: e.target.value })}
                  placeholder="Rim"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Satuan besar</div>
                <Input
                  value={form.satuanBesar}
                  onChange={(e) => setForm({ ...form, satuanBesar: e.target.value })}
                  placeholder="Box"
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Rasio</div>
                <Input
                  type="number"
                  min={1}
                  value={form.rasio}
                  onChange={(e) => setForm({ ...form, rasio: parseFloat(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              1 {form.satuanBesar || 'Box'} = {form.rasio} {form.satuanDasar || 'Rim'} → qty{' '}
              {form.rasio * 100} {form.satuanDasar || 'Rim'} menjadi <b>100 {form.satuanBesar || 'Box'}</b>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
