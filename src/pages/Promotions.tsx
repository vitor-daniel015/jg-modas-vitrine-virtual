import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";

const Promotions = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_promotion", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: storeInfo } = useQuery({
    queryKey: ["storeInfo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_info").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const handleReserve = (productName: string) => {
    const message = `Olá! Quero reservar a peça ${productName} que vi no site da JG Modas.`;
    const whatsapp = storeInfo?.whatsapp || "15996164393";
    window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
              <h1 className="text-4xl font-bold">Promoções</h1>
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aproveite nossas ofertas especiais com descontos imperdíveis!
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-accent/20">
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
                    <Badge className="absolute top-2 right-2 bg-accent">
                      {product.promotion_price != null && product.price != null && product.price !== 0 ?
                        `-${Math.round((1 - product.promotion_price / product.price) * 100)}%`
                        : 'Promoção'}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description || "Produto de qualidade JG Modas"}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {product.price != null && product.promotion_price != null ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                          <span className="text-xl font-bold text-accent">
                            R$ {Number(product.promotion_price).toFixed(2)}
                          </span>
                        </>
                      ) : product.price != null ? (
                        <span className="text-xl font-bold">R$ {Number(product.price).toFixed(2)}</span>
                      ) : product.promotion_price != null ? (
                        <span className="text-xl font-bold">R$ {Number(product.promotion_price).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Preço sob consulta</span>
                      )}
                    </div>

                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {product.sizes.map((size) => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full"
                      onClick={() => handleReserve(product.name)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Reservar pelo WhatsApp
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                Não há promoções disponíveis no momento. Volte em breve!
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;
