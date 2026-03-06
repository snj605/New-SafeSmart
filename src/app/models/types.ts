
export interface ProductSpec {
  label: string;
  value: string;
}

export interface ApplicationSector {
  name: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription?: string;
  price: string;
  image: string;
  videoUrl?: string;
  features: string[];
  technicalFeatures?: string[];
  salientSpecs?: string[];
  specifications: ProductSpec[];
  applications?: ApplicationSector[];
  weight?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  icon: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  gallery?: string[];
  slug: string;
  tags?: string[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  productImage?: string;
  cta: string;
  ctaLink: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  icon: string;
}

export interface SiteContent {
  home: {
    hero: {
      slides: HeroSlide[];
    };
    welcome: {
      title: string;
      subtitle: string;
    };
    intro: {
      tagline: string;
      title: string;
      description: string;
      videoUrl: string;
      image: string;
    };
    productsHeader: {
      tagline: string;
      title: string;
    };
    trust: {
      title: string;
      badges: string[];
    };
    whyChooseUs: {
      title: string;
      subtitle: string;
      description: string;
      features: FeatureItem[];
    };
    blogHeader: {
      tagline: string;
      title: string;
    };
    rangeShowcaseImage: string;
    mapImage: string;
  };
  about: {
    heroTitle: string;
    heroSubtitle: string;
    title: string;
    subtitle: string;
    content: string;
    mission: string;
    vision: string;
    image: string;
  };
  contact: {
    email: string;
    phone: string;
    phone2?: string;
    whatsapp: string;
    whatsappMessage?: string;
    address: string;
    mapEmbed: string;
    social: {
      facebook: string;
      instagram: string;
      linkedin: string;
    };
  };
}

export interface AppData {
  products: Product[];
  blogs: BlogPost[];
  categories: Category[];
  content: SiteContent;
}
