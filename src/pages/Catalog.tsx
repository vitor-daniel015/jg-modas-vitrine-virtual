import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";

const Catalog = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name, slug)");
      
      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }
      
      const { data, error } = await query;
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

  const filteredProducts = products?.filter((product) => {
    if (selectedSize === "all") return true;
    return product.sizes?.includes(selectedSize);
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Catálogo</h1>
            <p className="text-muted-foreground">
              Encontre camisetas, polos, camisas, bermudas, calças, conjuntos e nossa linha feminina selecionada.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Todos os tamanhos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tamanhos</SelectItem>
                <SelectItem value="P">P</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="G">G</SelectItem>
                <SelectItem value="GG">GG</SelectItem>
                <SelectItem value="XG">XG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts?.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-secondary relative overflow-hidden" style={{aspectRatio: 9/16}}>
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
                    {product.is_promotion && (
                      <Badge className="absolute top-2 right-2 bg-accent">Promoção</Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description || "Produto de qualidade JG Modas"}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {product.is_promotion && product.promotion_price ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-xl font-bold text-accent">
                            R$ {product.promotion_price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">R$ {product.price.toFixed(2)}</span>
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
          )}

          {filteredProducts?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;
