'use client'

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AnimalData {
  id: string
  earTag: string
  weight: number | null
  groupName: string | null
  note: string | null
  shareholders: { registration: { fullName: string; phone: string } }[]
  createdAt: string
}

export default function AnimalExportButtons({ data }: { data: AnimalData[] }) {

  const handleExcelExport = () => {
    const rows = data.map((a, i) => ({
      '#': i + 1,
      'Küpe No': a.earTag,
      'Ağırlık (kg)': a.weight || '-',
      'Grup': a.groupName || '-',
      'Hissedarlar': a.shareholders.map(s => s.registration.fullName).join(', ') || '-',
      'Hissedar Sayısı': `${a.shareholders.length}/7`,
      'Not': a.note || '-',
      'Kayıt Tarihi': new Date(a.createdAt).toLocaleDateString('tr-TR'),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 22 },
      { wch: 45 }, { wch: 14 }, { wch: 25 }, { wch: 14 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hayvanlar')
    XLSX.writeFile(wb, `HuzurKurban_Hayvanlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handlePdfExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    doc.setFontSize(18)
    doc.setTextColor(16, 185, 129)
    doc.text('Huzur Kurban - Hayvan Listesi', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}  |  Toplam: ${data.length} hayvan`, 14, 25)

    const head = [['#', 'Kupe No', 'Agirlik', 'Grup', 'Hissedarlar', 'Sayi', 'Not']]
    const body = data.map((a, i) => [
      i + 1,
      a.earTag,
      a.weight ? `${a.weight} kg` : '-',
      a.groupName || '-',
      a.shareholders.map(s => s.registration.fullName).join(', ') || '-',
      `${a.shareholders.length}/7`,
      a.note || '-',
    ])

    autoTable(doc, {
      head,
      body,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 4: { cellWidth: 70 } },
      margin: { left: 14, right: 14 },
    })

    doc.save(`HuzurKurban_Hayvanlar_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExcelExport}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /></svg>
        Excel İndir
      </button>
      <button
        onClick={handlePdfExport}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" /></svg>
        PDF İndir
      </button>
    </div>
  )
}
