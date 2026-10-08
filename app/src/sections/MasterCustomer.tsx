import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { loadCustomers, saveCustomers, newId } from '@/lib/store';
import type { Customer } from '@/types';

const empty: Omit<Customer, 'id'> = { nama: '', alamat: '', telp: '' };

export function MasterCustomer() {
  const [list, setList] = useState<Customer[]>(loadCustomers());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const persist = (next: Customer[]) => {
    setList(next);
    saveCustomers(next);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ nama: c.nama, alamat: c.alamat, telp: c.telp });
    setOpen(true);
  };

  const save = () => {
    if (!form.nama.trim()) return;
    if (editId) {
      persist(list.map((c) => (c.id === editId ? { ...c, ...form } : c)));
    } else {
      persist([...list, { id: newId(), ...form }]);
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    if (confirm('Hapus customer ini?')) persist(list.filter((c) => c.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Master Customer</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Saat nama pelanggan di surat jalan cocok dengan master, alamat otomatis diambil dari sini.
          </p>
        </div>
        <Button onClick={openAdd}>+ Tambah Customer</Button>
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
                  <th className="py-2 pr-4 w-10">#</th>
                  <th className="py-2 pr-4">Nama</th>
                  <th className="py-2 pr-4">Alamat</th>
                  <th className="py-2 pr-4">Telp</th>
                  <th className="py-2 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-slate-400">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{c.nama}</td>
                    <td className="py-2 pr-4 whitespace-pre-line">{c.alamat}</td>
                    <td className="py-2 pr-4">{c.telp}</td>
                    <td className="py-2 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>
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
            <DialogTitle>{editId ? 'Edit Customer' : 'Tambah Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Nama Customer</div>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="BUDI PERCETAKAN"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Alamat</div>
              <Textarea
                rows={3}
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="JL. ZAINUL ARIFIN NO. 29, KOTA SIBOLGA"
              />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Telp</div>
              <Input
                value={form.telp}
                onChange={(e) => setForm({ ...form, telp: e.target.value })}
                placeholder="063125369"
              />
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
