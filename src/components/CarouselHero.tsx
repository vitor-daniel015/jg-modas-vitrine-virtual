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

// Defina as URLs das imagens. Use placeholders temporários que mantêm o aspecto 16:9.
// Em um projeto real, essas imagens viriam do Supabase Storage.
const SLIDES = [
  {
    id: 1,
    url: "https://placehold.co/1600x900/389250/ffffff?text=Novidades+Masculinas",
    alt: "Novidades Masculinas",
  },
  {
    id: 2,
    url: "https://placehold.co/1600x900/141414/ffffff?text=Linha+Feminina+Selecionada",
    alt: "Linha Feminina Selecionada",
  },
  {
    id: 3,
    url: "https://placehold.co/1600x900/20140A/ffffff?text=Estilo+e+Qualidade",
    alt: "Estilo e Qualidade",
  },
  {
    id: 4,
    url: "https://placehold.co/1600x900/301595/ffffff?text=Roupas+Modernas",
    alt: "Roupas Modernas",
  },
  {
    id: 5,
    url: "https://placehold.co/1600x900/000000/ffffff?text=Melhores+Preços",
    alt: "Melhores Preços",
  },
];

export const CarouselHero = () => {
  // Configuração do Autoplay: toca a cada 5 segundos e interrompe no hover
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

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
          {SLIDES.map((slide) => (
            <CarouselItem key={slide.id}>
              <AspectRatio ratio={16 / 9}>
                <img
                  src={slide.url}
                  alt={slide.alt}
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