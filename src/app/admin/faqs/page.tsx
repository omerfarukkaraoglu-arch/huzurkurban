import { getFAQs } from '@/app/actions/faq'
import FAQManager from './FAQManager'

export const dynamic = 'force-dynamic'

export default async function FAQPage() {
  const faqs = await getFAQs()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SSS Yönetimi</h1>
          <p className="text-slate-500">Ana sayfadaki sıkça sorulan soruları buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <FAQManager initialFAQs={faqs} />
    </div>
  )
}
