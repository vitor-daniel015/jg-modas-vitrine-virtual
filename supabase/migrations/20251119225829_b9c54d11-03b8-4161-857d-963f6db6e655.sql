-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino', 'unissex')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  is_promotion BOOLEAN DEFAULT false,
  promotion_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create store_info table for dynamic content
CREATE TABLE IF NOT EXISTS public.store_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp TEXT NOT NULL,
  instagram_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  about_text TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_info ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public can view store info" ON public.store_info FOR SELECT USING (true);

-- Insert initial data
INSERT INTO public.categories (name, slug, gender) VALUES
  ('Camisetas', 'camisetas', 'masculino'),
  ('Polos', 'polos', 'masculino'),
  ('Camisas', 'camisas', 'masculino'),
  ('Bermudas', 'bermudas', 'masculino'),
  ('Calças', 'calcas', 'masculino'),
  ('Conjuntos', 'conjuntos', 'masculino'),
  ('Feminino', 'feminino', 'feminino');

INSERT INTO public.reviews (customer_name, review_text, rating, is_featured) VALUES
  ('Cliente Satisfeito', 'Peças de ótima qualidade.', 5, true),
  ('Maria Silva', 'Atendimento excelente.', 5, true),
  ('João Santos', 'Sou cliente há anos, recomendo muito.', 5, true);

INSERT INTO public.store_info (whatsapp, hero_title, hero_subtitle, about_text) VALUES
  ('15996164393', 
   'JG MODAS — Tradição desde 1981', 
   'Moda masculina moderna com qualidade, estilo e preço justo',
   'A JG MODAS é tradição desde 1981, trabalhando com moda masculina moderna, qualidade e atendimento próximo, além de uma linha feminina selecionada.');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();