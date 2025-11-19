import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const OurStyle = () => {
  const { data: storeInfo } = useQuery({
    queryKey: ["storeInfo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_info").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Nosso Estilo</h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {storeInfo?.about_text || 
                  "A JG MODAS é tradição desde 1981, trabalhando com moda masculina moderna, qualidade e atendimento próximo, além de uma linha feminina selecionada."}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-accent mb-2">1981</div>
                  <h3 className="font-semibold mb-2">Início da Tradição</h3>
                  <p className="text-sm text-muted-foreground">
                    Fundada com o propósito de oferecer moda masculina de qualidade
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-accent mb-2">40+</div>
                  <h3 className="font-semibold mb-2">Anos de Experiência</h3>
                  <p className="text-sm text-muted-foreground">
                    Mais de quatro décadas servindo nossos clientes com excelência
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-accent mb-2">100%</div>
                  <h3 className="font-semibold mb-2">Qualidade Garantida</h3>
                  <p className="text-sm text-muted-foreground">
                    Compromisso com produtos de alta qualidade e durabilidade
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Values */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Nossos Valores</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Qualidade em Primeiro Lugar</h3>
                  <p className="text-muted-foreground">
                    Selecionamos cuidadosamente cada peça para garantir que nossos clientes tenham acesso apenas aos melhores produtos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Atendimento Personalizado</h3>
                  <p className="text-muted-foreground">
                    Nossa equipe está sempre pronta para ajudar você a encontrar a peça perfeita, com atenção e dedicação.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Estilo e Modernidade</h3>
                  <p className="text-muted-foreground">
                    Acompanhamos as tendências da moda masculina, oferecendo peças modernas sem perder a elegância clássica.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Preço Justo</h3>
                  <p className="text-muted-foreground">
                    Acreditamos que moda de qualidade deve ser acessível. Oferecemos o melhor custo-benefício da região.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Reviews */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">O Que Nossos Clientes Dizem</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews?.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: review.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm mb-4 italic">"{review.review_text}"</p>
                    <p className="text-sm font-semibold">— {review.customer_name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OurStyle;
