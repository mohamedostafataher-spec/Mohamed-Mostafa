import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  path = '', 
  image = 'https://sulta.vercel.app/og-image.jpg', 
  type = 'website' 
}) => {
  const siteUrl = 'https://sulta.vercel.app';
  const siteName = 'سولتة | SULTA Atelier';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const fullDescription = description || 'متجر سولتة للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة.';
  const url = `${siteUrl}${path}`;
  
  // Ensure image URL is absolute for social crawlers
  const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content="SULTA Atelier" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Robots */}
      {path === '/404' && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SEO;
