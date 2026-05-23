'use client'

import React, { useRef, useState, useEffect } from 'react'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // List all camera devices
  useEffect(() => {
    if (!isOpen) return

    async function getDevices() {
      try {
        setIsLoading(true)
        setErrorMsg('')
        
        // Request initial permission to enumerate devices with labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
        
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
        setDevices(videoDevices)

        // Find environment/back camera if possible, otherwise use the first one
        const backCam = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('arka') ||
          d.label.toLowerCase().includes('environment')
        )
        
        const defaultDeviceId = backCam?.deviceId || videoDevices[0]?.deviceId || ''
        setSelectedDeviceId(defaultDeviceId)

        // Stop initial permission stream
        initialStream.getTracks().forEach(track => track.stop())
        
        // Start streaming with selected/default camera
        if (defaultDeviceId) {
          await startStreaming(defaultDeviceId)
        } else {
          setErrorMsg('Kamera bulunamadı.')
        }
      } catch (err: any) {
        console.error('Kamera erişim hatası:', err)
        setErrorMsg('Kamera erişimine izin verilmedi veya kamera bulunamadı.')
        setIsLoading(false)
      }
    }

    getDevices()

    return () => {
      stopStreaming()
    }
  }, [isOpen])

  const startStreaming = async (deviceId: string) => {
    setIsLoading(true)
    setErrorMsg('')
    stopStreaming()

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsLoading(false)
    } catch (err: any) {
      console.error('Kamera yayını başlatılamadı:', err)
      setErrorMsg('Kamera yayını başlatılamadı. Başka bir kamera seçmeyi deneyin.')
      setIsLoading(false)
    }
  }

  const stopStreaming = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value
    setSelectedDeviceId(deviceId)
    startStreaming(deviceId)
  }

  const handleCapture = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = `kamera-${Date.now()}.jpg`
          const file = new File([blob], fileName, { type: 'image/jpeg' })
          onCapture(file)
          // Flash effect
          if (videoRef.current) {
            videoRef.current.classList.add('opacity-40')
            setTimeout(() => {
              if (videoRef.current) videoRef.current.classList.remove('opacity-40')
            }, 150)
          }
        }
      }, 'image/jpeg', 0.9)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="text-lg font-bold">Kamera ile Fotoğraf Çek</h3>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-2 rounded-full transition-colors text-2xl leading-none w-10 h-10 flex items-center justify-center"
            title="Kapat"
          >
            ×
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative bg-slate-950 flex-1 flex items-center justify-center overflow-hidden min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-300">Kamera yükleniyor...</p>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white bg-slate-900 gap-4">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-bold text-red-400">{errorMsg}</p>
              <button 
                onClick={() => selectedDeviceId && startStreaming(selectedDeviceId)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain max-h-[50vh] transition-opacity duration-150"
          />
        </div>

        {/* Controls */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 shrink-0 space-y-4">
          {/* Camera Selection Dropdown */}
          {devices.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="camera-select" className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Kamera Seç:</label>
              <select
                id="camera-select"
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between items-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-colors"
            >
              Kapat
            </button>
            
            <button
              onClick={handleCapture}
              disabled={isLoading || !!errorMsg}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-base"
            >
              <span>📸</span> Fotoğrafı Çek ve Ekle
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
