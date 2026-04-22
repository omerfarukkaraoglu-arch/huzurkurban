'use client'

import { useState, useRef } from 'react'

export default function ReceiptManager({ registrations, settings }: { registrations: any[], settings: any }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const filteredRegistrations = registrations.filter(r => 
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm)
  )

  const handlePrint = (reg: any) => {
    setSelectedReg(reg)
    // Wait for state update to render the print view
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <input 
          type="text" 
          placeholder="İsim veya telefon ile ara..." 
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">Müşteri</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">Grup / Hisse</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">Durum</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRegistrations.map((reg: any) => (
              <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{reg.fullName}</div>
                  <div className="text-xs text-slate-500">{reg.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-800">{reg.group}</div>
                  <div className="text-emerald-600 font-bold">{reg.share || '1'} Hisse</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    reg.status === 'ONAYLANDI' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : reg.status === 'IPTAL' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {reg.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handlePrint(reg)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Yazdır
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden Print Section */}
      <div id="print-area" className="hidden print:block fixed inset-0 bg-white">
        {selectedReg && (
          <div className="w-[210mm] h-[148.5mm] mx-auto p-10 bg-white relative">
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-6">
              <div>
                <h1 className="text-3xl font-black text-emerald-600 uppercase tracking-tight leading-none mb-1">{settings?.siteTitle || 'Huzur Kurban'}</h1>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest leading-none">Resmi Ödeme Makbuzu</p>
              </div>
              <div className="text-right">
                <div className="text-slate-800 font-black text-lg">NO: #{(selectedReg.id).slice(-6).toUpperCase()}</div>
                <div className="text-slate-500 text-sm font-medium">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8">
              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Makbuz Sahibi</h3>
                <div className="text-xl font-black text-slate-900 leading-tight">{selectedReg.fullName}</div>
                <div className="text-slate-700 font-bold mb-1">{selectedReg.phone}</div>
                <div className="text-slate-500 text-xs leading-relaxed max-w-[280px]">{selectedReg.address}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 text-xs font-bold uppercase">Grup:</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedReg.group}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 text-xs font-bold uppercase">Hisse:</span>
                  <span className="text-slate-900 font-bold text-sm">{selectedReg.share || '1'} Adet</span>
                </div>
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                  <span className="text-slate-900 font-black text-xs">DURUM:</span>
                  <span className="text-emerald-600 font-black text-lg italic uppercase">ODENDI</span>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-xs mb-8 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-700">Not:</span> Bu makbuz, kurban hisseniz için ödeme tahsilatının yapıldığını ve vekaletinizin alındığını teyit eder.
            </div>

            <div className="flex justify-between items-end absolute bottom-10 left-10 right-10">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-12">Müşteri İmza</p>
                <div className="w-40 border-b border-slate-300"></div>
              </div>
              <div className="text-center">
                <p className="text-emerald-600 font-black text-sm uppercase mb-1">Huzur Kurban</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-8">Yetkili İmza / Kaşe</p>
                <div className="w-40 border-b border-slate-300"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
