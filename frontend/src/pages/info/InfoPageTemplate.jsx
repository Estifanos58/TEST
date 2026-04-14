import { Link } from "react-router-dom";

export function InfoPageTemplate({ title, subtitle, sections }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {section.heading}
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/discover"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition"
          >
            Back to Discover
          </Link>
        </div>
      </section>
    </div>
  );
}
