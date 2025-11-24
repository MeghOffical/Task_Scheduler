'use client';

import Link from 'next/link';

export default function AuthNavbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-3xl font-bold text-white hover:text-blue-100 transition-colors inline-block"
        >
          Plan-it
        </Link>
        <div className="space-x-4">
          <Link
            href="/faqs"
            className="text-white hover:text-blue-100 transition-colors"
          >
            FAQs
          </Link>
        </div>
      </div>
    </nav>
  );
}
