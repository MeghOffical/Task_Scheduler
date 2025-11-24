import fs from 'fs'
import path from 'path'
import React from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

type FAQ = { question: string; answer: string }

// Load JSON at build / request time (server component)
const faqsPath = path.join(process.cwd(), 'src', 'app', 'faqs', 'faqs.json')
let faqs: FAQ[] = []
try {
  const raw = fs.readFileSync(faqsPath, 'utf8')
  faqs = JSON.parse(raw)
} catch (e) {
  // keep empty and the page will render a helpful message
}

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-6">Answers to common questions about Planit.</p>

      <section className="space-y-4">
        {faqs.length === 0 ? (
          <div className="p-4 border rounded text-sm text-gray-600">No FAQs found. Add entries to <code>src/app/faqs/faqs.json</code>.</div>
        ) : (
          faqs.map((f, i) => (
            <details key={i} className="p-4 border rounded">
              <summary className="cursor-pointer font-medium">{f.question}</summary>
              <div className="mt-2 text-sm">
                <MarkdownRenderer content={f.answer} />
              </div>
            </details>
          ))
        )}
      </section>

      <section className="mt-8 text-sm text-gray-600">
        <p>
          Still have questions? Reach out via the <strong>Help</strong> or
          <strong> Contact</strong> page (if available) or open an issue in the
          project repository.
        </p>
      </section>
    </main>
  )
}
