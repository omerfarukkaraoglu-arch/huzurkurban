'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { updateAnimalStatus, getAnimalsByStatus } from '@/app/actions/animals'

export default function ScanClient({ userStation, stationName }: { userStation: string, stationName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stationAnimals, setStationAnimals] = useState<any[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [lastScannedTag, setLastScannedTag] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const fetchAnimals = useCallback(async () => {
    const res = await getAnimalsByStatus(userStation)
    if (res.success) {
      setStationAnimals(res.animals || [])
    }
  }, [userStation])

  useEffect(() => {
    fetchAnimals()
    const interval = setInterval(fetchAnimals, 30000)
    return () => clearInterval(interval)
  }, [fetchAnimals])

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return

    try {
      const html5QrCode = new Html5Qrcode("reader")
      scannerRef.current = html5QrCode
      setCameraError(null)

      const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
      }

      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess, 
        () => {} // silent failure for frame-by-frame errors
      )
      setIsScanning(true)
    } catch (err: any) {
      console.error("Camera start error:", err)
      setCameraError("Kamera başlatılamadı. Lütfen izinleri kontrol edin.")
      setIsScanning(false)
      scannerRef.current = null
    }
  }, [userStation])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error("Camera stop error:", err)
      }
    }
  }, [])

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [startScanner, stopScanner])

  async function onScanSuccess(decodedText: string) {
    if (loading || showOverlay) return
    
    let animalId = decodedText
    if (decodedText.includes('id=')) {
      animalId = decodedText.split('id=')[1].split('&')[0]
    } else if (decodedText.startsWith('http')) {
      const parts = decodedText.split('/')
      animalId = parts[parts.length - 1]
    }

    // Success Sound (Beep)
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

    await handleUpdate(animalId)
  }

  async function handleUpdate(id: string) {
    setLoading(true)
    try {
      const res = await updateAnimalStatus(id, userStation)
      if (res.success) {
        setLastScannedTag(res.earTag || id)
        setShowOverlay(true)
        fetchAnimals()
        
        setTimeout(() => {
          setShowOverlay(false)
        }, 2000)
      } else {
        setError(res.error || "Hata oluştu.")
        setTimeout(() => setError(null), 3000)
      }
    } catch (e) {
      setError("Bağlantı hatası.")
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 relative pb-20">
      {/* Success Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md animate-in fade-in duration-300"></div>
           <div className="relative bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-emerald-400 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                ✅
              </div>
              <h2 className="text-2xl font-black text-emerald-700 mb-1 uppercase tracking-tighter">BAŞARILI</h2>
              <div className="text-3xl font-black text-slate-900 mb-2">{lastScannedTag}</div>
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">DURUM GÜNCELLENDİ</p>
           </div>
        </div>
      )}

      {/* Camera Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border-4 border-white aspect-square">
        <div id="reader" className="w-full h-full"></div>
        
        {!isScanning && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/80">
            {cameraError ? (
              <div className="text-white space-y-4">
                <div className="text-4xl">📷</div>
                <p className="text-sm font-bold text-slate-300">{cameraError}</p>
                <button 
                  onClick={() => startScanner()}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Kamerayı Tekrar Dene
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Kamera Hazırlanıyor...</p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
             <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="font-black text-white uppercase tracking-widest text-xs">İŞLENİYOR...</span>
             </div>
          </div>
        )}

        {/* Scan UI Helpers */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500/50 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500/20 animate-pulse"></div>
           </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-600 text-white rounded-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3 shadow-xl">
           <span className="text-2xl">⚠️</span>
           <div className="font-bold text-sm">{error}</div>
        </div>
      )}

      {/* Station List */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
           <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
             BU AŞAMADAKİLER
           </h3>
           <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">{stationAnimals.length}</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
           {stationAnimals.length === 0 ? (
             <div className="p-12 text-center text-slate-400 font-medium italic">
                Bekleyen hayvan bulunmuyor.
             </div>
           ) : (
             stationAnimals.map((animal) => (
               <div key={animal.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl border border-emerald-100">
                        {animal.order || '#'}
                     </div>
                     <div>
                        <div className="font-black text-slate-900 text-lg leading-none mb-1">{animal.earTag}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                           {new Date(animal.createdAt).toLocaleTimeString('tr-TR')} GÜNCELLENDİ
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-base font-black text-emerald-600">{animal.weight ? `${animal.weight} KG` : '-'}</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{animal.groupName || 'GENEL'}</div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  )
}
