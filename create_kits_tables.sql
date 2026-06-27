-- Tabela de Kits do Promotor
CREATE TABLE public.promoter_kits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promoter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens do Kit
CREATE TABLE public.promoter_kit_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kit_id UUID NOT NULL REFERENCES public.promoter_kits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (opcional dependendo da configuração atual do DB)
ALTER TABLE public.promoter_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_kit_items ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias liberando tudo (para evitar erros de RLS por enquanto)
CREATE POLICY "Permitir tudo em promoter_kits" ON public.promoter_kits FOR ALL USING (true);
CREATE POLICY "Permitir tudo em promoter_kit_items" ON public.promoter_kit_items FOR ALL USING (true);
