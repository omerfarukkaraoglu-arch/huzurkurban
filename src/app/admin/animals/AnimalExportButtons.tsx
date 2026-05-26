'use client'

import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AnimalData {
  id: string
  earTag: string
  weight: number | null
  groupName: string | null
  note: string | null
  maxShares?: number
  shareholders: { 
    id: string
    registration: { 
      fullName: string 
      phone: string
      share?: string | null
      address?: string | null
      group?: string | null
    } 
  }[]
  createdAt: string
  order?: number
  deliveryStatus?: string
}

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

export default function AnimalExportButtons({ data }: { data: AnimalData[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null)
  
  // Selected columns state
  const [cols, setCols] = useState({
    order: true,
    earTag: true,
    weight: true,
    groupName: true,
    deliveryStatus: false,
    note: false,
    fullName: true,
    phone: false,
    address: false,
    createdAt: false,
  })

  // Layout mode
  const [layoutMode, setLayoutMode] = useState<'multi-column' | 'single-column'>('multi-column')

  const toggleColumn = (key: keyof typeof cols) => {
    setCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getAnimalSlots = (a: AnimalData) => {
    const maxShares = a.maxShares || 7
    const filledList = a.shareholders.flatMap((sh: any) => {
      const copyCount = parseShareCount(sh.registration?.share)
      return Array.from({ length: copyCount }).map(() => ({
        fullName: sh.registration?.fullName || 'Bilinmeyen Hissedar',
        phone: sh.registration?.phone || '',
        address: sh.registration?.address || '',
        group: sh.registration?.group || '',
      }))
    })
    const emptyCount = Math.max(0, maxShares - filledList.length)
    const emptyList = Array.from({ length: emptyCount }).map(() => ({
      fullName: 'Yurt Hissesi',
      phone: '',
      address: '',
      group: '',
    }))
    return [...filledList, ...emptyList]
  }

  const handleExcelExport = () => {
    const maxSharesAcrossAll = Math.max(7, ...data.map(a => a.maxShares || 7))
    
    const rows = data.map((a, idx) => {
      const row: { [key: string]: any } = {}

      // Animal Info
      if (cols.order) row['Sıra Numarası'] = a.order || (idx + 1)
      if (cols.earTag) row['Küpe Numarası'] = a.earTag
      if (cols.weight) row['Ağırlık (kg)'] = a.weight || '-'
      if (cols.groupName) row['Grup'] = a.groupName || '-'
      if (cols.deliveryStatus) row['Teslimat Durumu'] = a.deliveryStatus || 'BEKLEMEDE'
      if (cols.note) row['Not'] = a.note || '-'
      if (cols.createdAt) row['Kayıt Tarihi'] = new Date(a.createdAt).toLocaleDateString('tr-TR')

      // Shareholder Info
      const slots = getAnimalSlots(a)
      const filledList = slots.filter(s => s.fullName !== 'Yurt Hissesi')

      if (layoutMode === 'multi-column') {
        for (let i = 0; i < maxSharesAcrossAll; i++) {
          const header = `${i + 1}. Hissedar`
          const slot = slots[i]
          if (slot) {
            const parts = []
            if (cols.fullName && slot.fullName) parts.push(slot.fullName)
            if (cols.phone && slot.phone) parts.push(slot.phone)
            if (cols.address && slot.address) parts.push(slot.address)
            row[header] = parts.join(' - ') || '-'
          } else {
            row[header] = '-'
          }
        }
      } else {
        if (cols.fullName) {
          row['Hissedarlar'] = filledList.map(s => s.fullName).join(', ') || 'Yurt Hissesi'
        }
        if (cols.phone) {
          row['Hissedar Telefonları'] = filledList.map(s => s.phone).filter(Boolean).join(', ') || '-'
        }
        if (cols.address) {
          row['Hissedar Adresleri'] = filledList.map(s => s.address).filter(Boolean).join(', ') || '-'
        }
      }

      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    
    // Set custom column widths
    const colWidths: { wch: number }[] = []
    if (cols.order) colWidths.push({ wch: 15 })
    if (cols.earTag) colWidths.push({ wch: 15 })
    if (cols.weight) colWidths.push({ wch: 12 })
    if (cols.groupName) colWidths.push({ wch: 15 })
    if (cols.deliveryStatus) colWidths.push({ wch: 18 })
    if (cols.note) colWidths.push({ wch: 25 })
    if (cols.createdAt) colWidths.push({ wch: 14 })

    if (layoutMode === 'multi-column') {
      for (let i = 0; i < maxSharesAcrossAll; i++) {
        colWidths.push({ wch: 25 })
      }
    } else {
      if (cols.fullName) colWidths.push({ wch: 45 })
      if (cols.phone) colWidths.push({ wch: 30 })
      if (cols.address) colWidths.push({ wch: 45 })
    }
    
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hayvanlar')
    XLSX.writeFile(wb, `HuzurKurban_Hayvanlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handlePdfExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Register simple Turkish characters replacement helper to avoid font errors
    const trMap: { [key: string]: string } = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'Ö': 'O', 'Ç': 'C' };
    const safeStr = (str: string) => str.replace(/[ığüşöçİĞÜŞÖÇ]/g, m => trMap[m] || m);

    doc.setFontSize(18)
    doc.setTextColor(16, 185, 129)
    doc.text(safeStr('Huzur Kurban - Hayvan Listesi'), 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(safeStr(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}  |  Toplam: ${data.length} hayvan`), 14, 25)

    const head: string[] = []
    
    if (cols.order) head.push('#')
    if (cols.earTag) head.push('Kupe No')
    if (cols.weight) head.push('Agirlik')
    if (cols.groupName) head.push('Grup')
    if (cols.deliveryStatus) head.push('Durum')
    if (cols.note) head.push('Not')
    if (cols.createdAt) head.push('Tarih')

    const maxSharesAcrossAll = Math.max(7, ...data.map(a => a.maxShares || 7))
    if (layoutMode === 'multi-column') {
      for (let i = 0; i < maxSharesAcrossAll; i++) {
        head.push(`${i + 1}. Hissedar`)
      }
    } else {
      if (cols.fullName) head.push('Hissedarlar')
      if (cols.phone) head.push('Telefonlar')
      if (cols.address) head.push('Adresler')
    }

    const body = data.map((a, idx) => {
      const row: any[] = []
      
      if (cols.order) row.push(a.order || (idx + 1))
      if (cols.earTag) row.push(a.earTag)
      if (cols.weight) row.push(a.weight ? `${a.weight} kg` : '-')
      if (cols.groupName) row.push(safeStr(a.groupName || '-'))
      if (cols.deliveryStatus) row.push(a.deliveryStatus || 'BEKLEMEDE')
      if (cols.note) row.push(safeStr(a.note || '-'))
      if (cols.createdAt) row.push(new Date(a.createdAt).toLocaleDateString('tr-TR'))

      const slots = getAnimalSlots(a)
      const filledList = slots.filter(s => s.fullName !== 'Yurt Hissesi')

      if (layoutMode === 'multi-column') {
        for (let i = 0; i < maxSharesAcrossAll; i++) {
          const slot = slots[i]
          if (slot) {
            const parts = []
            if (cols.fullName && slot.fullName) parts.push(slot.fullName)
            if (cols.phone && slot.phone) parts.push(slot.phone)
            if (cols.address && slot.address) parts.push(slot.address)
            row.push(safeStr(parts.join(' - ') || '-'))
          } else {
            row.push('-')
          }
        }
      } else {
        if (cols.fullName) row.push(safeStr(filledList.map(s => s.fullName).join(', ') || 'Yurt Hissesi'))
        if (cols.phone) row.push(filledList.map(s => s.phone).filter(Boolean).join(', ') || '-')
        if (cols.address) row.push(safeStr(filledList.map(s => s.address).filter(Boolean).join(', ') || '-'))
      }

      return row
    })

    autoTable(doc, {
      head: [head],
      body,
      startY: 30,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 10, right: 10 },
    })

    doc.save(`HuzurKurban_Hayvanlar_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const triggerExport = () => {
    if (exportType === 'excel') {
      handleExcelExport()
    } else if (exportType === 'pdf') {
      handlePdfExport()
    }
    setIsOpen(false)
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => {
            setExportType('excel')
            setIsOpen(true)
          }}
          disabled={data.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /></svg>
          Excel İndir
        </button>
        <button
          onClick={() => {
            setExportType('pdf')
            setIsOpen(true)
          }}
          disabled={data.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /></svg>
          PDF İndir
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{exportType === 'excel' ? '📊' : '📄'}</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Rapor Sütunlarını Seçin</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tür: {exportType === 'excel' ? 'EXCEL DOSYASI' : 'PDF BELGESİ'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Layout mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hissedar Gösterim Formatı</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('multi-column')}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${layoutMode === 'multi-column' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-black' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    ↔️ Sütunlara Ayır (1. Hissedar, 2...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('single-column')}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${layoutMode === 'single-column' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-black' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    ↕️ Tek Hücrede Birleştir
                  </button>
                </div>
              </div>

              {/* Column Selection */}
              <div className="space-y-4">
                {/* Animal columns */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hayvan Bilgileri</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.order} 
                        onChange={() => toggleColumn('order')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Sıra Numarası</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.earTag} 
                        onChange={() => toggleColumn('earTag')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Küpe Numarası</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.weight} 
                        onChange={() => toggleColumn('weight')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Ağırlık (kg)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.groupName} 
                        onChange={() => toggleColumn('groupName')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Hayvan Grubu</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.deliveryStatus} 
                        onChange={() => toggleColumn('deliveryStatus')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Teslimat Durumu</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.note} 
                        onChange={() => toggleColumn('note')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Hayvan Notu</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm col-span-2">
                      <input 
                        type="checkbox" 
                        checked={cols.createdAt} 
                        onChange={() => toggleColumn('createdAt')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Kayıt Tarihi</span>
                    </label>
                  </div>
                </div>

                {/* Shareholder columns */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hissedar Bilgileri</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.fullName} 
                        onChange={() => toggleColumn('fullName')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Hissedar Adı Soyadı</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={cols.phone} 
                        onChange={() => toggleColumn('phone')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Hissedar Telefonu</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer shadow-sm col-span-2">
                      <input 
                        type="checkbox" 
                        checked={cols.address} 
                        onChange={() => toggleColumn('address')} 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Hissedar Adresi</span>
                    </label>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm bg-white hover:bg-slate-50 transition-all cursor-pointer animate-none"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={triggerExport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {exportType === 'excel' ? '📊 Excel Dosyasını İndir' : '📄 PDF Belgesini İndir'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
