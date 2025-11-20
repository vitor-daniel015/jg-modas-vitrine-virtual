import * as React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query"; // Importa useQuery
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Placeholder estático removido

export const CarouselHero = () => {
  // Configuração do Autoplay: toca a cada 5 segundos e interrompe no hover
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // NOVO: Busca dinâmica dos slides
  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero_slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order'); 
      if (error) {
        console.error("Erro ao carregar slides do carrossel:", error);
        return [];
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const slidesToShow = slides || [];

  // Se não houver slides no banco, mostra um placeholder informativo.
  if (slidesToShow.length === 0) {
    return (
        <AspectRatio ratio={16 / 9} className="rounded-lg bg-gray-200 flex items-center justify-center">
            <div className="text-center p-4">
                <h2 className="text-xl font-bold text-gray-700">Carrossel Vazio</h2>
                <p className="text-gray-500">Adicione slides através do Painel Administrativo.</p>
            </div>
        </AspectRatio>
    );
  }


  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-full"
      opts={{
        loop: true,
      }}
    >
      <div className="relative w-full overflow-hidden rounded-lg shadow-xl">
        <CarouselContent>
          {slidesToShow.map((slide) => (
            <CarouselItem key={slide.id}>
              <AspectRatio ratio={16 / 9}>
                <img
                  src={slide.image_url} // Fonte de imagem agora é dinâmica
                  alt={slide.alt_text || 'Imagem de Carrossel JG Modas'} // Alt text dinâmico
                  className="w-full h-full object-cover rounded-lg"
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Adiciona navegação visual, mas o autoplay faz o trabalho pesado */}
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
      </div>
    </Carousel>
  );
};