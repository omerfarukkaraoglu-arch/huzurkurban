'use client'

import React, { useActionState, useTransition, useState, useEffect } from 'react'
import { createAnimal, updateAnimal, deleteAnimal, deleteAnimals, addShareholder, removeShareholder, bulkImportAnimals, reorderAnimals, createRegistrationAndAddAsShareholder } from '@/app/actions/animals'
import * as XLSX from 'xlsx'
import imageCompression from 'browser-image-compression'
import { safeLocaleLowerCase, normalizeSearchString } from '@/lib/utils'
import CameraModal from '@/components/CameraModal'

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

const initialState = { success: false, message: '', error: '' }

export default function AnimalManager({ initialAnimals, registrations, kurbanGroups = [] }: { initialAnimals: any[], registrations: any[], kurbanGroups?: any[] }) {
  const GROUP_OPTIONS = kurbanGroups && kurbanGroups.length > 0 
    ? kurbanGroups.map(g => g.name) 
    : ['30-35k', '35-40k']
  const [state, formAction, isPending] = useActionState(createAnimal, initialState)
  const [editState, setEditState] = useState<{ success: boolean, message: string, error: string } | null>(null)
  const [isEditPending, startEditTransition] = useTransition()
  const [isWorking, startTransition] = useTransition()
  
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null)
  const [editingAnimal, setEditingAnimal] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [mainSearchTerm, setMainSearchTerm] = useState('')
  const [importResult, setImportResult] = useState<{ success: boolean, message: string, stats?: any } | null>(null)
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const [animalsData, setAnimalsData] = useState<any[]>(initialAnimals)
  const [draggedItem, setDraggedItem] = useState<any | null>(null)
  
  const [existingImages, setExistingImages] = useState<string[]>([])

  // Camera & Image states
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<'create' | 'edit' | null>(null)
  const [createFormImages, setCreateFormImages] = useState<File[]>([])
  const [editFormNewImages, setEditFormNewImages] = useState<File[]>([])
  const [showOnlyMatchingGroup, setShowOnlyMatchingGroup] = useState(true)
  const [addingNewShareholderToAnimalId, setAddingNewShareholderToAnimalId] = useState<string | null>(null)

  // Reset create form state on success
  React.useEffect(() => {
    if (state?.success) {
      setCreateFormImages([])
      const form = document.getElementById('create-animal-form') as HTMLFormElement
      if (form) form.reset()
    }
  }, [state])

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCreateFormImages(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFormNewImages(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleCaptureImage = (file: File) => {
    if (cameraTarget === 'create') {
      setCreateFormImages(prev => [...prev, file])
    } else if (cameraTarget === 'edit') {
      setEditFormNewImages(prev => [...prev, file])
    }
  }

  React.useEffect(() => {
    setAnimalsData(initialAnimals)
  }, [initialAnimals])

  const isSearchActive = mainSearchTerm.length > 0
  const filteredAnimals = isSearchActive 
    ? animalsData.filter(a => 
        normalizeSearchString(a.earTag).includes(normalizeSearchString(mainSearchTerm)) ||
        (a.groupName && normalizeSearchString(a.groupName).includes(normalizeSearchString(mainSearchTerm))) ||
        (a.note && normalizeSearchString(a.note).includes(normalizeSearchString(mainSearchTerm)))
      )
    : animalsData

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
       const el = e.target as HTMLElement
       el.classList.add('opacity-50')
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (!draggedItem) return
    const draggedOverItem = animalsData[index]
    if (draggedItem.id === draggedOverItem.id) return
    
    // Yalnızca arama aktif değilken sıralamaya izin ver
    if (isSearchActive) return

    let items = [...animalsData].filter(a => a.id !== draggedItem.id)
    items.splice(index, 0, draggedItem)
    setAnimalsData(items)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.target as HTMLElement
    el.classList.remove('opacity-50')
    if (!draggedItem) return
    setDraggedItem(null)

    const updates = animalsData.map((a: any, i: number) => ({ id: a.id, order: i + 1 }))
    startTransition(async () => {
      await reorderAnimals(updates)
    })
  }

  const handleManualOrderChange = (animalId: string, newOrderStr: string) => {
    const newOrder = parseInt(newOrderStr)
    if (isNaN(newOrder) || newOrder < 1 || newOrder > animalsData.length) return
    
    const itemIdx = animalsData.findIndex(a => a.id === animalId)
    if (itemIdx < 0) return
    
    const item = animalsData[itemIdx]
    let items = [...animalsData].filter(a => a.id !== animalId)
    items.splice(newOrder - 1, 0, item)
    setAnimalsData(items)

    const updates = items.map((a: any, i: number) => ({ id: a.id, order: i + 1 }))
    startTransition(async () => {
      await reorderAnimals(updates)
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAnimals.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAnimals.map((a: any) => a.id))
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
    if (confirm(`${selectedIds.length} adet hayvanı ve bu hayvanlara bağlı hissedar kayıtlarını silmek istediğinize emin misiniz?`)) {
      startTransition(async () => {
        const res = await deleteAnimals(selectedIds)
        if (res.success) {
          setSelectedIds([])
        }
      })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const res = await bulkImportAnimals(formData)
      setImportResult(res)
      setTimeout(() => setImportResult(null), 10000)
    })
  }

  const downloadSampleTemplate = () => {
    const data = [
      { 'Küpe No': 'TR-12345678', 'Kilo': 450, 'Grup': 'Büyükbaş 1. Grup', 'Not': 'Örnek açıklama' }
    ]
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hayvanlar')
    XLSX.writeFile(workbook, 'HuzurKurban_Hayvan_Import_Sablon.xlsx')
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu hayvanı ve tüm hissedar bilgilerini silmek istediğinize emin misiniz?')) {
      startTransition(async () => { await deleteAnimal(id) })
    }
  }

  const handleAddShareholder = (animalId: string, registrationId: string) => {
    startTransition(async () => { await addShareholder(animalId, registrationId) })
  }

  const handleRemoveShareholder = (shareholderId: string) => {
    startTransition(async () => { await removeShareholder(shareholderId) })
  }

  const handleCreateNewShareholderAndAdd = async (e: React.FormEvent<HTMLFormElement>, animalId: string) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const group = formData.get('group') as string
    const share = formData.get('share') as string
    
    startTransition(async () => {
      const res = await createRegistrationAndAddAsShareholder(animalId, {
        fullName,
        phone,
        address,
        group,
        share
      })
      if (res.success) {
        setAddingNewShareholderToAnimalId(null)
      } else {
        alert(res.error || 'Hissedar eklenirken hata oluştu.')
      }
    })
  }

  const filteredRegistrations = (animalId: string) => {
    const animal = initialAnimals.find(a => a.id === animalId)
    const existingIds = animal?.shareholders?.map((s: any) => s.registrationId) || []
    const trimmed = searchTerm.trim()
    
    let list = registrations.filter(r => !existingIds.includes(r.id))
    
    // Yalnızca aynı fiyat grubundaki hissedarları filtrele
    if (showOnlyMatchingGroup && animal && animal.groupName) {
      list = list.filter(r => r.group && r.group.includes(animal.groupName))
    }
    
    if (trimmed) {
      list = list.filter(r => {
        // Eğer arama terimi 1-3 haneli sadece sayıdan oluşuyorsa, bunu grup numarası araması olarak gör.
        // Böylece telefon numarasında o sayı geçen alakasız kişiler listelenmez.
        const isNumericGroupQuery = /^\d{1,3}$/.test(trimmed)
        if (isNumericGroupQuery) {
          const groupNumbers = r.group ? r.group.match(/\d+/g) || [] : []
          return groupNumbers.includes(trimmed)
        }

        const lowerTrimmed = normalizeSearchString(trimmed)
        return (
          (r.group && normalizeSearchString(r.group).includes(lowerTrimmed)) ||
          normalizeSearchString(r.fullName).includes(lowerTrimmed) ||
          r.phone.includes(trimmed)
        )
      })
    }
    
    // Fiyat grubuna göre öncelikli sırala (özellikle filtre kaldırıldığında uyuşanlar üstte görünsün)
    if (animal && animal.groupName) {
      list.sort((a, b) => {
        const aMatch = a.group && a.group.includes(animal.groupName) ? 1 : 0
        const bMatch = b.group && b.group.includes(animal.groupName) ? 1 : 0
        return bMatch - aMatch
      })
    }
    
    return list
  }

  const handleAddAllFiltered = (animalId: string) => {
    const regs = filteredRegistrations(animalId)
    const animal = initialAnimals.find((a: any) => a.id === animalId)
    let currentShares = animal?.shareholders?.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0) || 0
    
    const toAdd: string[] = []
    for (const reg of regs) {
      const regShares = parseShareCount(reg.share)
      if (currentShares + regShares <= 7) {
        toAdd.push(reg.id)
        currentShares += regShares
      } else {
        break
      }
    }

    if (toAdd.length === 0) return
    startTransition(async () => {
      for (const id of toAdd) {
        await addShareholder(animalId, id)
      }
    })
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Clear any native file selections since we use state
    formData.delete('images');
    
    if (createFormImages.length > 0) {
      for (let i = 0; i < createFormImages.length; i++) {
        const file = createFormImages[i];
        try {
           const compressedFile = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true });
           formData.append('images', compressedFile, compressedFile.name);
        } catch (err) {
           console.error('Compression error:', err);
           formData.append('images', file, file.name);
        }
      }
    }
    
    startTransition(() => {
      formAction(formData);
    });
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    formData.append('existingImages', JSON.stringify(existingImages));
    
    // Clear any native file selections since we use state
    formData.delete('images');
    
    if (editFormNewImages.length > 0) {
      for (let i = 0; i < editFormNewImages.length; i++) {
        const file = editFormNewImages[i];
        try {
           const compressedFile = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true });
           formData.append('images', compressedFile, compressedFile.name);
        } catch (err) {
           console.error('Compression error:', err);
           formData.append('images', file, file.name);
        }
      }
    }
    
    startEditTransition(async () => {
      const res = await updateAnimal(null, formData);
      if (res.success) {
        setEditingAnimal(null);
        setEditState(null);
        setEditFormNewImages([]);
      } else {
        setEditState({ success: false, message: '', error: res.error || 'Güncelleme başarısız oldu.' });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Yeni Hayvan Ekleme Formu */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Yeni Hayvan Ekle</h3>
          <div className="flex gap-2">
            <button 
              onClick={downloadSampleTemplate}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 transition-colors"
            >
              📄 Örnek Şablon İndir
            </button>
            <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-200 transition-colors">
              📥 Toplu İçe Aktar (Excel)
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={isWorking} />
            </label>
          </div>
        </div>
        
        {importResult && (
          <div className={`mx-6 mt-4 p-4 rounded-xl border ${importResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <div className="font-bold flex items-center gap-2">
              {importResult.success ? '✅ İşlem Başarılı' : '❌ Hata Oluştu'}
            </div>
            <div className="text-sm mt-1">{importResult.message}</div>
          </div>
        )}
        <form id="create-animal-form" onSubmit={handleCreateSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Küpe Numarası *</label>
              <input type="text" name="earTag" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: TR-12345678" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Sıra Numarası <span className="text-slate-700 font-normal">(Opsiyonel)</span></label>
              <input type="number" name="order" min="1" defaultValue={animalsData.length + 1} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: 1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Ağırlık (kg) <span className="text-slate-700 font-normal">(Opsiyonel)</span></label>
              <input type="number" name="weight" step="0.1" min="0" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: 450" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Grup <span className="text-slate-700 font-normal">(Opsiyonel)</span></label>
              <select name="groupName" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium">
                <option value="">Grup Seçilmedi</option>
                {GROUP_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Hisse Adedi *</label>
              <select name="maxShares" required defaultValue="7" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} Hisse</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Not <span className="text-slate-400 font-normal">(Opsiyonel)</span></label>
            <input type="text" name="note" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" placeholder="Hayvan hakkında ek bilgi" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">Hayvan Görseli <span className="text-slate-500 font-normal text-xs">(Dosyadan seçebilir veya kamerayla çekebilirsiniz)</span></label>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="cursor-pointer px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5">
                📁 Dosyadan Seç
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleCreateFileChange} 
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setCameraTarget('create')
                  setIsCameraOpen(true)
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                📷 Kamera Aç
              </button>
            </div>

            {/* Previews of newly selected/captured images */}
            {createFormImages.length > 0 && (
              <div className="mt-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                <label className="block text-xs font-bold text-slate-500 mb-2">Yüklenecek Görseller ({createFormImages.length}):</label>
                <div className="flex gap-2 flex-wrap">
                  {createFormImages.map((file, i) => {
                    const previewUrl = URL.createObjectURL(file)
                    return (
                      <div key={i} className="relative group">
                        <img src={previewUrl} alt="preview" className="w-16 h-16 rounded border border-slate-200 object-cover shadow-sm" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCreateFormImages(prev => prev.filter((_, idx) => idx !== i))
                            URL.revokeObjectURL(previewUrl)
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {state?.error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{state.error}</div>}
          {state?.success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{state.message}</div>}

          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
              {isPending ? 'Kaydediliyor...' : 'Hayvanı Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Hayvan Listesi */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
                <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selectedIds.length === filteredAnimals.length && filteredAnimals.length > 0}
                    onChange={toggleSelectAll}
                />
                <span className="text-sm font-bold text-slate-600 whitespace-nowrap">Hepsini Seç</span>
                
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200 ml-2">
                        <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                          {selectedIds.length} Seçili
                        </span>
                        <button 
                          onClick={() => window.open(`/admin/animals/print-labels?ids=${selectedIds.join(',')}`, '_blank')}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-100 transition-all whitespace-nowrap"
                        >
                          🖨️ Karekodları Yazdır
                        </button>
                        <button 
                          onClick={handleBulkDelete}
                          disabled={isWorking}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold border border-red-100 transition-all whitespace-nowrap"
                        >
                          {isWorking ? 'Siliniyor...' : '🗑️ Seçilenleri Sil'}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Küpe no, grup veya not ile ara..."
                    value={mainSearchTerm}
                    onChange={(e) => setMainSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm text-slate-900 bg-white"
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400 text-sm">
                    🔍
                  </div>
                </div>
                <div className="text-sm text-slate-500 font-medium whitespace-nowrap">Toplam {initialAnimals.length} Hayvan</div>
            </div>
        </div>

        {filteredAnimals.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-slate-700 font-bold border-2 border-dashed border-slate-200">
            {mainSearchTerm ? 'Aranan kritere uygun hayvan bulunamadı.' : 'Henüz hayvan kaydedilmemiş.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnimals.map((animal: any, index: number) => (
              <div 
                key={animal.id} 
                draggable={!isSearchActive}
                onDragStart={(e) => handleDragStart(e, animal)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${selectedIds.includes(animal.id) ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-200'} ${!isSearchActive && 'cursor-move'}`}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        {!isSearchActive && <div className="text-slate-300 hover:text-slate-500 cursor-grab px-1 text-2xl -mt-2 -mb-2" title="Sürükle bırak ile sırala">☰</div>}
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={selectedIds.includes(animal.id)}
                            onChange={() => toggleSelect(animal.id)}
                        />
                    </div>
                    {!isSearchActive && (
                        <div className="flex flex-col items-center justify-center mr-1 sm:mr-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold mb-0.5">SIRA</span>
                            <input 
                               key={`order-${animal.id}-${index}`}
                               type="text" 
                               defaultValue={index + 1}
                               onBlur={(e) => {
                                 if (e.target.value !== String(index + 1)) {
                                   handleManualOrderChange(animal.id, e.target.value)
                                 }
                               }}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   e.currentTarget.blur()
                                 }
                               }}
                               className="w-10 h-8 text-center bg-slate-50 border border-slate-200 rounded font-bold text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    )}
                    {(() => {
                      const firstImg = animal.imageUrls && animal.imageUrls.length > 0 ? animal.imageUrls[0] : animal.imageUrl;
                      const extraCount = animal.imageUrls ? Math.max(0, animal.imageUrls.length - 1) : 0;
                      return firstImg ? (
                        <div className="relative shrink-0">
                          <img src={firstImg} alt={animal.earTag} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          {extraCount > 0 && <span className="absolute -bottom-2 -right-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">+{extraCount}</span>}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
                          🐄
                        </div>
                      )
                    })()}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-base sm:text-lg truncate">{animal.earTag}</div>
                      {(() => {
                        const totalShares = animal.shareholders?.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0) || 0;
                        const maxShares = animal.maxShares || 7;
                        return (
                          <div className="text-xs sm:text-sm text-slate-700 font-bold flex flex-wrap gap-x-2 gap-y-0.5">
                            {animal.weight && <span>{animal.weight} kg</span>}
                            {animal.groupName && <span>• {animal.groupName}</span>}
                            <span>• {totalShares}/{maxShares} Hissedar</span>
                            {animal.note && <span className="text-slate-500 font-medium">• Not: {animal.note}</span>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                    {(() => {
                      const totalShares = animal.shareholders?.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0) || 0;
                      const maxShares = animal.maxShares || 7;
                      return (
                        <button
                          onClick={() => setExpandedAnimal(expandedAnimal === animal.id ? null : animal.id)}
                          className={`font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border transition-colors flex-1 sm:flex-initial text-center ${expandedAnimal === animal.id ? 'bg-emerald-600 text-white border-emerald-600' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'}`}
                        >
                          {expandedAnimal === animal.id ? 'Kapat' : `Hissedar Yönet (${totalShares}/${maxShares})`}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => {
                         setEditingAnimal(animal);
                         setEditState(null);
                         setExistingImages(animal.imageUrls && animal.imageUrls.length > 0 ? animal.imageUrls : (animal.imageUrl ? [animal.imageUrl] : []));
                         setEditFormNewImages([]);
                      }}
                      className="text-blue-600 hover:bg-blue-50 font-medium text-xs sm:text-sm px-3 py-2 rounded-lg border border-blue-100 transition-colors text-center"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(animal.id)}
                      disabled={isWorking}
                      className="text-red-500 hover:bg-red-50 font-medium text-xs sm:text-sm px-3 py-2 rounded-lg border border-red-100 transition-colors disabled:opacity-50 text-center"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {expandedAnimal === animal.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3">Mevcut Hissedarlar</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(() => {
                          const totalShares = animal.shareholders?.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0) || 0;
                          const maxShares = animal.maxShares || 7;
                          const emptyCount = Math.max(0, maxShares - totalShares);
                          
                          const filledSlots = animal.shareholders?.flatMap((sh: any) => {
                            const copyCount = parseShareCount(sh.registration?.share)
                            return Array.from({ length: copyCount }).map((_, i) => ({
                              type: 'filled',
                              sh,
                              copyIdx: i,
                              copyCount
                            }))
                          }) || [];
                          
                          const emptySlots = Array.from({ length: emptyCount }).map((_, i) => ({
                            type: 'empty',
                            slotIdx: totalShares + i + 1
                          }));
                          
                          const allSlots = [...filledSlots, ...emptySlots];
                          
                          if (allSlots.length === 0) {
                            return <div className="col-span-full text-sm text-slate-400">Henüz hissedar eklenmemiş.</div>;
                          }
                          
                          return allSlots.map((slot, index) => {
                            if (slot.type === 'filled') {
                              const { sh, copyIdx, copyCount } = slot as any;
                              return (
                                <div key={`filled-${sh.id}-${copyIdx}`} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">
                                      {sh.registration?.fullName || 'Bilinmeyen Hissedar'} {copyCount > 1 ? `(${copyIdx + 1}/${copyCount})` : ''}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">{sh.registration?.phone}</div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveShareholder(sh.id)}
                                    disabled={isWorking}
                                    className="text-red-400 hover:text-red-600 text-xs font-bold disabled:opacity-50 px-1.5 py-0.5 rounded hover:bg-red-50"
                                    title="Kaldır"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            } else {
                              const { slotIdx } = slot as any;
                              return (
                                <div key={`empty-${index}`} className="flex items-center justify-between bg-slate-50/50 rounded-lg p-3 border border-dashed border-slate-200 text-slate-400 select-none">
                                  <span className="text-xs font-semibold italic">🐄 {slotIdx}. Hisse (Boş Hisse)</span>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    </div>

                    {(() => {
                      const totalShares = animal.shareholders?.reduce((sum: number, sh: any) => sum + parseShareCount(sh.registration?.share), 0) || 0;
                      const maxShares = animal.maxShares || 7;
                      return totalShares < maxShares;
                    })() && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-slate-700">Hissedar Ekle</h4>
                          {addingNewShareholderToAnimalId === animal.id ? (
                            <button
                              onClick={() => setAddingNewShareholderToAnimalId(null)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                              ← Aramaya Dön
                            </button>
                          ) : (
                            <button
                              onClick={() => setAddingNewShareholderToAnimalId(animal.id)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                              👤 Yeni Hissedar Kaydet ve Ekle
                            </button>
                          )}
                        </div>

                        {addingNewShareholderToAnimalId === animal.id ? (
                          <form 
                            onSubmit={(e) => handleCreateNewShareholderAndAdd(e, animal.id)}
                            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Ad Soyad *</label>
                                <input 
                                  type="text" 
                                  name="fullName" 
                                  required 
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 bg-white" 
                                  placeholder="Ahmet Yılmaz"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Telefon *</label>
                                <input 
                                  type="tel" 
                                  name="phone" 
                                  required 
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 bg-white" 
                                  placeholder="05XX XXX XX XX"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">Adres</label>
                              <textarea 
                                name="address" 
                                rows={1} 
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 resize-none bg-white" 
                                placeholder="Teslimat Adresi"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Hisse / Not</label>
                                <input 
                                  type="text" 
                                  name="share" 
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 bg-white" 
                                  placeholder="Örn: 1 Hisse"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Grup *</label>
                                <select 
                                  name="group" 
                                  required 
                                  defaultValue={animal.groupName || ''} 
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 bg-white font-medium"
                                >
                                  <option value="">Seçiniz...</option>
                                  {GROUP_OPTIONS.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button 
                                type="button" 
                                onClick={() => setAddingNewShareholderToAnimalId(null)}
                                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
                              >
                                Vazgeç
                              </button>
                              <button 
                                type="submit"
                                disabled={isWorking}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm"
                              >
                                {isWorking ? 'Kaydediliyor...' : 'Kaydet ve Ekle'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="İsim veya telefon ile arayın..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm mb-2 text-slate-900 bg-white"
                            />
                            {animal.groupName && (
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="checkbox"
                                  id={`matching-group-${animal.id}`}
                                  checked={showOnlyMatchingGroup}
                                  onChange={(e) => setShowOnlyMatchingGroup(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label 
                                  htmlFor={`matching-group-${animal.id}`} 
                                  className="text-xs font-bold text-slate-600 select-none cursor-pointer"
                                >
                                  Yalnızca bu fiyat grubundaki ({animal.groupName}) hissedarları listele
                                </label>
                              </div>
                            )}
                            {searchTerm.trim() && filteredRegistrations(animal.id).length > 1 && (
                              <button
                                onClick={() => handleAddAllFiltered(animal.id)}
                                disabled={isWorking}
                                className="w-full mb-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                ✅ Tüm {filteredRegistrations(animal.id).length} Kişiyi Ekle (Grup {searchTerm.trim()})
                              </button>
                            )}
                            <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                              {filteredRegistrations(animal.id).length === 0 ? (
                                <div className="p-3 text-sm text-slate-400 text-center">Eşleşen kayıt bulunamadı.</div>
                              ) : (
                                filteredRegistrations(animal.id).slice(0, 20).map((reg: any) => (
                                  <div key={reg.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shrink-0">{reg.group}</span>
                                      <div>
                                        <span className="font-medium text-slate-800 text-sm">{reg.fullName}</span>
                                        <span className="text-xs text-slate-500 ml-2">{reg.phone}</span>
                                        <span className="text-xs text-blue-600 ml-2 bg-blue-50 px-1.5 py-0.5 rounded">{reg.group}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleAddShareholder(animal.id, reg.id)}
                                      disabled={isWorking}
                                      className="text-emerald-600 hover:bg-emerald-50 text-xs font-bold px-3 py-1 rounded border border-emerald-200 transition-colors disabled:opacity-50 shrink-0"
                                    >
                                      + Ekle
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingAnimal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Hayvanı Düzenle</h3>
                    <p className="text-sm text-slate-500">{editingAnimal.earTag} küpe numaralı kayıt</p>
                </div>
                <button onClick={() => { setEditingAnimal(null); setEditState(null); setEditFormNewImages([]); }} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full border border-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <input type="hidden" name="id" value={editingAnimal.id} />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Küpe Numarası *</label>
                  <input type="text" name="earTag" defaultValue={editingAnimal.earTag} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sıra No</label>
                      <input type="number" name="order" min="1" defaultValue={editingAnimal.order || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ağırlık (kg)</label>
                      <input type="number" name="weight" step="0.1" defaultValue={editingAnimal.weight || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grup</label>
                      <select name="groupName" defaultValue={editingAnimal.groupName || ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900">
                        <option value="">Grup Seçilmedi</option>
                        {editingAnimal.groupName && !GROUP_OPTIONS.includes(editingAnimal.groupName) && (
                          <option value={editingAnimal.groupName}>{editingAnimal.groupName}</option>
                        )}
                        {GROUP_OPTIONS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hisse Adedi</label>
                      <select name="maxShares" required defaultValue={editingAnimal.maxShares || 7} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 font-medium">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} Hisse</option>
                        ))}
                      </select>
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
                  <input type="text" name="note" defaultValue={editingAnimal.note || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-800">Hayvan Görseli Ekle <span className="text-slate-500 font-normal text-xs">(Dosyadan seçebilir veya kamerayla çekebilirsiniz)</span></label>
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <label className="cursor-pointer px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5">
                      📁 Dosyadan Seç
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleEditFileChange} 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget('edit')
                        setIsCameraOpen(true)
                      }}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      📷 Kamera Aç
                    </button>
                  </div>
                  
                  {/* Previews of newly selected/captured images */}
                  {editFormNewImages.length > 0 && (
                      <div className="mb-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                          <label className="block text-xs font-bold text-slate-500 mb-2">Eklenecek Yeni Görseller ({editFormNewImages.length}):</label>
                          <div className="flex gap-2 flex-wrap">
                              {editFormNewImages.map((file, i) => {
                                  const previewUrl = URL.createObjectURL(file)
                                  return (
                                      <div key={i} className="relative group">
                                          <img src={previewUrl} alt="preview" className="w-16 h-16 rounded border border-slate-200 object-cover shadow-sm" />
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              setEditFormNewImages(prev => prev.filter((_, idx) => idx !== i))
                                              URL.revokeObjectURL(previewUrl)
                                            }}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                                          >
                                            ✕
                                          </button>
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  )}

                  {existingImages.length > 0 && (
                      <div className="mt-3">
                          <label className="block text-xs font-bold text-slate-500 mb-2">Mevcut Görseller:</label>
                          <div className="flex gap-2 flex-wrap">
                              {existingImages.map((url, i) => (
                                  <div key={i} className="relative group">
                                      <img src={url} alt="preview" className="w-16 h-16 rounded border border-slate-200 object-cover" />
                                      <button 
                                        type="button" 
                                        onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        ✕
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                </div>
              </div>

              {editState?.error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{editState.error}</div>}
              {editState?.success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{editState.message}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => { setEditingAnimal(null); setEditState(null); setEditFormNewImages([]); }} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Vazgeç</button>
                <button type="submit" disabled={isEditPending} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
                  {isEditPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => {
          setIsCameraOpen(false)
          setCameraTarget(null)
        }} 
        onCapture={handleCaptureImage} 
      />
    </div>
  )
}
