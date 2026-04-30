'use client'

import { useState, useTransition } from 'react'
import { deleteRegistrations, bulkImportRegistrations } from '@/app/actions/register'
import * as LucideIcons from 'lucide-react'
import * as XLSX from 'xlsx'

interface RegistrationTableProps {
  initialRegistrations: any[]
  type: 'standard' | 'donation'
}

export default function RegistrationTable({ initialRegistrations, type }: RegistrationTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isWorking, startTransition] = useTransition()
  const [importResult, setImportResult] = useState<{ success: boolean, message: string, stats?: any } | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('isDonation', String(type === 'donation'))

    startTransition(async () => {
      const res = await bulkImportRegistrations(formData)
      setImportResult(res)
      setTimeout(() => setImportResult(null), 10000)
    })
  }

  const downloadSampleTemplate = () => {
    const data = type === 'standard' 
      ? [{ 'Ad Soyad': 'Örnek Kullanıcı', 'Telefon': '05551234567', 'Adres': 'İstanbul', 'Grup': 'Büyükbaş 1. Grup', 'Hisse': '1/7' }]
      : [{ 'Ad Soyad': 'Bağışçı Adı', 'Telefon': '05559876543', 'Adres': 'Ankara', 'Bağış Türü': 'Talebe Bağışı', 'Not': 'Zekat niyetine' }]
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kayıtlar')
    XLSX.writeFile(workbook, `HuzurKurban_${type === 'standard' ? 'Kayit' : 'Bagis'}_Import_Sablon.xlsx`)
  }

  const filteredRegistrations = initialRegistrations.filter(reg => 
    reg.fullName.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
    reg.phone.includes(searchTerm)
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRegistrations.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`${selectedIds.length} adet kaydı silmek istediğinize emin misiniz?`)) {
      startTransition(async () => {
        const res = await deleteRegistrations(selectedIds)
        if (res.success) {
          setSelectedIds([])
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[40px]">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="İsim veya telefon ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 bg-white"
          />
          <div className="absolute left-3 top-2.5 text-slate-700">
            <LucideIcons.Search className="w-5 h-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
              onClick={downloadSampleTemplate}
              className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 transition-colors flex items-center gap-2"
            >
              📄 Şablon
            </button>
            <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-200 transition-colors flex items-center gap-2">
              📥 İçe Aktar
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={isWorking} />
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200 ml-2">
                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {selectedIds.length}
                </span>
                <button 
                  onClick={handleBulkDelete}
                  disabled={isWorking}
                  className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold border border-red-100 transition-all flex items-center gap-2"
                  title="Seçilenleri Sil"
                >
                  {isWorking ? '...' : '🗑️'}
                </button>
              </div>
            )}
        </div>
      </div>

      {importResult && (
        <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-200 ${importResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          <div className="font-bold flex items-center gap-2 text-sm">
            {importResult.success ? '✅ İşlem Başarılı' : '❌ Hata Oluştu'}
          </div>
          <div className="text-xs mt-1">{importResult.message}</div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selectedIds.length === initialRegistrations.length && initialRegistrations.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-semibold">Tarih</th>
                <th className="p-4 font-semibold">Ad Soyad</th>
                <th className="p-4 font-semibold">Telefon</th>
                <th className="p-4 font-semibold">{type === 'standard' ? 'Grup' : 'Bağış Türü'}</th>
                <th className="p-4 font-semibold">{type === 'standard' ? 'Hisse' : 'Not'}</th>
                <th className="p-4 font-semibold">Durum</th>
                <th className="p-4 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-700 font-medium italic">
                    {searchTerm ? 'Aranan kritere uygun kayıt bulunamadı.' : 'Henüz kayıt bulunmamaktadır.'}
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(reg.id) ? 'bg-emerald-50/30' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selectedIds.includes(reg.id)}
                        onChange={() => toggleSelect(reg.id)}
                      />
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {new Date(reg.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{reg.fullName}</td>
                    <td className="p-4 text-slate-600">{reg.phone}</td>
                    <td className="p-4 text-slate-600">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium border ${type === 'standard' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {reg.group}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {reg.share || '-'}
                    </td>
                    <td className="p-4">
                      {reg.status === 'BEKLEMEDE' ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded text-xs font-medium border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Beklemede
                        </span>
                      ) : reg.status === 'ONAYLANDI' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded text-xs font-medium border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Onaylandı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-medium border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          {reg.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { if(confirm('Bu kaydı silmek istediğinize emin misiniz?')) startTransition(async () => { await deleteRegistrations([reg.id]) }) }}
                        disabled={isWorking}
                        className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
