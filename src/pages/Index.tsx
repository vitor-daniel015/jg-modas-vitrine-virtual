import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ShoppingBag, Award, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { data: storeInfo } = useQuery({
    queryKey: ["storeInfo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_info").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {storeInfo?.hero_title || "JG MODAS — Tradição desde 1981"}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              {storeInfo?.hero_subtitle || "Moda masculina moderna com qualidade, estilo e preço justo"}
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
              Encontre camisetas, polos, camisas, bermudas, calças, conjuntos e nossa linha feminina selecionada. 
              Este site funciona como vitrine: escolha suas peças favoritas e reserve pelo WhatsApp para garantir na loja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/catalogo">
                <Button size="lg" className="text-lg px-8">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Ver Catálogo
                </Button>
              </Link>
              <Link to="/promocoes">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Star className="mr-2 h-5 w-5" />
                  Promoções
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Qualidade que você veste</h3>
                <p className="text-sm text-muted-foreground">
                  Peças selecionadas com os melhores tecidos e acabamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Tradição que você confia</h3>
                <p className="text-sm text-muted-foreground">
                  Mais de 40 anos servindo com excelência
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Variedade e estilo</h3>
                <p className="text-sm text-muted-foreground">
                  Opções para todos os gostos e ocasiões
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-secondary relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-lg font-bold">R$ {product.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/catalogo">
                <Button size="lg" variant="outline">
                  Ver Todos os Produtos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Visite Nossa Loja</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Encontre a peça perfeita para o seu estilo. Reserve pelo WhatsApp e garanta já!
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => {
              const whatsapp = storeInfo?.whatsapp || "15996164393";
              window.open(`https://wa.me/55${whatsapp}`, "_blank");
            }}
          >
            Falar no WhatsApp
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
