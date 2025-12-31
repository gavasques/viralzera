import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, Layers, Youtube, FileText, Plus, Hash, 
  Video, Loader2, PlayCircle, Settings, BrainCircuit, Link2, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { sendMessage } from "@/components/services/OpenRouterDirectService";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import VideoCard from "@/components/modeling/VideoCard";
import TextCard from "@/components/modeling/TextCard";
import AddVideoModal from "@/components/modeling/AddVideoModal";
import AddTextModal from "@/components/modeling/AddTextModal";
import AddLinkModal from "@/components/modeling/AddLinkModal";
import LinkCard from "@/components/modeling/LinkCard";
import LinkViewerModal from "@/components/modeling/LinkViewerModal";
import CreatorIdeaEditor from "@/components/modeling/CreatorIdeaEditor";
import TranscriptViewerModal from "@/components/modeling/TranscriptViewerModal";
import ModelingFormModal from "@/components/modeling/ModelingFormModal";
import AssistantDrawer from "@/components/modeling/AssistantDrawer";

export default function ModelagemDetalhe() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const modelingId = urlParams.get('id');

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showEditModeling, setShowEditModeling] = useState(false);
  const [viewingVideo, setViewingVideo] = useState(null);
  const [viewingLink, setViewingLink] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [processingLinkId, setProcessingLinkId] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [generatingDossier, setGeneratingDossier] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Fetch modeling
  const { data: modeling, isLoading: loadingModeling } = useQuery({
    queryKey: ['modeling', modelingId],
    queryFn: async () => {
      const results = await base44.entities.Modeling.filter({ id: modelingId });
      return results[0] || null;
    },
    enabled: !!modelingId
  });

  // Fetch videos
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['modelingVideos', modelingId],
    queryFn: () => base44.entities.ModelingVideo.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['modelingAnalyses', modelingId],
    queryFn: () => base44.entities.ModelingAnalysis.filter({ modeling_id: modelingId }),
    enabled: !!modelingId
  });

  // Fetch texts
  const { data: texts = [], isLoading: loadingTexts } = useQuery({
    queryKey: ['modelingTexts', modelingId],
    queryFn: () => base44.entities.ModelingText.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch links
  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['modelingLinks', modelingId],
    queryFn: () => base44.entities.ModelingLink.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelingVideo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      updateModelingTotals().catch(() => {});
      toast.success('Vídeo excluído!');
    }
  });

  // Delete text mutation
  const deleteTextMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelingText.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Texto excluído!');
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelingLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Link excluído!');
    }
  });

  // Transcribe video
  const handleTranscribe = async (videoId) => {
    setTranscribingId(videoId);
    
    // Find the video
    const video = videos.find(v => v.id === videoId);
    if (!video) {
      toast.error('Vídeo não encontrado');
      setTranscribingId(null);
      return;
    }

    try {
      // Update status to transcribing
      await base44.entities.ModelingVideo.update(videoId, { 
        status: 'transcribing',
        error_message: null
      });
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });

      // Get user config for API key
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;
      
      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter em Configurações');
      }

      // Get modeling config for model and prompt
      const modelingConfigs = await base44.entities.ModelingConfig.list();
      const config = modelingConfigs[0];
      
      if (!config?.model) {
        throw new Error('Configure o modelo de transcrição em Configurações de Agentes > Modelagem');
      }

      const systemPrompt = config.prompt || `Você é um especialista em transcrição de vídeos.

Tarefa:
- Transcreva todo o conteúdo do vídeo com precisão
- Mantenha a linguagem original e expressões usadas pelo palestrante
- Preserve gírias, palavras de preenchimento (tipo, né, mano, tá ligado, etc.)
- Mantenha padrões naturais de fala
- Marque [RISOS] para risadas, [PAUSA] para pausas
- NÃO reescreva em português formal - preserve a voz original

Retorne APENAS o texto da transcrição, limpo e normalizado.`;

      // Call OpenRouter API directly
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Modelagem'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Por favor, transcreva todo o conteúdo deste vídeo.'
                },
                {
                  type: 'video_url',
                  video_url: {
                    url: video.url
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 16000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Resposta inválida da API');
      }

      const transcript = data.choices[0].message.content;
      const charCount = transcript.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Update video with transcript
      await base44.entities.ModelingVideo.update(videoId, {
        transcript,
        character_count: charCount,
        token_estimate: tokenEstimate,
        status: 'transcribed',
        error_message: null
      });

      // Update modeling totals
      const allVideos = await base44.entities.ModelingVideo.filter({ modeling_id: modelingId });
      const allTexts = await base44.entities.ModelingText.filter({ modeling_id: modelingId });
      
      const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
      const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
      const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);

      await base44.entities.Modeling.update(modelingId, {
        total_characters: videoChars + textChars,
        total_tokens_estimate: videoTokens + textTokens
      });

      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Transcrição concluída!');

      // Executar análise individual do vídeo
      try {
        toast.info('Analisando vídeo...');
        await base44.functions.invoke('runModelingAnalysis', {
          modeling_id: modelingId,
          materialId: videoId,
          materialType: 'video',
          content: transcript
        });
        queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
        toast.success('Vídeo analisado!');
      } catch (analysisError) {
        console.error('Erro na análise individual:', analysisError);
        toast.error('Transcrição OK, mas análise falhou: ' + analysisError.message);
      }

      } catch (error) {
      console.error('Erro na transcrição:', error);
      
      // Update status to error
      await base44.entities.ModelingVideo.update(videoId, {
        status: 'error',
        error_message: error.message
      });
      
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      toast.error('Erro na transcrição: ' + error.message);
    } finally {
      setTranscribingId(null);
    }
  };

  // Transcribe all pending videos
  const handleTranscribeAll = async () => {
    const pendingVideos = videos.filter(v => v.status === 'pending');
    if (pendingVideos.length === 0) {
      toast.info('Nenhum vídeo pendente para transcrever');
      return;
    }

    for (const video of pendingVideos) {
      await handleTranscribe(video.id);
    }
  };

  // Process link
  const handleProcessLink = async (linkId) => {
    setProcessingLinkId(linkId);
    
    const link = links.find(l => l.id === linkId);
    if (!link) {
      toast.error('Link não encontrado');
      setProcessingLinkId(null);
      return;
    }

    try {
      // Atualizar status para processing
      await base44.entities.ModelingLink.update(linkId, {
        status: 'processing',
        error_message: null
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });

      // Buscar configuração do agente
      const scraperConfigs = await base44.entities.ModelingScraperConfig.list();
      const config = scraperConfigs?.[0];
      
      const model = config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.prompt || `Resuma este artigo em seus pontos-chave e insights mais importantes para um criador de conteúdo do YouTube. Foque em informações que possam virar tópicos de vídeo.`;

      // Extrair conteúdo do link usando InvokeLLM
      const articleContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia o conteúdo principal deste artigo, removendo navegação, ads e elementos irrelevantes. Retorne apenas o texto do artigo de forma limpa e estruturada.\n\nURL: ${link.url}`,
        add_context_from_internet: true
      });

      if (!articleContent || articleContent.length < 100) {
        throw new Error('Não foi possível extrair conteúdo suficiente do link');
      }

      // Buscar API key
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter');
      }

      // Chamar OpenRouter diretamente
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Link Scraper'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt.replace(/\{\{conteudo_artigo\}\}/g, articleContent) },
            { role: 'user', content: articleContent }
          ],
          temperature: 0.5,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error('Resposta inválida da API');
      }

      const charCount = summary.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Atualizar link
      await base44.entities.ModelingLink.update(linkId, {
        summary,
        content: articleContent,
        character_count: charCount,
        token_estimate: tokenEstimate,
        status: 'completed',
        error_message: null
      });

      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Link processado!');

      // Executar análise individual do link
      try {
        toast.info('Analisando link...');
        await base44.functions.invoke('runModelingAnalysis', {
          modeling_id: modelingId,
          materialId: linkId,
          materialType: 'link',
          content: summary
        });
        queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
        toast.success('Link analisado!');
      } catch (analysisError) {
        console.error('Erro na análise individual:', analysisError);
        toast.error('Link processado, mas análise falhou: ' + analysisError.message);
      }

      } catch (error) {
      await base44.entities.ModelingLink.update(linkId, {
        status: 'error',
        error_message: error.message
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setProcessingLinkId(null);
    }
  };

  // Process all pending links
  const handleProcessAllLinks = async () => {
    const pendingLinks = links.filter(l => l.status === 'pending');
    if (pendingLinks.length === 0) {
      toast.info('Nenhum link pendente para processar');
      return;
    }

    for (const link of pendingLinks) {
      await handleProcessLink(link.id);
    }
  };

  // Analyze video
  const handleAnalyzeVideo = async (videoId) => {
    setAnalyzingId(videoId);
    
    const video = videos.find(v => v.id === videoId);
    if (!video || !video.transcript) {
      toast.error('Vídeo não transcrito');
      setAnalyzingId(null);
      return;
    }

    try {
      toast.info('Analisando vídeo...');

      // Buscar configuração do agente de análise
      const analyzerConfigs = await base44.entities.ModelingAnalyzerConfig.list();
      const config = analyzerConfigs?.[0];
      
      if (!config?.model) {
        throw new Error('Configure o agente de Análise Individual em Configurações de Agentes');
      }

      const systemPrompt = config.prompt || `Você é um analista de conteúdo especializado. Analise este material e extraia os insights, tópicos-chave e informações mais relevantes para criação de conteúdo.`;

      // Buscar API key
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter em Configurações');
      }

      // Chamar OpenRouter diretamente
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Analyzer'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: video.transcript }
          ],
          temperature: 0.5,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const analysisSummary = data.choices?.[0]?.message?.content;

      if (!analysisSummary) {
        throw new Error('Resposta inválida da API');
      }

      // Salvar análise
      await base44.entities.ModelingAnalysis.create({
        modeling_id: modelingId,
        material_id: videoId,
        material_type: 'video',
        material_title: video.title,
        analysis_summary: analysisSummary,
        character_count: analysisSummary.length,
        token_estimate: Math.ceil(analysisSummary.length / 4),
        status: 'completed'
      });

      queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
      toast.success('Vídeo analisado!');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Generate dossier and redirect to script wizard
  const handleCreateScript = async () => {
    console.log('🚀 Iniciando geração de dossiê...');
    setGeneratingDossier(true);
    
    try {
      console.log('📋 Dados da modelagem:', { 
        id: modelingId, 
        title: modeling.title,
        videosCount: videos.length,
        textsCount: texts.length,
        linksCount: links.length
      });

      // Buscar configuração do agente
      const dossierConfigs = await base44.entities.DossierGeneratorConfig.list();
      const config = dossierConfigs?.[0];
      console.log('⚙️ Config do agente:', config);

      const model = config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.prompt || `Você é um Estrategista de Conteúdo. Sua tarefa é ler esta conversa de brainstorming entre um usuário e um assistente de IA e extrair um plano de ação claro para um vídeo de YouTube. Organize as ideias, decisões e estrutura do vídeo em um documento coeso em formato Markdown, chamado 'Dossiê de Conteúdo'.`;

      // Buscar histórico do chat
      const chatHistory = await base44.entities.ModelingChat.filter({ modeling_id: modelingId }, 'created_date', 100);

      // Verificar se há conversa
      if (chatHistory.length === 0) {
        throw new Error('Nenhuma conversa encontrada. Use o Assistente de Ideias para desenvolver o conceito do vídeo antes de gerar o dossiê.');
      }

      // Montar materiais brutos a partir da conversa
      let materiaisBrutos = `# CONVERSA DE BRAINSTORMING: ${modeling.title}\n\n`;
      
      if (modeling.description) {
        materiaisBrutos += `**Descrição da Modelagem:** ${modeling.description}\n\n`;
      }
      if (modeling.target_platform) {
        materiaisBrutos += `**Plataforma:** ${modeling.target_platform}\n`;
      }
      if (modeling.content_type) {
        materiaisBrutos += `**Tipo de Conteúdo:** ${modeling.content_type}\n\n`;
      }
      if (modeling.creator_idea) {
        materiaisBrutos += `## 💡 Ideia Inicial do Criador\n\n${modeling.creator_idea}\n\n`;
      }

      materiaisBrutos += `---\n\n## 💬 CONVERSA COMPLETA\n\n`;
      
      chatHistory.forEach((msg, i) => {
        const role = msg.role === 'user' ? '**👤 Usuário**' : '**🤖 Assistente**';
        materiaisBrutos += `### Mensagem ${i + 1}\n${role}\n\n${msg.content}\n\n---\n\n`;
      });

      console.log('📊 Informações da conversa:', {
        totalMessages: chatHistory.length,
        userMessages: chatHistory.filter(m => m.role === 'user').length,
        assistantMessages: chatHistory.filter(m => m.role === 'assistant').length
      });

      // Buscar API key
      console.log('🔑 Buscando API key...');
      const userConfigs = await base44.entities.UserConfig.list();
      const apiKey = userConfigs[0]?.openrouter_api_key;

      if (!apiKey) {
        throw new Error('Configure sua API Key do OpenRouter em Configurações');
      }
      console.log('✅ API key encontrada');

      // Chamar OpenRouter
      console.log('🤖 Chamando OpenRouter com modelo:', model);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ContentAI - Dossier Generator'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt.replace(/\{\{materiais_brutos\}\}/g, materiaisBrutos) },
            { role: 'user', content: 'Organize todos esses materiais em um Dossiê de Conteúdo bem estruturado em Markdown.' }
          ],
          temperature: 0.7,
          max_tokens: 16000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na API OpenRouter:', errorData);
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Resposta da API recebida, tokens:', data.usage);
      
      const dossierContent = data.choices?.[0]?.message?.content;

      if (!dossierContent) {
        console.error('❌ Conteúdo vazio na resposta:', data);
        throw new Error('Resposta inválida da API');
      }

      console.log('✅ Dossiê gerado, tamanho:', dossierContent.length, 'caracteres');

      // Criar dossiê
      console.log('💾 Salvando dossiê no banco...');
      const dossier = await base44.entities.ContentDossier.create({
        modeling_id: modelingId,
        full_content: dossierContent,
        character_count: dossierContent.length,
        token_estimate: Math.ceil(dossierContent.length / 4)
      });

      console.log('✅ Dossiê salvo com ID:', dossier.id);
      toast.success('Dossiê gerado! Redirecionando...');
      
      const redirectUrl = createPageUrl('YoutubeScripts') + `?action=new&dossierId=${dossier.id}`;
      console.log('🔄 Redirecionando para:', redirectUrl);
      
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('❌ ERRO COMPLETO:', error);
      toast.error('Erro ao gerar dossiê: ' + error.message);
    } finally {
      setGeneratingDossier(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const pendingCount = videos.filter(v => v.status === 'pending').length;
  const transcribedCount = videos.filter(v => v.status === 'transcribed').length;
  const pendingLinksCount = links.filter(l => l.status === 'pending').length;

  if (!modelingId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Modelagem não encontrada</p>
        <Link to={createPageUrl('Modelagem')}>
          <Button variant="outline">Voltar para Modelagens</Button>
        </Link>
      </div>
    );
  }

  if (loadingModeling) {
    return <CardGridSkeleton count={3} />;
  }

  if (!modeling) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Modelagem não encontrada</p>
        <Link to={createPageUrl('Modelagem')}>
          <Button variant="outline">Voltar para Modelagens</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Modelagem')}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-pink-600" />
              {modeling.title}
            </h1>
            {modeling.description && (
              <p className="text-slate-500 text-sm mt-1">{modeling.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{modeling.target_platform}</Badge>
              <Badge variant="outline" className="bg-slate-50">{modeling.content_type}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
            <p className="text-xs text-slate-500">tokens estimados</p>
          </div>
          <Button 
            onClick={handleCreateScript}
            disabled={generatingDossier}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {generatingDossier ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Roteiro
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="bg-amber-50 hover:bg-amber-100 text-amber-600"
            onClick={() => setShowAssistant(true)}
          >
            <BrainCircuit className="w-4 h-4 mr-2" />
            Assistente
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowEditModeling(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Video className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{videos.length}</p>
          <p className="text-xs text-slate-500">Vídeos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <FileText className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{texts.length}</p>
          <p className="text-xs text-slate-500">Textos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Link2 className="w-5 h-5 text-sky-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{links.length}</p>
          <p className="text-xs text-slate-500">Links</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Hash className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_characters || 0)}</p>
          <p className="text-xs text-slate-500">Caracteres</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <Hash className="w-5 h-5 text-pink-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
          <p className="text-xs text-slate-500">~Tokens</p>
        </div>
      </div>

      {/* Creator Idea */}
      <CreatorIdeaEditor modeling={modeling} />

      {/* Tabs */}
      <Tabs defaultValue="videos" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="bg-white border border-slate-100">
            <TabsTrigger value="videos" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
              <Youtube className="w-4 h-4 mr-2" />
              Vídeos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="texts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              Textos ({texts.length})
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">
              <Link2 className="w-4 h-4 mr-2" />
              Links ({links.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTranscribeAll}
                disabled={transcribingId !== null}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Transcrever Todos ({pendingCount})
              </Button>
            )}
          </div>
        </div>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddVideo(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Vídeo
            </Button>
          </div>

          {loadingVideos ? (
            <CardGridSkeleton count={3} columns={2} />
          ) : videos.length === 0 ? (
            <EmptyState
              icon={Youtube}
              title="Nenhum vídeo adicionado"
              description="Adicione vídeos do YouTube para transcrever e usar como referência"
              actionLabel="Adicionar Vídeo"
              onAction={() => setShowAddVideo(true)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {videos.map(video => {
                const analysis = analyses.find(a => a.material_id === video.id && a.material_type === 'video');
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    analysis={analysis}
                    isTranscribing={transcribingId === video.id}
                    isAnalyzing={analyzingId === video.id}
                    onTranscribe={() => handleTranscribe(video.id)}
                    onAnalyze={() => handleAnalyzeVideo(video.id)}
                    onView={() => setViewingVideo(video)}
                    onDelete={() => {
                      if (confirm('Excluir este vídeo?')) {
                        deleteVideoMutation.mutate(video.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Texts Tab */}
        <TabsContent value="texts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddText(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>
          </div>

          {loadingTexts ? (
            <CardGridSkeleton count={3} columns={3} />
          ) : texts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum texto adicionado"
              description="Adicione textos de referência, scripts, pesquisas ou notas"
              actionLabel="Adicionar Texto"
              onAction={() => setShowAddText(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {texts.map(text => (
                <TextCard
                  key={text.id}
                  text={text}
                  onView={() => {/* TODO: View text modal */}}
                  onEdit={() => {/* TODO: Edit text */}}
                  onDelete={() => {
                    if (confirm('Excluir este texto?')) {
                      deleteTextMutation.mutate(text.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {pendingLinksCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleProcessAllLinks}
                  disabled={processingLinkId !== null}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Processar Todos ({pendingLinksCount})
                </Button>
              )}
            </div>
            <Button onClick={() => setShowAddLink(true)} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Link
            </Button>
          </div>

          {loadingLinks ? (
            <CardGridSkeleton count={3} columns={2} />
          ) : links.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="Nenhum link adicionado"
              description="Adicione links de artigos e páginas para processar e resumir"
              actionLabel="Adicionar Link"
              onAction={() => setShowAddLink(true)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {links.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isProcessing={processingLinkId === link.id}
                  onProcess={() => handleProcessLink(link.id)}
                  onView={() => setViewingLink(link)}
                  onDelete={() => {
                    if (confirm('Excluir este link?')) {
                      deleteLinkMutation.mutate(link.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddVideoModal
        open={showAddVideo}
        onOpenChange={setShowAddVideo}
        modelingId={modelingId}
      />

      <AddTextModal
        open={showAddText}
        onOpenChange={setShowAddText}
        modelingId={modelingId}
      />

      <AddLinkModal
        open={showAddLink}
        onOpenChange={setShowAddLink}
        modelingId={modelingId}
      />

      <TranscriptViewerModal
        open={!!viewingVideo}
        onOpenChange={() => setViewingVideo(null)}
        video={viewingVideo}
      />

      <LinkViewerModal
        open={!!viewingLink}
        onOpenChange={() => setViewingLink(null)}
        link={viewingLink}
      />

      <ModelingFormModal
        open={showEditModeling}
        onOpenChange={setShowEditModeling}
        modeling={modeling}
        focusId={modeling?.focus_id}
      />

      <AssistantDrawer
        open={showAssistant}
        onOpenChange={setShowAssistant}
        modelingId={modelingId}
      />
      </div>
      );
      }