'use client'

import { useEffect, useState, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { updateAnimalStatus } from '@/app/actions/animals'

export default function ScanClient({ userStation, stationName }: { userStation: string, stationName: string }) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Prevent multiple initializations
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
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
    if (loading) return
    
    // Stop scanning temporarily
    // scannerRef.current?.pause()
    
    setResult(decodedText)
    setError(null)
    setSuccess(null)
    
    // Extract ID from URL if it's a URL, otherwise use as is
    let animalId = decodedText
    if (decodedText.includes('id=')) {
      animalId = decodedText.split('id=')[1].split('&')[0]
    } else if (decodedText.startsWith('http')) {
      // Might be a clean URL format if I changed it later
      const parts = decodedText.split('/')
      animalId = parts[parts.length - 1]
    }

    await handleUpdate(animalId)
  }

  function onScanFailure(error: any) {
    // console.warn(`Scan error: ${error}`);
  }

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
        setSuccess(`${id} ID'li kayıt başarıyla '${nextStatus}' durumuna güncellendi.`)
        // Play success sound if desired
      } else {
        setError(res.error || "Güncelleme sırasında bir hata oluştu.")
      }
    } catch (e) {
      setError("Bağlantı hatası oluştu.")
    } finally {
      setLoading(false)
      // Resume scanning after 3 seconds
      setTimeout(() => {
        setResult(null)
        setSuccess(null)
        setError(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div 
        id="reader" 
        className="overflow-hidden rounded-2xl border-2 border-slate-200 shadow-inner bg-slate-50 min-h-[300px]"
      ></div>
      
      {loading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl animate-pulse font-bold">
           ⌛ İşleniyor...
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-top-2">
           <div className="font-bold flex items-center gap-2">✅ Başarılı!</div>
           <p className="text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
           <div className="font-bold flex items-center gap-2">❌ Hata!</div>
           <p className="text-sm">{error}</p>
        </div>
      )}

      {result && !loading && !success && !error && (
        <div className="p-4 bg-slate-100 text-slate-700 rounded-xl">
           <div className="text-xs uppercase font-bold text-slate-400">Okunan Veri</div>
           <div className="font-mono break-all">{result}</div>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-900 text-sm mb-2">Nasıl Kullanılır?</h4>
          <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
              <li>Cihazınızın kamerasına erişim izni verin.</li>
              <li>Karekodu karenin içine ortalayın.</li>
              <li>Okuma yapıldığında sistem otomatik olarak ilgili istasyonun durumuna güncelleyecektir.</li>
              <li>İşlem tamamlandığında 3 saniye içinde tekrar taramaya hazır hale gelecektir.</li>
          </ul>
      </div>
    </div>
  )
}
