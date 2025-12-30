import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Instagram, Search, Image as ImageIcon, Eye, Heart, MessageCircle, FileText, Sparkles, Maximize2, ZoomIn, ZoomOut, Video, Mic } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function InstagramImporter({ onImport, postTypeFormat }) {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [postData, setPostData] = useState(null);
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [manualOverlayText, setManualOverlayText] = useState('');
  const [videoTranscription, setVideoTranscription] = useState('');
  const [viewImage, setViewImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);

  const { data: postTypeConfig } = useQueryClient().getQueryData(['postTypeConfig']) ? { data: useQueryClient().getQueryData(['postTypeConfig']) } : useQuery({
    queryKey: ['postTypeConfig'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const configs = await base44.entities.PostTypeConfig.filter({ created_by: user.email });
      return configs[0] || null;
    }
  });

  const handleFetchPost = async () => {
    if (!instagramUrl.trim()) {
      toast.error('Cole a URL do post do Instagram');
      return;
    }

    setIsLoading(true);
    setPostData(null);
    setExtractedTexts([]);

    try {
      const response = await base44.functions.invoke('instagramScraper', {
        action: 'getPostDetails',
        url: instagramUrl
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      setPostData(response.data);
      toast.success('Dados do post carregados!');
    } catch (error) {
      toast.error('Erro ao buscar dados do Instagram');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractText = async () => {
    if (!postData?.images?.length) {
      toast.error('Nenhuma imagem disponível para OCR');
      return;
    }

    setIsExtractingText(true);

    try {
      // Use Cloudinary URLs (already uploaded when fetching post)
      const imageUrls = postData.images
        .map(img => img.cloudinary_url || img.url)
        .filter(Boolean);

      if (imageUrls.length === 0) {
        toast.error('Nenhuma imagem disponível');
        return;
      }

      // Extract text using Gemini vision
      const response = await base44.functions.invoke('instagramScraper', {
        action: 'extractTextFromImages',
        imageUrls
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      const texts = response.data.extractedTexts || [];
      setExtractedTexts(texts);
      
      // Auto-fill manual text with OCR result if empty or append
      const combinedText = texts
        .map(t => t.text)
        .filter(t => t && t !== 'SEM TEXTO')
        .join('\n\n');
      
      if (combinedText) {
        setManualOverlayText(prev => prev ? `${prev}\n\n${combinedText}` : combinedText);
      }

      toast.success('Texto extraído das imagens!');
    } catch (error) {
      toast.error('Erro ao extrair texto das imagens');
      console.error(error);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleTranscribeVideo = async () => {
    if (!postData?.raw?.video_versions?.length) {
      toast.error('Nenhum vídeo disponível para transcrição');
      return;
    }

    setIsTranscribing(true);

    try {
      // Get best quality video URL
      const videoUrl = postData.raw.video_versions[0]?.url;
      
      if (!videoUrl) {
        toast.error('URL do vídeo não encontrada');
        return;
      }

      const response = await base44.functions.invoke('instagramScraper', {
        action: 'transcribeVideo',
        videoUrl
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      const transcription = response.data.transcription || '';
      setVideoTranscription(transcription);
      toast.success('Vídeo transcrito com sucesso!');
    } catch (error) {
      toast.error('Erro ao transcrever vídeo');
      console.error(error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImport = () => {
    if (!postData) return;

    if (postTypeFormat === 'Reels') {
        const metrics = postData.raw?.metrics || {};
        const shares = metrics.share_count || postData.raw?.share_count || 0;
        const plays = postData.views;
        const imageUrl = postData.images?.[0]?.cloudinary_url || postData.images?.[0]?.url || '';

        // Use manual text if available, otherwise fallback to OCR extracted list (though manual should be populated by OCR)
        const contentText = manualOverlayText || extractedTexts
            .map(t => t.text)
            .filter(t => t && t !== 'SEM TEXTO')
            .join('\n');

        const formattedContent = `CONTEÚDO (Texto sobre a imagem):
${contentText || '(Sem texto extraído/informado)'}

---

TRANSCRIÇÃO DO VÍDEO:
${videoTranscription || '(Sem transcrição)'}

---

DESCRIÇÃO:
${postData.caption || '(Sem legenda)'}

---

MÉTRICAS:
Likes: ${postData.likes}
Plays: ${plays}
Shares: ${shares}

AUTOR:
Nome: ${postData.user_full_name}
User: @${postData.username}

URL DA IMAGEM (First Frame):
${imageUrl}`;

        onImport({
            content: formattedContent,
            comment: `Importado do Instagram (Reels): ${instagramUrl}`,
            source_type: 'third_party'
        });
        return;
    }

    // Build content from extracted texts for other formats
    // If user edited manual text, use it. Otherwise construct from OCR list.
    let contentBody = '';
    
    if (manualOverlayText) {
        contentBody = manualOverlayText;
    } else {
        contentBody = extractedTexts
          .filter(t => t.text && t.text !== 'SEM TEXTO')
          .map((t, i) => `[Slide ${i + 1}]\n${t.text}`)
          .join('\n\n---\n\n');
    }

    const formattedContent = `CONTEÚDO:
${contentBody || '(Sem texto extraído das imagens)'}

---

DESCRIÇÃO/LEGENDA:
${postData.caption || '(Sem legenda)'}

---

TÍTULO:
${postData.title || '(Sem título)'}

---

VIEWS: ${postData.views || 0}
LIKES: ${postData.likes || 0}
COMENTÁRIOS: ${postData.comments || 0}`;

    onImport({
      content: formattedContent,
      comment: `Importado do Instagram: ${instagramUrl}`,
      source_type: 'third_party'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-500" />
          URL do Post do Instagram
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://www.instagram.com/p/ABC123..."
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleFetchPost} 
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Image View Modal */}
      <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
        <DialogContent className="max-w-[90vw] h-[90vh] p-0 border-0 bg-transparent shadow-none flex flex-col items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center bg-black/80 rounded-lg overflow-hidden p-4">
                <Button 
                    className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                    size="icon"
                    onClick={() => setViewImage(null)}
                >
                    <ZoomOut className="w-4 h-4 rotate-45" /> {/* Using rotate-45 of zoom-out as close/X replacement if X not available or just X from dialog */}
                </Button>
                
                <div className="absolute bottom-8 flex gap-2 z-50">
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-black/50 text-white hover:bg-black/70 border-0 backdrop-blur-sm"
                        onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.25))}
                    >
                        <ZoomOut className="w-4 h-4 mr-2" /> Menos Zoom
                    </Button>
                    <span className="bg-black/50 text-white px-3 py-1.5 rounded text-sm backdrop-blur-sm flex items-center">
                        {Math.round(imageZoom * 100)}%
                    </span>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-black/50 text-white hover:bg-black/70 border-0 backdrop-blur-sm"
                        onClick={() => setImageZoom(prev => Math.min(3, prev + 0.25))}
                    >
                        <ZoomIn className="w-4 h-4 mr-2" /> Mais Zoom
                    </Button>
                </div>

                <div className="overflow-auto w-full h-full flex items-center justify-center">
                    {viewImage && (
                        <img 
                            src={viewImage.cloudinary_url || viewImage.url} 
                            alt="Full view"
                            style={{ 
                                transform: `scale(${imageZoom})`,
                                transition: 'transform 0.2s ease-out',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                            className="rounded shadow-2xl"
                        />
                    )}
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Post Data Preview */}
      {postData && (
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
          <CardContent className="p-4 space-y-4">
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">{formatNumber(postData.likes)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{formatNumber(postData.views)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">{formatNumber(postData.comments)}</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                {postData.images?.length || 0} imagens
              </Badge>
            </div>

            {/* Images Preview & Manual Text */}
            {postData.images?.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Imagens do Post</Label>
                    <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                        {postData.images.map((img, idx) => (
                        <div key={idx} className="relative shrink-0 group">
                            <img 
                            src={img.cloudinary_url || img.url} 
                            alt={`Slide ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-200 cursor-zoom-in"
                            onClick={() => {
                                setViewImage(img);
                                setImageZoom(1);
                            }}
                            />
                            <div 
                                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                    setViewImage(img);
                                    setImageZoom(1);
                                }}
                            >
                                <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                            {idx + 1}
                            </Badge>
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                </div>

                {/* OCR & Manual Text Section */}
                {(postTypeFormat === 'Carrossel' || postTypeFormat === 'Post' || postTypeFormat === 'Reels') && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-semibold text-slate-700">Texto Sobreposto / Manual</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExtractText}
                                disabled={isExtractingText}
                                className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                                {isExtractingText ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                )}
                                {isExtractingText ? 'Extraindo...' : 'Usar IA (OCR)'}
                            </Button>
                        </div>
                        
                        <Textarea 
                            placeholder="Escreva aqui o que está escrito na imagem (ou use o botão de OCR acima)..."
                            value={manualOverlayText}
                            onChange={(e) => setManualOverlayText(e.target.value)}
                            className="min-h-[100px] text-sm font-mono bg-white"
                        />
                        <p className="text-[10px] text-slate-400">
                            Para Reels/Stories, digite o texto principal que aparece sobre o vídeo/imagem.
                        </p>
                    </div>

                    {/* Video Transcription - Only for Reels */}
                    {postTypeFormat === 'Reels' && postData?.raw?.video_versions?.length > 0 && (
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5 text-purple-500" />
                                Transcrição do Vídeo (Áudio)
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleTranscribeVideo}
                                disabled={isTranscribing}
                                className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                                {isTranscribing ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                    <Video className="w-3 h-3 mr-1.5" />
                                )}
                                {isTranscribing ? 'Transcrevendo...' : 'Transcrever Vídeo'}
                            </Button>
                        </div>
                        
                        <Textarea 
                            placeholder="A transcrição do áudio do vídeo aparecerá aqui..."
                            value={videoTranscription}
                            onChange={(e) => setVideoTranscription(e.target.value)}
                            className="min-h-[80px] text-sm font-mono bg-white"
                        />
                        <p className="text-[10px] text-slate-400">
                            Use o botão acima para transcrever automaticamente o áudio do Reels via IA (Gemini).
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Caption Preview */}
            {postData.caption && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Legenda</Label>
                <p className="text-sm text-slate-700 line-clamp-3 bg-white p-2 rounded border border-slate-100">
                  {postData.caption}
                </p>
              </div>
            )}

            {/* Import Button */}
            <Button 
              onClick={handleImport}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!postData}
            >
              <Instagram className="w-4 h-4 mr-2" />
              Importar como Exemplo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}