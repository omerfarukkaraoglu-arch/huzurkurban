'use client'

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Registration {
  id: string
  fullName: string
  phone: string
  address: string
  group: string
  share: string | null
  status: string
  createdAt: string
}

export default function ExportButtons({ data }: { data: Registration[] }) {

  const handleExcelExport = () => {
    const rows = data.map((r, i) => ({
      '#': i + 1,
      'Ad Soyad': r.fullName,
      'Telefon': r.phone,
      'Adres': r.address,
      'Kurban Grubu': r.group,
      'Hisse / Not': r.share || '-',
      'Durum': r.status,
      'Kayıt Tarihi': new Date(r.createdAt).toLocaleDateString('tr-TR'),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 5 },   // #
      { wch: 22 },  // Ad Soyad
      { wch: 16 },  // Telefon
      { wch: 35 },  // Adres
      { wch: 30 },  // Kurban Grubu
      { wch: 18 },  // Hisse
      { wch: 14 },  // Durum
      { wch: 14 },  // Tarih
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Kayıtlar')
    XLSX.writeFile(wb, `HuzurKurban_Kayitlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handlePdfExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Title
    doc.setFontSize(18)
    doc.setTextColor(16, 185, 129)
    doc.text('Huzur Kurban - Kayit Listesi', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}  |  Toplam: ${data.length} kayit`, 14, 25)

    // Table
    const head = [['#', 'Ad Soyad', 'Telefon', 'Adres', 'Kurban Grubu', 'Hisse', 'Durum', 'Tarih']]
    const body = data.map((r, i) => [
      i + 1,
      r.fullName,
      r.phone,
      r.address,
      r.group,
      r.share || '-',
      r.status,
      new Date(r.createdAt).toLocaleDateString('tr-TR'),
    ])

    autoTable(doc, {
      head,
      body,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    })

    doc.save(`HuzurKurban_Kayitlar_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExcelExport}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16" /></svg>
        Excel İndir
      </button>
      <button
        onClick={handlePdfExport}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16" /></svg>
        PDF İndir
      </button>
    </div>
  )
}
