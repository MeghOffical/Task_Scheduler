import React from "react";

const faqs = [
  {
    question: "What is Planit?",
    answer: "Planit is a productivity and task management platform designed to help you organize your work and achieve your goals efficiently."
  },
  {
    question: "How do I create a new task?",
    answer: "Go to the Tasks page and click on 'Add Task'. Fill in the details and save your task."
  },
  {
    question: "Can I use Planit on mobile devices?",
    answer: "Yes, Planit is fully responsive and works on all modern mobile browsers."
  },
  {
    question: "Is my data secure?",
    answer: "We use industry-standard security practices to keep your data safe and private."
  }
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">{faq.question}</h2>
            <p className="text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
