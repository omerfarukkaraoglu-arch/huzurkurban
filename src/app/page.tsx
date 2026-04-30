import { prisma } from '@/lib/prisma'
import RegistrationForm from '@/components/RegistrationForm'
import AnimalInquiry from '@/components/AnimalInquiry'
import HeroSection from '@/components/HeroSection'
import Navbar from '@/components/Navbar'
import WhatsAppButton from '@/components/WhatsAppButton'
import { ShieldCheck, Scale, Beef, HeartHandshake } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const s = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  const defaultMenu = JSON.stringify([
    { id: 'anasayfa', title: 'Ana Sayfa', icon: 'Home', target: 'external', url: '/', color: 'hover:bg-slate-100 text-slate-800' },
    { id: 'kayit', title: 'Hisse Kaydı', icon: 'Tractor', target: '#kayit-formu', color: 'hover:bg-emerald-50 text-emerald-700' },
    { id: 'bagis', title: 'Bağış Hisse', icon: 'HeartHandshake', target: '#kayit-formu', color: 'hover:bg-amber-50 text-amber-700' },
    { id: 'sorgula', title: 'Kurbanını Gör', icon: 'ScanSearch', target: '#kurbanini-gor', color: 'hover:bg-blue-50 text-blue-700' },
    { id: 'teslimat', title: 'Teslimat Sorgula', icon: 'Truck', target: 'external', url: '/teslimat', color: 'hover:bg-teal-50 text-teal-700' },
    { id: 'randevu', title: 'Randevu Al', icon: 'CalendarCheck', target: 'modal', color: 'hover:bg-purple-50 text-purple-700' },
    { id: 'whatsapp', title: 'WhatsApp İletişim', icon: 'MessageCircle', target: 'external', url: 'https://wa.me/905513431888?text=Merhaba%2C%20kurban%20ile%20alakalı%20bilgi%20almak%20istiyorum.', color: 'hover:bg-[#25D366]/10 text-[#25D366]' },
    { id: 'sss', title: 'Sıkça Sorulan Sorular', icon: 'HelpCircle', target: '#sss', color: 'hover:bg-slate-50 text-slate-700' },
    { id: 'iletisim', title: 'İletişim', icon: 'Phone', target: '#footer', color: 'hover:bg-rose-50 text-rose-700' }
  ])

  const settings = s || {
    siteTitle: 'Huzur Kurban', 
    heroText: 'Kurbanınız Emin Ellerde', 
    phone: '0551 343 18 88', 
    whatsapp: '0551 343 18 88',
    menuConfig: defaultMenu
  } as any
  
  const groups = await prisma.kurbanGroup.findMany({ orderBy: { price: 'asc' } })
  const standardGroups = groups.filter(g => !g.isDonation)
  const donationGroups = groups.filter(g => g.isDonation)

  const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } })

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar settings={settings} />
 
       {/* Hero Section */}
       <HeroSection settings={settings} />

      {/* Features Section */}
      <section id="nasil-calisir" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{settings.featuresTitle || 'Neden Huzur Kurban?'}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{settings.featuresSub || 'İbadetinizi en doğru, şeffaf ve güvenilir şekilde yerine getirmeniz için tüm süreci titizlikle yönetiyoruz.'}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">{settings.f1Title || 'Güvenli ve Şeffaf'}</h3>
              <p className="text-slate-600 leading-relaxed">{settings.f1Text || 'Kurbanlıklarımız veteriner hekim kontrolünde seçilir. Tüm süreçte sizinle şeffaf bir iletişim kurulur.'}</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">{settings.f2Title || 'İslami Usul Kesim'}</h3>
              <p className="text-slate-600 leading-relaxed">{settings.f2Text || 'Tekbirlerle, İslami kaidelere tam riayet edilerek, işin ehli kasaplarımız tarafından kesim yapılır.'}</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Beef className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">{settings.f3Title || 'Eşit Paylama & Teslim'}</h3>
              <p className="text-slate-600 leading-relaxed">{settings.f3Text || 'Etleriniz hassas terazilerde eşit olarak pay edilir, özel ambalajlarında ilk gün teslim edilir.'}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Inquiry Section */}
      <section id="kurbanini-gor" className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <AnimalInquiry />
        </div>
      </section>

      {/* Pricing / Categories */}
      <section id="kurbanliklar" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Kurban Seçenekleri</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Her bütçeye uygun olarak belirlenmiş, özenle seçilmiş kurban gruplarımız.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {standardGroups.length > 0 ? standardGroups.map((group, i) => (
              <div key={group.id} className={`bg-white rounded-3xl p-8 shadow-sm border relative overflow-hidden transition-colors ${group.isActive ? 'border-slate-200 group hover:border-emerald-500' : 'border-red-200 opacity-75'}`}>
                {!group.isActive ? (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">DOLDU</div>
                ) : i === 0 ? (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Çok Tercih Edilen</div>
                ) : null}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{group.name}</h3>
                <div className={`text-4xl font-extrabold mb-6 border-b border-slate-100 pb-6 ${group.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {group.price} <span className="text-lg text-slate-500 font-normal">TL / Hisse</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-slate-600">
                    <span className="text-emerald-500 mr-3">✓</span> İslami Usullere Uygun
                  </li>
                  <li className="flex items-center text-slate-600">
                    <span className="text-emerald-500 mr-3">✓</span> Eşit Paylı Hisse
                  </li>
                  <li className="flex items-center text-slate-600">
                    <span className="text-emerald-500 mr-3">✓</span> Adrese Teslim veya Kuruma Bağış
                  </li>
                </ul>
                {group.isActive ? (
                  <a href="#kayit-formu" className="block w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-center rounded-xl font-semibold transition-colors">
                    Seç ve Kayıt Ol
                  </a>
                ) : (
                  <div className="block w-full py-3 px-4 bg-red-50 text-red-400 text-center rounded-xl font-semibold cursor-not-allowed">
                    Kayıtlar Kapandı
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-3xl">
                Henüz kurban grubu eklenmedi.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration Form Mount Area */}
      <section id="kayit-formu" className="relative pb-24 bg-slate-50 pt-10 px-4 sm:px-6 lg:px-8">
        <RegistrationForm settings={settings} groups={groups} />
      </section>

      {/* FAQ Section */}
      <section id="sss" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-slate-600">Aklınıza takılan soruların cevapları</p>
          </div>
          <div className="space-y-6">
            {faqs.length > 0 ? faqs.map((faq: any) => (
              <div key={faq.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-lg text-slate-900 mb-2">{faq.question}</h4>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500 italic">
                Sıkça sorulan sorular henüz eklenmedi.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer / CTA padding */}
      <div className="py-20 bg-slate-800 text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">{settings.aboutTitle || 'İbadetinizi Birlikte Edelim'}</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">{settings.aboutText || 'Talebelerimiz ve muhtaçlar için "Bağış Hisse" seçeneğimiz bulunmaktadır. Hizmetimiz 20 yıldır kaliteden ödün vermeden sürmektedir.'}</p>
          
          {donationGroups.length > 0 && (
            <div className="mb-12 flex justify-center flex-wrap gap-4">
              {donationGroups.map(group => (
                <a key={group.id} href="#kayit-formu" className="inline-flex items-center gap-2 bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                  <HeartHandshake className="w-5 h-5" /> {group.name} - {group.price} TL
                </a>
              ))}
            </div>
          )}

          <div className="text-lg font-medium text-emerald-400">
            İletişim: {settings.phone} <span className="text-slate-500 mx-3">|</span> {settings.address || 'İstanbul, Türkiye'} 
          </div>
        </div>
      </div>
      <WhatsAppButton phone={settings.whatsapp || settings.phone} />
    </div>
  )
}

