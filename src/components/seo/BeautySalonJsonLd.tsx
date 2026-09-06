import React from 'react';

/**
 * Componente de Datos Estructurados JSON-LD Schema.org
 * Tipo: BeautySalon & HealthAndBeautyBusiness
 * Optimizado para Google Rich Results, Knowledge Graph y SEO Local en Lima / Jesús María.
 */
export function BeautySalonJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['BeautySalon', 'HairSalon', 'HealthAndBeautyBusiness'],
    '@id': 'https://vercel-sup-b-corp-gonzales.vercel.app/#beautysalon',
    name: 'Gloss Salón and Relax',
    alternateName: [
      'Gloss Salón',
      'Corporación Gonzales - Sede Insignia',
      'Gloss Salón & Relax Jesús María'
    ],
    description:
      'Salón boutique de alta gama con 17 años de maestría en Jesús María, Lima. Especialistas en coloración consciente, balayage, rescate molecular de fibra capilar con Plex, nail spa y cosmiatría facial.',
    url: 'https://vercel-sup-b-corp-gonzales.vercel.app',
    telephone: '+51 1 4219876',
    priceRange: '$$',
    currenciesAccepted: 'PEN, USD',
    paymentAccepted: 'Cash, Credit Card, Yape, Plin, POS Visa, Mastercard',
    image: [
      'https://vercel-sup-b-corp-gonzales.vercel.app/api/branding/icon?size=512'
    ],
    logo: 'https://vercel-sup-b-corp-gonzales.vercel.app/api/branding/icon?size=192',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jr. Mariscal Luzuriaga 275',
      addressLocality: 'Jesús María',
      addressRegion: 'Lima',
      postalCode: '15072',
      addressCountry: 'PE'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -12.0725,
      longitude: -77.0489
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '21:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '18:00'
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Catálogo de Rituales de Belleza & Bienestar',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Balayage Iluminación Signature & Coloración Experta',
            description: 'Diseño de color personalizado con aclaración controlada, matizadores botánicos y blindaje plex.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Nutrición Molecular Profunda en Salón',
            description: 'Tratamiento de rescate de corteza capilar asistido por diagnóstico biométrico Opal AI.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corte de Diseño & Sellado de Puntas',
            description: 'Visagismo capilar personalizado con experiencia zen, degustación de café de especialidad e infusiones.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Spa de Manos & Cosmiatría Holística',
            description: 'Cuidado estético integral con protocolos de relajación y aromaterapia en cabina.'
          }
        }
      ]
    },
    sameAs: [
      'https://www.instagram.com/gloss.salonrelax',
      'https://facebook.com/glosssalonrelax'
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
