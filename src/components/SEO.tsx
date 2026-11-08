import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: any | any[];
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  path = '/', 
  image = '/img/sulta_hero_banner_real.webp', 
  type = 'website',
  noindex = false,
  jsonLd
}) => {
  const siteUrl = 'https://sulta.vercel.app';
  
  // Format title without duplicating brand name
  let fullTitle = title || 'سولته | بيجامات نسائية وملابس نوم قطنية مريحة';
  if (title && !title.includes('سولته')) {
    fullTitle = `${title} | سولته`;
  }

  function truncateWordBoundary(text: string, maxLen = 154): string {
    if (!text || text.length <= maxLen) return text || '';
    const sub = text.substring(0, maxLen);
    const lastSpace = sub.lastIndexOf(' ');
    return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub).trim();
  }

  const rawDescription = description || 'متجر سولته لأزياء النوم والبيجامات النسائية القطنية المريحة بمقاس وان سايز يناسب من 45 إلى 80 كيلو.';
  const fullDescription = truncateWordBoundary(rawDescription);
  
  // Canonical URL without trailing slash (matching Vercel trailingSlash: false)
  const rawPath = path ? path.split('?')[0].trim().replace(/^\/+/, '').replace(/\/+$/, '') : '';
  const url = rawPath ? `${siteUrl}/${rawPath}` : siteUrl;
  
  // Ensure image URL is absolute and direct (no wsrv.nl)
  const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;

  const shouldNoIndex = noindex || rawPath.includes('track-order') || rawPath.includes('checkout') || rawPath.includes('cart') || rawPath.includes('dashboard') || rawPath.includes('admin') || rawPath === '404';

  return (
    <Helmet>
      {/* Title & Description */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content={absoluteImage.endsWith('.webp') ? 'image/webp' : 'image/jpeg'} />
      <meta property="og:site_name" content="سولته" />
      <meta property="og:locale" content="ar_SA" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Robots */}
      {shouldNoIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        Array.isArray(jsonLd) ? (
          jsonLd.map((schema, idx) => (
            <script key={idx} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )
      )}
    </Helmet>
  );
};

export default SEO;
