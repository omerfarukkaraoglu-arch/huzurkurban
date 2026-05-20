'use client'

import { useState, useTransition } from 'react'
import { findAnimalByInquiry } from '@/app/actions/inquiry'
import { safeLocaleLowerCase, normalizeSearchString } from '@/lib/utils'

export default function AnimalInquiry() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setCurrentImageIndex(0)
    setIsFullscreenOpen(false)

    startTransition(async () => {
      const res = await findAnimalByInquiry(query)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error || 'Bir hata oluştu.')
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <h2 className="text-3xl font-black mb-2">KURBANINI GÖR</h2>
          <p className="text-emerald-100 opacity-90">Küpe numarası, isim veya telefon ile kurbanınızı sorgulayabilirsiniz.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Örn: TR-123456... veya Ad Soyad"
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 outline-none text-lg transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50"
            >
              {isPending ? 'Sorgulanıyor...' : 'Sorgula'}
            </button>
          </form>


          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Görsel Galerisi */}
                <div className="space-y-3">
                  <div className="relative group">
                    {(() => {
                        const images = result.imageUrls && result.imageUrls.length > 0 ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : []);
                        if (images.length > 0) {
                            return (
                                <>
                                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative group/img">
                                    <img src={images[currentImageIndex] || images[0]} alt={result.earTag} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    
                                    {/* Fullscreen Button */}
                                    <button
                                      type="button"
                                      onClick={() => setIsFullscreenOpen(true)}
                                      className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg transition-all border border-white/10 hover:scale-105 z-10"
                                      title="Tam Ekran Göster"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                                      </svg>
                                    </button>
                                    
                                    {images.length > 1 && (
                                        <>
                                            <button 
                                              type="button"
                                              onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg"
                                            >
                                              {'<'}
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg"
                                            >
                                              {'>'}
                                            </button>
                                        </>
                                    )}
                                  </div>
                                  <div className="absolute -top-4 -right-4 bg-amber-400 text-white px-6 py-2 rounded-2xl font-black shadow-lg transform rotate-6 z-10">
                                    HİSSELİ
                                  </div>
                                  
                                  {images.length > 1 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                                      {images.map((url: string, idx: number) => (
                                        <button 
                                          key={idx} 
                                          type="button"
                                          onClick={() => setCurrentImageIndex(idx)}
                                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${currentImageIndex === idx ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                          <img src={url} className="w-full h-full object-cover" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </>
                            )
                        } else {
                            return (
                                <div className="aspect-square bg-slate-50 rounded-3xl flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-200 relative">
                                  <span className="text-8xl mb-4">🐄</span>
                                  <p className="font-bold uppercase tracking-widest text-sm">Görsel Hazırlanıyor</p>
                                  <div className="absolute -top-4 -right-4 bg-amber-400 text-white px-6 py-2 rounded-2xl font-black shadow-lg transform rotate-6 z-10">
                                    HİSSELİ
                                  </div>
                                </div>
                            )
                        }
                    })()}
                  </div>
                </div>

                {/* Bilgiler */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-slate-600 text-xs font-black uppercase tracking-widest mb-1">Hayvan Bilgileri</h3>
                    <div className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{result.earTag}</div>
                    <div className="flex gap-2 mt-2">
                       {result.weight && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">{result.weight} KG</span>}
                       <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold uppercase">{result.groupName || 'GENEL GRUP'}</span>
                    </div>
                  </div>

                  {result.note && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-800 text-sm italic">
                      " {result.note} "
                    </div>
                  )}

                  <div>
                    <h3 className="text-slate-600 text-xs font-black uppercase tracking-widest mb-4">Ortak Hissedarlar</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {result.shareholders.map((sh: any) => (
                        <div key={sh.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-600 text-xs shadow-sm">
                            {sh.shareholderIndex || '👤'}
                          </div>
                          <span className="font-bold text-slate-700">{sh.registration.fullName}</span>
                          {sh.registration.id === result.shareholders.find((s:any) => 
                            s.registration.phone.trim() === query.trim() || 
                            normalizeSearchString(s.registration.fullName) === normalizeSearchString(query)
                          )?.registration?.id && (
                             <span className="ml-auto bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">SİZ</span>
                          )}
                        </div>
                      ))}
                      {/* Placeholder slots to show up to 7 */}
                      {Array.from({ length: 7 - (result.shareholders?.length || 0) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 opacity-50">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-300 text-xs">
                             ?
                          </div>
                          <span className="font-medium text-slate-300 italic text-sm">Diğer Hissedar Bekleniyor...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFullscreenOpen && result && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullscreenOpen(false)}
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={() => setIsFullscreenOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-slate-350 bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all z-10"
            title="Kapat"
          >
            ✕
          </button>

          {/* Fullscreen Image Container */}
          <div 
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const images = result.imageUrls && result.imageUrls.length > 0 ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : []);
              if (images.length > 0) {
                return (
                  <>
                    <img 
                      src={images[currentImageIndex] || images[0]} 
                      alt={result.earTag} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
                    />

                    {images.length > 1 && (
                      <>
                        <button 
                          type="button"
                          onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white hover:scale-105 w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-2xl transition-all border border-white/10"
                        >
                          {'<'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white hover:scale-105 w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-2xl transition-all border border-white/10"
                        >
                          {'>'}
                        </button>
                      </>
                    )}
                  </>
                )
              }
              return null;
            })()}
          </div>
          
          {/* Caption / Navigation Dots */}
          <div className="mt-4 text-white/60 text-sm font-semibold">
            {result.earTag} {result.imageUrls && result.imageUrls.length > 1 && `(${currentImageIndex + 1} / ${result.imageUrls.length})`}
          </div>
        </div>
      )}
    </div>
  )
}
