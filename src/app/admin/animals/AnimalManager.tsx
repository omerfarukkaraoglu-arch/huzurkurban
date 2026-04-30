'use client'

import React, { useActionState, useTransition, useState } from 'react'
import { createAnimal, updateAnimal, deleteAnimal, deleteAnimals, addShareholder, removeShareholder, bulkImportAnimals, reorderAnimals } from '@/app/actions/animals'
import * as XLSX from 'xlsx'
import imageCompression from 'browser-image-compression'

const initialState = { success: false, message: '', error: '' }

export default function AnimalManager({ initialAnimals, registrations }: { initialAnimals: any[], registrations: any[] }) {
  const [state, formAction, isPending] = useActionState(createAnimal, initialState)
  const [editState, editFormAction, isEditPending] = useActionState(updateAnimal, initialState)
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

  React.useEffect(() => {
    setAnimalsData(initialAnimals)
  }, [initialAnimals])

  const isSearchActive = mainSearchTerm.length > 0
  const filteredAnimals = isSearchActive 
    ? animalsData.filter(a => 
        a.earTag.toLocaleLowerCase('tr-TR').includes(mainSearchTerm.toLocaleLowerCase('tr-TR')) ||
        (a.groupName && a.groupName.toLocaleLowerCase('tr-TR').includes(mainSearchTerm.toLocaleLowerCase('tr-TR'))) ||
        (a.note && a.note.toLocaleLowerCase('tr-TR').includes(mainSearchTerm.toLocaleLowerCase('tr-TR')))
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

  // Close edit modal on success
  if (editState?.success && editingAnimal) {
    setEditingAnimal(null)
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

  const filteredRegistrations = (animalId: string) => {
    const animal = initialAnimals.find(a => a.id === animalId)
    const existingIds = animal?.shareholders?.map((s: any) => s.registrationId) || []
    return registrations
      .filter(r => !existingIds.includes(r.id))
      .filter(r => r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone.includes(searchTerm))
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const imageInputs = form.querySelector('input[type="file"]') as HTMLInputElement;
    const files = imageInputs?.files;
    
    if (files && files.length > 0) {
      formData.delete('images');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
    
    const imageInputs = form.querySelector('input[type="file"]') as HTMLInputElement;
    const files = imageInputs?.files;
    
    if (files && files.length > 0) {
      formData.delete('images');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
      editFormAction(formData);
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
        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Küpe Numarası *</label>
              <input type="text" name="earTag" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: TR-12345678" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Ağırlık (kg) <span className="text-slate-700 font-normal">(Opsiyonel)</span></label>
              <input type="number" name="weight" step="0.1" min="0" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: 450" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Grup <span className="text-slate-700 font-normal">(Opsiyonel)</span></label>
              <input type="text" name="groupName" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white placeholder:text-slate-500 font-medium" placeholder="Örn: Büyükbaş 1. Grup" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Not <span className="text-slate-400 font-normal">(Opsiyonel)</span></label>
            <input type="text" name="note" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 bg-white" placeholder="Hayvan hakkında ek bilgi" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hayvan Görseli <span className="text-slate-400 font-normal">(Birden fazla seçebilirsiniz, otomatik sıkıştırılır)</span></label>
            <input type="file" name="images" multiple accept="image/*" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
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
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                        {!isSearchActive && <div className="text-slate-300 hover:text-slate-500 cursor-grab px-1 text-2xl -mt-2 -mb-2" title="Sürükle bırak ile sırala">☰</div>}
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={selectedIds.includes(animal.id)}
                            onChange={() => toggleSelect(animal.id)}
                        />
                    </div>
                    {!isSearchActive && (
                        <div className="flex flex-col items-center justify-center mr-2">
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
                        <div className="relative">
                          <img src={firstImg} alt={animal.earTag} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          {extraCount > 0 && <span className="absolute -bottom-2 -right-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">+{extraCount}</span>}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl font-bold">
                          🐄
                        </div>
                      )
                    })()}
                    <div>
                      <div className="font-bold text-slate-800 text-lg">{animal.earTag}</div>
                      <div className="text-sm text-slate-700 font-bold">
                        {animal.weight && <span>{animal.weight} kg</span>}
                        {animal.groupName && <span className="ml-2">• {animal.groupName}</span>}
                        <span className="ml-2">• {animal.shareholders?.length || 0}/7 Hissedar</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedAnimal(expandedAnimal === animal.id ? null : animal.id)}
                      className={`font-medium text-sm px-4 py-2 rounded-lg border transition-colors ${expandedAnimal === animal.id ? 'bg-emerald-600 text-white border-emerald-600' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'}`}
                    >
                      {expandedAnimal === animal.id ? 'Kapat' : `Hissedar Yönet (${animal.shareholders?.length || 0}/7)`}
                    </button>
                    <button
                      onClick={() => {
                         setEditingAnimal(animal);
                         setExistingImages(animal.imageUrls && animal.imageUrls.length > 0 ? animal.imageUrls : (animal.imageUrl ? [animal.imageUrl] : []));
                      }}
                      className="text-blue-600 hover:bg-blue-50 font-medium text-sm px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(animal.id)}
                      disabled={isWorking}
                      className="text-red-500 hover:bg-red-50 font-medium text-sm px-3 py-2 rounded-lg border border-red-100 transition-colors disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {expandedAnimal === animal.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3">Mevcut Hissedarlar</h4>
                      {animal.shareholders?.length === 0 ? (
                        <p className="text-sm text-slate-400">Henüz hissedar eklenmemiş.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {animal.shareholders?.map((sh: any) => (
                            <div key={sh.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                              <div>
                                <div className="font-medium text-slate-800 text-sm">{sh.registration.fullName}</div>
                                <div className="text-xs text-slate-500">{sh.registration.phone}</div>
                              </div>
                              <button
                                onClick={() => handleRemoveShareholder(sh.id)}
                                disabled={isWorking}
                                className="text-red-400 hover:text-red-600 text-xs font-medium disabled:opacity-50"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(animal.shareholders?.length || 0) < 7 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2">Hissedar Ekle</h4>
                        <input
                          type="text"
                          placeholder="İsim veya telefon ile arayın..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm mb-2 text-slate-900 bg-white"
                        />
                        <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                          {filteredRegistrations(animal.id).length === 0 ? (
                            <div className="p-3 text-sm text-slate-400 text-center">Eşleşen kayıt bulunamadı.</div>
                          ) : (
                            filteredRegistrations(animal.id).slice(0, 20).map((reg: any) => (
                              <div key={reg.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                <div>
                                  <span className="font-medium text-slate-800 text-sm">{reg.fullName}</span>
                                  <span className="text-xs text-slate-500 ml-2">{reg.phone}</span>
                                  <span className="text-xs text-blue-600 ml-2 bg-blue-50 px-1.5 py-0.5 rounded">{reg.group}</span>
                                </div>
                                <button
                                  onClick={() => handleAddShareholder(animal.id, reg.id)}
                                  disabled={isWorking}
                                  className="text-emerald-600 hover:bg-emerald-50 text-xs font-bold px-3 py-1 rounded border border-emerald-200 transition-colors disabled:opacity-50"
                                >
                                  + Ekle
                                </button>
                              </div>
                            ))
                          )}
                        </div>
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
                <button onClick={() => setEditingAnimal(null)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full border border-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <input type="hidden" name="id" value={editingAnimal.id} />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Küpe Numarası *</label>
                  <input type="text" name="earTag" defaultValue={editingAnimal.earTag} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ağırlık (kg)</label>
                      <input type="number" name="weight" step="0.1" defaultValue={editingAnimal.weight || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grup</label>
                      <input type="text" name="groupName" defaultValue={editingAnimal.groupName || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
                  <input type="text" name="note" defaultValue={editingAnimal.note || ''} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hayvan Görseli Ekle <span className="text-slate-400 font-normal">(Birden fazla seçilebilir)</span></label>
                  <input type="file" name="images" multiple accept="image/*" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  
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
                <button type="button" onClick={() => setEditingAnimal(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Vazgeç</button>
                <button type="submit" disabled={isEditPending} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
                  {isEditPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
