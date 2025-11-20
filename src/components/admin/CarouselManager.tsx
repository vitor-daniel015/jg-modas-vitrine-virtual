import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Image, SortAsc } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Define o limite máximo de slides
const MAX_SLIDES = 5;
const BUCKET_NAME = 'hero-carousel-images';

type Slide = Tables<'hero_slides'>;

export default function CarouselManager() {
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero_slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order'); // Ordena para manter a ordem do carrossel
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, altText, nextOrder }: { file: File, altText: string, nextOrder: number }) => {
      if (!file) throw new Error("Nenhum arquivo selecionado.");
      
      // 1. Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_hero.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      // 2. Inserir registro na tabela hero_slides
      const { error: insertError } = await supabase.from('hero_slides').insert({
        image_url: publicUrl,
        alt_text: altText,
        display_order: nextOrder,
      });

      if (insertError) {
        // Se a inserção falhar, tente remover o arquivo do storage
        await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero_slides'] });
      toast.success('Slide adicionado com sucesso!');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao adicionar slide: ' + error.message);
    },
    onSettled: () => {
        setIsUploading(false);
    }
  });

  // NOVO: Mutação para reordenar os slides restantes após a exclusão
  const reorderMutation = useMutation({
    mutationFn: async (slidesToReorder: Slide[]) => {
      // Cria um array de promessas de atualização
      const updates = slidesToReorder.map((slide, index) => {
        const newOrder = index + 1;
        // Atualiza cada slide com a nova ordem sequencial
        return supabase.from('hero_slides').update({ display_order: newOrder }).eq('id', slide.id);
      });

      // Executa todas as atualizações em paralelo
      const results = await Promise.all(updates);

      // Verifica se houve erros em alguma das atualizações
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero_slides'] });
    },
    onError: (error) => {
      toast.error('Erro ao reordenar slides: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (slide: Slide) => {
      const urlParts = slide.image_url.split('/');
      // Pega o nome do arquivo para exclusão no Storage
      const fileName = urlParts[urlParts.length - 1];
      
      // 1. Remover do Storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);
        
      if (storageError) console.error("Erro ao remover do storage:", storageError);

      // 2. Remover da tabela
      const { error: dbError } = await supabase.from('hero_slides').delete().eq('id', slide.id);
      if (dbError) throw dbError;
      
      // 3. Preparar a reordenação: Obtém os slides restantes e os ordena por display_order
      const remainingSlides = (slides || []).filter(s => s.id !== slide.id)
        .sort((a, b) => a.display_order - b.display_order);

      // 4. Executa a reordenação (garantindo que o display_order seja 1, 2, 3...)
      if (remainingSlides.length > 0) {
        await reorderMutation.mutateAsync(remainingSlides);
      }
      
    },
    onSuccess: () => {
      // Invalida a query, mas o reorderMutation.onSuccess já cuidaria disso
      // Manter aqui como fallback, mas a lógica principal está no reorderMutation
      queryClient.invalidateQueries({ queryKey: ['hero_slides'] }); 
      toast.success('Slide excluído e reordenado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir slide: ' + error.message);
    },
  });
  
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (slides && slides.length >= MAX_SLIDES) {
        toast.error(`Limite de ${MAX_SLIDES} imagens atingido. Remova uma para adicionar outra.`);
        return;
    }
    
    setIsUploading(true);
    // Próxima ordem é o número de slides atuais + 1
    const nextOrder = (slides?.length || 0) + 1;
    
    uploadMutation.mutate({ file: imageFile, altText, nextOrder });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setAltText('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const isMaxSlidesReached = (slides?.length || 0) >= MAX_SLIDES;
  const isPending = deleteMutation.isPending || reorderMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Carrossel (Máx: {MAX_SLIDES} slides)</CardTitle>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button disabled={isMaxSlidesReached}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Slide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Slide do Carrossel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Imagem (16:9)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  required
                  disabled={isUploading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="altText">Texto Alternativo (SEO)</Label>
                <Input
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Ex: Coleção Verão JG Modas"
                  disabled={isUploading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isUploading || !imageFile || isMaxSlidesReached}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Salvar Slide'}
              </Button>
            </form>
            {isMaxSlidesReached && (
                <p className="text-sm text-destructive mt-4 text-center">
                    O limite de {MAX_SLIDES} slides foi atingido. Exclua um slide antes de adicionar um novo.
                </p>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading || isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {isPending && <p className="ml-2 text-primary">Reordenando...</p>}
          </div>
        ) : slides && slides.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {slides.map((slide) => (
              <div key={slide.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg text-primary">{slide.display_order}</span>
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm overflow-hidden">
                        <p className="font-semibold truncate w-40 md:w-auto">{slide.alt_text || 'Sem texto alternativo'}</p>
                        <p className="text-xs text-muted-foreground truncate w-40 md:w-auto">{slide.image_url.substring(0, 50)}...</p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => deleteMutation.mutate(slide)}
                    disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">Nenhum slide no carrossel. Adicione o primeiro!</p>
        )}
      </CardContent>
    </Card>
  );
}