import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Image, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage'; // Certifique-se de que este arquivo existe

// Define o limite máximo de slides
const MAX_SLIDES = 5;
const BUCKET_NAME = 'hero-carousel-images';

type Slide = Tables<'hero_slides'>;

export default function CarouselManager() {
  // Modal Principal (Adicionar Slide)
  const [open, setOpen] = useState(false);
  
  // Modal Secundário (Corte)
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados do Cropper
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero_slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, altText, nextOrder }: { file: File, altText: string, nextOrder: number }) => {
      if (!file) throw new Error("Nenhum arquivo selecionado.");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_hero.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('hero_slides').insert({
        image_url: publicUrl,
        alt_text: altText,
        display_order: nextOrder,
      });

      if (insertError) {
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

  const reorderMutation = useMutation({
    mutationFn: async (slidesToReorder: Slide[]) => {
      const updates = slidesToReorder.map((slide, index) => {
        const newOrder = index + 1;
        return supabase.from('hero_slides').update({ display_order: newOrder }).eq('id', slide.id);
      });
      const results = await Promise.all(updates);
      for (const result of results) {
        if (result.error) throw result.error;
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
      const fileName = urlParts[urlParts.length - 1];
      
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);
        
      if (storageError) console.error("Erro ao remover do storage:", storageError);

      const { error: dbError } = await supabase.from('hero_slides').delete().eq('id', slide.id);
      if (dbError) throw dbError;
      
      const remainingSlides = (slides || []).filter(s => s.id !== slide.id)
        .sort((a, b) => a.display_order - b.display_order);

      if (remainingSlides.length > 0) {
        await reorderMutation.mutateAsync(remainingSlides);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero_slides'] }); 
      toast.success('Slide excluído e reordenado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir slide: ' + error.message);
    },
  });
  
  // --- Lógica de Upload e Submit ---

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Selecione e corte uma imagem.');
      return;
    }
    if (slides && slides.length >= MAX_SLIDES) {
        toast.error(`Limite de ${MAX_SLIDES} imagens atingido.`);
        return;
    }
    
    setIsUploading(true);
    const nextOrder = (slides?.length || 0) + 1;
    
    uploadMutation.mutate({ file: imageFile, altText, nextOrder });
  };
  
  // --- Lógica de Corte (Crop) ---

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setCropModalOpen(true); // Abre o modal de corte
        };
        reader.readAsDataURL(files[0]);
        e.target.value = ''; // Reseta input para permitir selecionar o mesmo arquivo se necessário
    }
  };

  const finishCrop = async () => {
    try {
      if (!cropImageSrc || !croppedAreaPixels) return;

      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File(
        [croppedBlob], 
        `hero-${Date.now()}.jpg`, 
        { type: 'image/jpeg' }
      );

      setImageFile(croppedFile);
      
      // Limpa estados do crop
      setCropModalOpen(false);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao cortar imagem");
    }
  };

  const cancelCrop = () => {
      setCropModalOpen(false);
      setCropImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setImageFile(null);
    setAltText('');
    setCropImageSrc(null);
    setCropModalOpen(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const isMaxSlidesReached = (slides?.length || 0) >= MAX_SLIDES;
  const isPending = deleteMutation.isPending || reorderMutation.isPending;

  return (
    <>
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Slide do Carrossel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                
                {/* Área de Seleção de Imagem */}
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem (16:9)</Label>
                  
                  {!imageFile ? (
                    <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={isUploading}
                    />
                  ) : (
                    // Preview da Imagem Cortada
                    <div className="relative w-full rounded-lg border overflow-hidden aspect-video group">
                        <img 
                            src={URL.createObjectURL(imageFile)} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setImageFile(null)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Trocar Imagem
                            </Button>
                        </div>
                    </div>
                  )}
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
                  {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Salvar Slide'}
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
              {isPending && <p className="ml-2 text-primary">Processando...</p>}
            </div>
          ) : slides && slides.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {slides.map((slide) => (
                <div key={slide.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-4">
                      <span className="font-bold text-lg text-primary">{slide.display_order}</span>
                      <div className="h-10 w-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={slide.image_url} alt={slide.alt_text} className="h-full w-full object-cover" />
                      </div>
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

      {/* --- DIALOG SECUNDÁRIO PARA CROP (16:9) --- */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[500px] z-[9999]">
            <DialogHeader>
                <DialogTitle>Cortar Slide (16:9)</DialogTitle>
            </DialogHeader>

            {cropImageSrc && (
                <div className="relative w-full h-[300px] bg-gray-100 rounded-md overflow-hidden my-4">
                    <Cropper
                        image={cropImageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 9} // Aspecto forçado para Carrossel
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between gap-2">
                <Button variant="outline" onClick={cancelCrop}>
                    Cancelar
                </Button>
                <Button onClick={finishCrop}>
                    Confirmar Corte
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}