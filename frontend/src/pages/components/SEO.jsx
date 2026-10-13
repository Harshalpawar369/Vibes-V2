import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title = "Vibes | E-commerce Website", 
  description = "Hello this is Vibes E-commerce Website, an online store where you can shop for a variety of products. Explore our collection and enjoy a seamless shopping experience.", 
  keywords = ['Vibes', 'E-commerce ', 'Online Shopping', 'Cloths', 'Accessories', 'Dress'],
  author = "Harshal Pawar",
  type = 'website',
  canonical = "https://vibes-ecommerce-website.vercel.app/", 
  name = 'Vibes E-commerce Website', 
  image = 'https://localhost:4173/og-image.jpg' 
}) {
  return (
    <Helmet>
  
      <title>{title}</title>
      <meta name="description" content={description} />
      
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      {canonical && <link rel="canonical" href={canonical} />}


      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={name} />
      {canonical && <meta property="og:url" content={canonical} />}
    </Helmet>
  );
}