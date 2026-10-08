import type { LabelData } from '@/types';

interface Props {
  data: LabelData;
  companyName: string;
}

/** Label A6 (105 x 148 mm) sesuai desain surat jalan. */
export function ShippingLabel({ data, companyName }: Props) {
  return (
    <div
      className="shipping-label bg-white text-slate-800 flex flex-col overflow-hidden"
      style={{ width: '105mm', height: '148mm', borderRadius: '3mm', border: '1px solid #cbd5e1' }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 text-white font-extrabold tracking-wide text-sm"
        style={{ background: '#5b6b82', borderRadius: '3mm 3mm 0 0' }}
      >
        {companyName}
      </div>

      {/* No Surat Jalan */}
      <div className="px-4 pt-2 pb-2" style={{ background: '#eef2f7' }}>
        <div className="text-[8px] font-semibold tracking-widest text-slate-500">NO. SURAT JALAN</div>
        <div className="text-base font-bold text-slate-800">{data.noSuratJalan || '—'}</div>
      </div>
      <div className="mx-3 border-t border-dashed border-slate-300" />

      {/* Penerima */}
      <div className="px-3 pt-2">
        <div className="rounded-md border border-blue-200 overflow-hidden">
          <div
            className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-slate-700 flex items-center gap-1"
            style={{ background: '#e8effa' }}
          >
            <span>📍</span> PENERIMA
          </div>
          <div className="px-2.5 py-1.5">
            <div className="text-[13px] font-extrabold text-slate-900 leading-tight">
              {data.penerima || '—'}
            </div>
            <div className="text-[10px] text-slate-600 leading-snug whitespace-pre-line">
              {data.alamat || '—'}
            </div>
            {data.telp && <div className="text-[10px] text-slate-600">Telp: {data.telp}</div>}
          </div>
        </div>
      </div>

      {/* Detail Barang */}
      <div className="px-3 pt-2.5 flex-1 flex flex-col">
        <div className="text-[9px] font-bold tracking-widest text-slate-600 flex items-center gap-1 pb-1">
          <span>📦</span> DETAIL BARANG
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: '#5b6b82' }} className="text-white">
              <th className="text-[9px] font-bold py-1 px-1.5 text-center w-6 rounded-tl">#</th>
              <th className="text-[9px] font-bold py-1 px-1.5 text-left">NAMA BARANG</th>
              <th className="text-[9px] font-bold py-1 px-1.5 text-center w-14">QTY</th>
              <th className="text-[9px] font-bold py-1 px-1.5 text-center w-14 rounded-tr">SATUAN</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-[10px] text-slate-400 text-center py-3 border-x border-b border-slate-200">
                  —
                </td>
              </tr>
            )}
            {data.items.map((it, i) => (
              <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                <td className="text-[10px] py-1 px-1.5 text-center border-x border-b border-slate-200 text-slate-500">
                  {i + 1}
                </td>
                <td className="text-[10px] py-1 px-1.5 border-b border-slate-200 font-medium leading-tight">
                  {it.namaBarang}
                </td>
                <td className="text-[10px] py-1 px-1.5 text-center border-b border-slate-200 font-bold">
                  {it.qtyText}
                </td>
                <td className="text-[10px] py-1 px-1.5 text-center border-x border-b border-slate-200">
                  {it.satuanText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total & Tanggal */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-md border border-slate-200 px-2 py-1.5">
            <div className="text-[8px] font-semibold tracking-widest text-slate-400">TOTAL JENIS</div>
            <div className="text-sm font-extrabold text-slate-800">{data.items.length}</div>
          </div>
          <div className="rounded-md border border-slate-200 px-2 py-1.5">
            <div className="text-[8px] font-semibold tracking-widest text-slate-400">TGL KIRIM</div>
            <div className="text-sm font-extrabold text-slate-800">{data.tanggalKirim || '—'}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-2 px-4 py-1.5 flex justify-between items-center text-white"
        style={{ background: '#5b6b82', borderRadius: '0 0 3mm 3mm' }}
      >
        <span className="text-[8px] font-semibold">{data.noSuratJalan}</span>
        <span className="text-[8px] text-slate-300">Hal. 1/1</span>
      </div>
    </div>
  );
}
