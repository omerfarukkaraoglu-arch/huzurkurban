'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, HeartHandshake, Truck } from 'lucide-react'

export default function HeroSection({ settings }: { settings: any }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  let slides = [
    { id: 1, image: '/slider/slide_1.png' },
    { id: 2, image: '/slider/slide_2.png' },
    { id: 3, image: '/slider/slide_3.png' }
  ]
  try {
    if (settings && settings.sliderImages) {
      const parsed = JSON.parse(settings.sliderImages)
      if (Array.isArray(parsed) && parsed.length > 0) {
        slides = parsed.map((img: string, i: number) => ({ id: i + 1, image: img }))
      }
    }
  } catch(e) {}

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)

  return (
    <section className="relative h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-slate-900">
      
      {/* Background Slider */}
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 z-0'}`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] ease-out transform scale-105"
            style={{ 
              backgroundImage: `url('${slide.image}')`,
              transform: index === currentSlide ? 'scale(1)' : 'scale(1.05)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/50 to-slate-900/40" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white font-medium text-sm mb-6 border border-white/20 shadow-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            2026 Kurban Kayıtlarımız Başladı
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-2xl">
            {settings.heroText || 'Kurbanınız Emin Ellerde'}
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-200 mb-10 leading-relaxed font-light drop-shadow-lg max-w-3xl mx-auto">
            İslami usullere uygun, hijyenik tesislerde, veteriner hekim kontrolünde güvenilir bir kurban ibadeti için Hizmetinizdeyiz. Hissenizi hemen ayırtın, huzurla bayramı yaşayın.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center flex-wrap gap-4 mt-8">
            <a 
              href="#kayit-formu" 
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-emerald-500/30 group"
            >
              <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Hemen Kayıt Ol
            </a>
            <a 
              href="#kayit-formu"
              onClick={() => window.dispatchEvent(new CustomEvent('change-form-mode', { detail: 'bagis' }))}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/30 group"
            >
              <HeartHandshake className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-300" />
              Bağış Hisse
            </a>
            <a 
              href="/teslimat"
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg group"
            >
              <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform text-teal-600" />
              Teslimat Sorgula
            </a>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-4 z-20">
        <button onClick={prevSlide} className="w-12 h-12 rounded-full border border-white/20 bg-black/20 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          {slides.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all rounded-full ${currentSlide === idx ? 'w-8 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/50 hover:bg-white'}`}
            />
          ))}
        </div>
        <button onClick={nextSlide} className="w-12 h-12 rounded-full border border-white/20 bg-black/20 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

    </section>
  )
}
