import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { seedDefaults } from '@/lib/store';
import { CreateLabel } from '@/sections/CreateLabel';
import { MasterCustomer } from '@/sections/MasterCustomer';
import { MasterProduk } from '@/sections/MasterProduk';
import { Settings } from '@/sections/Settings';

export default function App() {
  const [tab, setTab] = useState('label');
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    seedDefaults();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="no-print sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="text-2xl">🏷️</div>
          <div>
            <div className="font-extrabold text-slate-800 leading-tight">Label Surat Jalan A6</div>
            <div className="text-xs text-slate-400">
              Drop PDF surat jalan → label otomatis dengan alamat master & konversi qty
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="no-print">
          <TabsList>
            <TabsTrigger value="label">📄 Buat Label</TabsTrigger>
            <TabsTrigger value="customer">👥 Master Customer</TabsTrigger>
            <TabsTrigger value="produk">📦 Master Produk</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Pengaturan</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className={tab === 'label' ? 'mt-6' : 'hidden'}>
          <CreateLabel key={syncTick} />
        </div>
        <div className={tab === 'customer' ? 'mt-6' : 'hidden'}>
          <MasterCustomer key={'c' + syncTick} />
        </div>
        <div className={tab === 'produk' ? 'mt-6' : 'hidden'}>
          <MasterProduk key={'p' + syncTick} />
        </div>
        <div className={tab === 'settings' ? 'mt-6' : 'hidden'}>
          <Settings onSynced={() => setSyncTick((t) => t + 1)} />
        </div>
      </main>
    </div>
  );
}
