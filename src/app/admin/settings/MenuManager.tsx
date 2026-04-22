'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  title: string
  icon: string
  target: string
  url?: string
  color: string
}

export default function MenuManager({ initialConfig }: { initialConfig?: string }) {
  const [items, setItems] = useState<MenuItem[]>([])

  useEffect(() => {
    try {
      if (initialConfig) {
        setItems(JSON.parse(initialConfig))
      }
    } catch (e) {
      console.error("Failed to parse menu config", e)
    }
  }, [initialConfig])

  const updateItem = (index: number, field: keyof MenuItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Yeni Başlık',
      icon: '⚙️',
      target: '#',
      color: 'hover:bg-slate-50 text-slate-700'
    }
    setItems([...items, newItem])
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Menü Sıralaması ve İçeriği</h4>
        <button 
          type="button"
          onClick={addItem}
          className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
        >
          + Yeni Öğe Ekle
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 group">
            <div className="flex flex-col gap-1">
                <button type="button" onClick={() => moveItem(index, 'up')} className="p-1 hover:bg-white rounded text-slate-400 hover:text-emerald-600">▲</button>
                <button type="button" onClick={() => moveItem(index, 'down')} className="p-1 hover:bg-white rounded text-slate-400 hover:text-emerald-600">▼</button>
            </div>
            
            <input 
              type="text" 
              value={item.icon} 
              onChange={(e) => updateItem(index, 'icon', e.target.value)}
              className="w-12 text-center py-2 rounded-lg border border-slate-200 bg-white"
              placeholder="İkon"
            />
            
            <div className="flex-1 grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={item.title} 
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold"
                  placeholder="Başlık"
                />
                <input 
                  type="text" 
                  value={item.target === 'external' ? item.url : item.target} 
                  onChange={(e) => {
                      if (item.target === 'external') updateItem(index, 'url', e.target.value)
                      else updateItem(index, 'target', e.target.value)
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                  placeholder="Link / Target"
                />
            </div>

            <select 
                value={item.target === 'external' ? 'external' : item.target === 'modal' ? 'modal' : 'scroll'}
                onChange={(e) => {
                   const val = e.target.value
                   if (val === 'external') updateItem(index, 'target', 'external')
                   else if (val === 'modal') updateItem(index, 'target', 'modal')
                   else updateItem(index, 'target', item.target.startsWith('#') ? item.target : '#')
                }}
                className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
            >
                <option value="scroll">Sayfada Kaydır</option>
                <option value="modal">Modal Aç (Randevu)</option>
                <option value="external">Dış Link (WhatsApp)</option>
            </select>

            <button 
              type="button" 
              onClick={() => removeItem(index)}
              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <input type="hidden" name="menuConfig" value={JSON.stringify(items)} />
      
      <p className="text-[10px] text-slate-400 mt-2">
        * Not: Dış link için WhatsApp kullanıyorsanız, ID kısmının 'whatsapp' olması numaranın otomatik güncellenmesini sağlar.
      </p>
    </div>
  )
}
