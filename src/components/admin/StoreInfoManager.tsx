import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function StoreInfoManager() {
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    about_text: '',
    whatsapp: '',
    instagram_url: '',
  });
  const queryClient = useQueryClient();

  const { data: storeInfo } = useQuery({
    queryKey: ['store-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_info')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (storeInfo) {
      setFormData({
        hero_title: storeInfo.hero_title || '',
        hero_subtitle: storeInfo.hero_subtitle || '',
        about_text: storeInfo.about_text || '',
        whatsapp: storeInfo.whatsapp || '',
        instagram_url: storeInfo.instagram_url || '',
      });
    }
  }, [storeInfo]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (storeInfo?.id) {
        const { error } = await supabase
          .from('store_info')
          .update(data)
          .eq('id', storeInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_info').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-info'] });
      toast.success('Informações atualizadas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Loja</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero_title">Título Principal</Label>
            <Input
              id="hero_title"
              value={formData.hero_title}
              onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              placeholder="JG MODAS"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_subtitle">Subtítulo</Label>
            <Textarea
              id="hero_subtitle"
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              placeholder="Tradição desde 1981..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about_text">Sobre a Loja</Label>
            <Textarea
              id="about_text"
              value={formData.about_text}
              onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
              placeholder="Nossa história..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (apenas números)</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="15996164393"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_url">URL do Instagram</Label>
            <Input
              id="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/jgmodas"
            />
          </div>

          <Button type="submit" className="w-full">
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
