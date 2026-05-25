'use client'

import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

function parseShareCount(shareStr: string | null | undefined): number {
  if (!shareStr) return 1
  const trimmed = shareStr.trim()
  
  // E.g. "2/7" or "2/7 Hisse"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*\d+/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    return isNaN(num) || num <= 0 ? 1 : num
  }

  // E.g. "3 Hisse" or "3"
  const digitMatch = trimmed.match(/(\d+)/)
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10)
    return isNaN(num) || num <= 0 ? 1 : num
  }

  return 1
}

export default function PrintLabelsClient({ animals }: { animals: any[] }) {
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({})
  const [labelType, setLabelType] = useState<'animal' | 'shareholder'>('animal')

  useEffect(() => {
    const generateQRs = async () => {
      const codes: { [key: string]: string } = {}
      for (const animal of animals) {
        const url = `${window.location.origin}/admin/scan?id=${animal.id}`
        const qr = await QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        })
        codes[animal.id] = qr
      }
      setQrCodes(codes)
    }
    generateQRs()
  }, [animals])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-8 no-print flex flex-col md:flex-row justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Etiket Yazdırma Merkezi</h1>
          <p className="text-sm text-slate-700 font-medium">Yazdırılacak etiket tipini seçin. Toplam {labelType === 'animal' ? animals.length * 4 : animals.reduce((acc, a) => acc + a.shareholders.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0), 0)} etiket hazırlandı.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
                onClick={() => setLabelType('animal')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${labelType === 'animal' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
            >
                🐄 Hayvan Etiketleri (4/A4)
            </button>
            <button 
                onClick={() => setLabelType('shareholder')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${labelType === 'shareholder' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                👤 Hissedar Etiketleri (10/A4)
            </button>
        </div>

        <button
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
        >
          🖨️ Yazdır
        </button>
      </div>

      <div className={`print-container ${labelType}-mode`}>
        {labelType === 'animal' ? (
          animals.flatMap((animal, animalIndex) => 
            Array.from({ length: 4 }).map((_, copyIndex) => (
              <div key={`${animal.id}-${copyIndex}`} className="label-card animal-label border-2 border-slate-300 relative overflow-hidden flex flex-col p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-6xl font-black text-slate-900 leading-none">#{animal.order || animalIndex + 1}</div>
                    <div className="text-xl font-black text-slate-700 mt-2 uppercase tracking-widest">{animal.groupName || 'GENEL GRUP'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-600 uppercase tracking-tighter">Küpe Numarası</div>
                    <div className="text-2xl font-black text-slate-900">{animal.earTag}</div>
                  </div>
                </div>

                <div className="flex flex-1 gap-8 items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    {qrCodes[animal.id] ? (
                      <img src={qrCodes[animal.id]} alt="QR Code" className="w-48 h-48 border-4 border-white shadow-sm" />
                    ) : (
                      <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg"></div>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">{animal.id.slice(-8)}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="text-xs font-black text-slate-700 uppercase mb-1">Ağırlık</div>
                        <div className="text-xl font-bold text-slate-900">{animal.weight ? `${animal.weight} KG` : 'TARTILACAK'}</div>
                    </div>
                    <div>
                       {(() => {
                         const maxShares = animal.maxShares || 7;
                         const filledList = animal.shareholders?.flatMap((sh: any) => {
                           const copyCount = parseShareCount(sh.registration?.share)
                           return Array.from({ length: copyCount }).map((_, i) => 
                             `${sh.registration?.fullName || 'Bilinmeyen Hissedar'}${copyCount > 1 ? ` (${i+1}/${copyCount})` : ''}`
                           )
                         }) || [];
                         
                         const totalShares = filledList.length;
                         const emptyList = Array.from({ length: Math.max(0, maxShares - totalShares) }).map(() => 'Boş Hisse');
                         const allList = [...filledList, ...emptyList];
                         
                         return (
                           <>
                             <div className="text-xs font-bold text-slate-400 uppercase mb-2">Hissedarlar ({totalShares}/{maxShares})</div>
                             <div className="grid grid-cols-1 gap-1">
                               {allList.slice(0, maxShares).map((name, i) => (
                                 <div key={i} className={`text-sm font-bold border-b border-slate-100 pb-1 ${name === 'Boş Hisse' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                                   {i+1}. {name}
                                 </div>
                               ))}
                             </div>
                           </>
                         );
                       })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Huzur Kurban - 2026 Organizasyonu</div>
                    <div className="text-xs font-black text-slate-900 border-2 border-black px-2 py-1 uppercase">Kesim No: {animal.order || animalIndex + 1}</div>
                </div>
              </div>
            ))
          )
        ) : (
          animals.flatMap((animal, aIdx) => 
            animal.shareholders.flatMap((sh: any, sIdx: number) => {
              const copyCount = parseShareCount(sh.registration?.share)
              return Array.from({ length: copyCount }).map((_, copyIdx) => (
                <div key={`${sh.id}-${copyIdx}`} className="label-card sh-label border border-slate-300 p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Hissedar</div>
                        <div className="text-2xl font-black text-slate-900 leading-none mb-1">{sh.registration?.fullName || 'Bilinmeyen Hissedar'}</div>
                        <div className="text-sm font-bold text-emerald-600">{sh.registration?.phone}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Hayvan No</div>
                        <div className="text-4xl font-black text-slate-900 leading-none">#{animal.order || aIdx + 1}</div>
                     </div>
                  </div>

                  <div className="flex items-end justify-between mt-4 border-t border-slate-200 pt-3">
                     <div className="text-[11px] font-extrabold text-slate-700 uppercase leading-normal">
                        <span className="text-slate-900 font-black">{animal.earTag}</span><br/>
                        <span className="text-emerald-700">{animal.groupName || 'GENEL GRUP'}</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <img src={qrCodes[animal.id]} alt="QR" className="w-20 h-20" />
                        <span className="text-[10px] font-bold text-slate-500 mt-1">
                          #{sIdx + 1}/7 Hisse {copyCount > 1 ? `(${copyIdx + 1}/${copyCount})` : ''}
                        </span>
                     </div>
                  </div>
                  
                  {/* Kesim Çizgisi Simgesi */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-b border-slate-100 no-print"></div>
                </div>
              ))
            })
          )
        )}
      </div>

      <style jsx global>{`
        @media screen {
          .print-container {
            display: grid;
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .animal-mode {
            grid-template-columns: repeat(2, 1fr);
          }
          .shareholder-mode {
            grid-template-columns: repeat(2, 1fr);
          }
          .label-card {
            background: #fff;
            border-radius: 12px;
          }
          .animal-label { height: 500px; }
          .sh-label { height: 220px; }
        }

        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
          
          .print-container { 
            display: grid !important; 
            grid-template-columns: 105mm 105mm !important;
            width: 210mm !important;
          }

          .label-card {
            border: 1px dashed #000 !important;
            box-sizing: border-box;
            page-break-inside: avoid;
            background: white !important;
            overflow: hidden;
          }

          .animal-label {
            width: 105mm !important;
            height: 148.5mm !important;
            padding: 8mm !important;
          }

          .sh-label {
            width: 105mm !important;
            height: 59.4mm !important;
            padding: 5mm !important;
          }
        }
      `}</style>
    </div>
  )
}
