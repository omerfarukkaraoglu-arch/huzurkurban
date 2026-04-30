'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { updateAnimalStatus, getAnimalsByStatus } from '@/app/actions/animals'

export default function ScanClient({ userStation, stationName }: { userStation: string, stationName: string }) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stationAnimals, setStationAnimals] = useState<any[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [lastScannedTag, setLastScannedTag] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const fetchAnimals = useCallback(async () => {
    const res = await getAnimalsByStatus(userStation)
    if (res.success) {
      setStationAnimals(res.animals || [])
    }
  }, [userStation])

  useEffect(() => {
    fetchAnimals()
    // Refresh list every 30 seconds
    const interval = setInterval(fetchAnimals, 30000)
    return () => clearInterval(interval)
  }, [fetchAnimals])

  useEffect(() => {
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    )

    scanner.render(onScanSuccess, onScanFailure)
    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Scanner cleanup error:", error)
        })
        scannerRef.current = null
      }
    }
  }, [])

  async function onScanSuccess(decodedText: string) {
    if (loading || showOverlay) return
    
    setResult(decodedText)
    setError(null)
    
    let animalId = decodedText
    if (decodedText.includes('id=')) {
      animalId = decodedText.split('id=')[1].split('&')[0]
    } else if (decodedText.startsWith('http')) {
      const parts = decodedText.split('/')
      animalId = parts[parts.length - 1]
    }

    await handleUpdate(animalId)
  }

  function onScanFailure(error: any) {}

  async function handleUpdate(id: string) {
    setLoading(true)
    const nextStatus = userStation
    
    if (!nextStatus) {
        setLoading(false)
        setError("Bu istasyon için durum tanımlanmamış.")
        return
    }

    try {
      const res = await updateAnimalStatus(id, nextStatus)
      if (res.success) {
        setLastScannedTag(res.earTag || id)
        setShowOverlay(true)
        setSuccess(`Kayıt başarıyla '${nextStatus}' durumuna güncellendi.`)
        fetchAnimals()
        
        // Play beep sound if possible
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.2)
        } catch (e) {}

        setTimeout(() => {
          setShowOverlay(false)
          setSuccess(null)
          setResult(null)
        }, 2500)
      } else {
        setError(res.error || "Güncelleme sırasında bir hata oluştu.")
        setTimeout(() => setError(null), 3000)
      }
    } catch (e) {
      setError("Bağlantı hatası oluştu.")
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Success Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md"></div>
           <div className="relative bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-emerald-400">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                ✅
              </div>
              <h2 className="text-3xl font-black text-emerald-700 mb-2 uppercase tracking-tighter">OKUMA BAŞARILI</h2>
              <div className="text-4xl font-black text-slate-900 mb-4">{lastScannedTag}</div>
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm">DURUM: {stationName}</p>
           </div>
        </div>
      )}

      <div className="relative">
        <div 
          id="reader" 
          className="overflow-hidden rounded-2xl border-2 border-slate-200 shadow-inner bg-slate-50 min-h-[300px]"
        ></div>
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-10">
             <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-black text-emerald-800 uppercase tracking-widest text-sm">İşleniyor...</span>
             </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-800 border-2 border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
           <span className="text-2xl">❌</span>
           <div>
              <div className="font-black uppercase text-xs tracking-widest">Hata Oluştu</div>
              <p className="text-sm font-bold">{error}</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
           <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             ŞU AN {stationName} AŞAMASINDAKİLER
           </h3>
           <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black">{stationAnimals.length}</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
           {stationAnimals.length === 0 ? (
             <div className="p-10 text-center text-slate-400 font-medium italic">
                Bu istasyonda bekleyen hayvan bulunmuyor.
             </div>
           ) : (
             stationAnimals.map((animal) => (
               <div key={animal.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-lg">
                        {animal.order || '#'}
                     </div>
                     <div>
                        <div className="font-black text-slate-900 leading-none mb-1">{animal.earTag}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                           {new Date(animal.updatedAt).toLocaleTimeString('tr-TR')} Güncellendi
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-black text-emerald-600">{animal.weight ? `${animal.weight} KG` : '-'}</div>
                     <div className="text-[10px] text-slate-400 font-bold">{animal.groupName || 'Genel Grup'}</div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h4 className="font-black text-slate-900 text-xs mb-3 uppercase tracking-widest">İstasyon Bilgilendirme</h4>
          <ul className="text-xs text-slate-700 space-y-2 font-medium">
              <li className="flex gap-2">
                <span className="text-emerald-500">✔</span>
                Karekodu okuttuğunuzda sistemden "BİP" sesi gelir ve ekranda büyük bir onay kutusu çıkar.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">✔</span>
                İşlem tamamlandığında hayvan yukarıdaki listeye en üstten dahil olur.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">✔</span>
                Hata alırsanız kırmızı uyarı kutusunu takip edin.
              </li>
          </ul>
      </div>
    </div>
  )
}
