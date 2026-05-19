'use client';

import { MapPin, Phone, Shield, Zap } from 'lucide-react';

import { useI18n } from '@/lib/i18n';

const features = [
  {
    icon: Phone
  },
  {
    icon: MapPin
  },
  {
    icon: Zap
  },
  {
    icon: Shield
  }
];

export function WhyOmanSaleSection() {
  const { m } = useI18n();

  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-black">{m.home.whyTitle}</h2>
          <p className="text-slate-600">{m.home.whySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const [title, description] = m.home.features[index] ?? ['', ''];

            return (
              <article
                key={title}
                className="rounded-3xl bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100">
                  <Icon className="text-brand-600" size={36} strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 text-xl font-black">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
