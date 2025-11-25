import { useState } from 'react';
// Removido createPortal pois usaremos o Dialog do próprio componente
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';

export default function ProductsManager() {
  // Modal principal (Formulário de Produto)
  const [open, setOpen] = useState(false);
  
  // Modal secundário (Crop) - Controlado separadamente
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    promotion_price: '',
    stock: '',
    category_id: '',
    is_promotion: false,
    sizes: [] as string[],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // Estados do Cropper
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const queryClient = useQueryClient();

  // --- Queries (Mantidas iguais) ---
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    },
  });

  // --- Upload Logic ---
  const uploadImages = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  };

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const imageUrls = imageFiles.length > 0 ? await uploadImages(imageFiles) : [];
      const { error } = await supabase.from('products').insert({
        ...data,
        images: imageUrls,
        price: parseFloat(data.price),
        promotion_price: data.promotion_price ? parseFloat(data.promotion_price) : null,
        stock: parseInt(data.stock),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      let imageUrls = data.images || [];
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages(imageFiles);
        imageUrls = [...(data.existing_images || []), ...newUrls];
      }
      const { error } = await supabase.from('products').update({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        promotion_price: data.promotion_price ? parseFloat(data.promotion_price) : null,
        stock: parseInt(data.stock),
        category_id: data.category_id,
        is_promotion: data.is_promotion,
        sizes: data.sizes,
        images: imageUrls, 
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    },
  });

  // --- Helpers ---
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      promotion_price: '',
      stock: '',
      category_id: '',
      is_promotion: false,
      sizes: [],
    });
    setImageFiles([]);
    setEditingId(null);
    setCropImageSrc(null);
    setCropModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      promotion_price: product.promotion_price?.toString() || '',
      stock: product.stock?.toString() || '',
      category_id: product.category_id || '',
      is_promotion: product.is_promotion || false,
      sizes: product.sizes || [],
    });
    setImageFiles([]);
    setOpen(true);
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  // --- Crop Logic ---

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCropModalOpen(true); // Abre o segundo Dialog
    };
    reader.readAsDataURL(files[0]);
    e.target.value = '';
  };

  const finishCrop = async () => {
    try {
      if (!cropImageSrc || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File(
        [croppedBlob], 
        `crop-${Date.now()}.jpg`, 
        { type: 'image/jpeg' }
      );
      setImageFiles((prev) => [...prev, croppedFile]);
      
      // Fecha apenas o modal de crop
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
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Produtos</CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Novo'} Produto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="promotion_price">Preço Promocional (R$)</Label>
                    <Input
                      id="promotion_price"
                      type="number"
                      step="0.01"
                      value={formData.promotion_price}
                      onChange={(e) => setFormData({ ...formData, promotion_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tamanhos Disponíveis</Label>
                  <div className="flex flex-wrap gap-2">
                    {['PP', 'P', 'M', 'G', 'GG', 'XG'].map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={formData.sizes.includes(size) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSizeToggle(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Adicionar Imagem</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelection}
                  />
                  
                  {imageFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden h-24">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_promotion"
                    checked={formData.is_promotion}
                    onChange={(e) => setFormData({ ...formData, is_promotion: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_promotion">Produto em Promoção</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingId ? 'Atualizar' : 'Criar'} Produto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        {/* Tabela de Produtos */}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.categories?.name}</TableCell>
                  <TableCell>R$ {product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- DIALOG SECUNDÁRIO PARA O CROP --- */}
      {/* Isso substitui o createPortal manual. O Dialog do shadcn cuida do foco e overlay */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[500px] z-[9999]">
          <DialogHeader>
            <DialogTitle>Cortar Imagem (9:16)</DialogTitle>
          </DialogHeader>
          
          {/* Área de Corte */}
          {cropImageSrc && (
            <div className="relative w-full h-[400px] bg-gray-100 rounded-md overflow-hidden my-4">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={9 / 16}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}

          {/* Controles */}
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