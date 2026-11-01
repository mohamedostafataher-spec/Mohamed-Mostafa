import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  path = '/', 
  image = '/img/tulip-crinkle-cotton-pajama.webp', 
  type = 'website',
  noindex = false
}) => {
  const siteUrl = 'https://sulta.vercel.app';
  
  // Format title without duplicating brand name
  let fullTitle = title || 'سولتة | بيجامات نسائية وملابس نوم قطنية مريحة';
  if (title && !title.includes('سولتة')) {
    fullTitle = `${title} | سولتة`;
  }

  function truncateWordBoundary(text: string, maxLen = 154): string {
    if (!text || text.length <= maxLen) return text || '';
    const sub = text.substring(0, maxLen);
    const lastSpace = sub.lastIndexOf(' ');
    return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub).trim();
  }

  const rawDescription = description || 'متجر سولتة لأزياء النوم والبيجامات النسائية القطنية المريحة بمقاس وان سايز يناسب من 45 إلى 80 كيلو.';
  const fullDescription = truncateWordBoundary(rawDescription);
  
  // Trailing slash canonical
  const cleanPath = path ? (path.split('?')[0].replace(/\/+$/, '') + '/') : '/';
  const url = `${siteUrl}${cleanPath}`;
  
  // Ensure image URL is absolute and direct (no wsrv.nl)
  const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;

  const shouldNoIndex = noindex || cleanPath.includes('/track-order/') || cleanPath.includes('/checkout/') || cleanPath.includes('/cart/') || cleanPath === '/404/';

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
      <meta property="og:site_name" content="سولتة | SULTA" />
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
    </Helmet>
  );
};

export default SEO;
