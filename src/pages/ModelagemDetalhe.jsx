import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon, callFunction } from "@/api/neonClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Layers, Youtube, FileText, Plus, Hash,
  Video, Loader2, PlayCircle, Settings, BrainCircuit, Link2, Sparkles, Globe, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import VideoCard from "@/components/modeling/VideoCard";
import TextCard from "@/components/modeling/TextCard";
import AddVideoModal from "@/components/modeling/AddVideoModal";
import AddTextModal from "@/components/modeling/AddTextModal";
import AddLinkModal from "@/components/modeling/AddLinkModal";
import LinkCard from "@/components/modeling/LinkCard";
import LinkViewerModal from "@/components/modeling/LinkViewerModal";
import EditVideoModal from "@/components/modeling/EditVideoModal";
import EditLinkModal from "@/components/modeling/EditLinkModal";
import CreatorIdeaEditor from "@/components/modeling/CreatorIdeaEditor";
import TranscriptViewerModal from "@/components/modeling/TranscriptViewerModal";
import TextViewerModal from "@/components/modeling/TextViewerModal";
import ModelingFormModal from "@/components/modeling/ModelingFormModal";
import AssistantDrawer from "@/components/modeling/AssistantDrawer";
import { useDeepResearch } from "@/components/providers/DeepResearchProvider";
import DeepResearchWebhookModal from "@/components/modeling/DeepResearchWebhookModal";
// import ResearchCard from "@/components/modeling/ResearchCard";

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
  const [viewingText, setViewingText] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [scrapingLinkId, setScrapingLinkId] = useState(null);
  const [analyzingLinkId, setAnalyzingLinkId] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [generatingDossier, setGeneratingDossier] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyzingTextId, setAnalyzingTextId] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const { openDeepResearch } = useDeepResearch();
  const [showDeepResearchWebhook, setShowDeepResearchWebhook] = useState(false);

  // Fetch modeling
  const { data: modeling, isLoading: loadingModeling } = useQuery({
    queryKey: ['modeling', modelingId],
    queryFn: async () => {
      const results = await neon.entities.Modeling.filter({ id: modelingId });
      return results[0] || null;
    },
    enabled: !!modelingId
  });

  // Fetch videos
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['modelingVideos', modelingId],
    queryFn: () => neon.entities.ModelingVideo.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['modelingAnalyses', modelingId],
    queryFn: () => neon.entities.ModelingAnalysis.filter({ modeling_id: modelingId }),
    enabled: !!modelingId
  });

  // Fetch texts
  const { data: texts = [], isLoading: loadingTexts } = useQuery({
    queryKey: ['modelingTexts', modelingId],
    queryFn: () => neon.entities.ModelingText.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch links
  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['modelingLinks', modelingId],
    queryFn: () => neon.entities.ModelingLink.filter({ modeling_id: modelingId }, '-created_date', 100),
    enabled: !!modelingId
  });

  // Fetch researches - REMOVED (moved to texts)
  const researches = [];
  const loadingResearches = false;

  // Fetch dossier
  const { data: dossier } = useQuery({
    queryKey: ['modelingDossier', modelingId],
    queryFn: async () => {
      const dossiers = await neon.entities.ContentDossier.filter({ modeling_id: modelingId }, '-created_date', 1);
      return dossiers[0] || null;
    },
    enabled: !!modelingId
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (id) => neon.entities.ModelingVideo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      updateModelingTotals().catch(() => { });
      toast.success('Vídeo excluído!');
    }
  });

  // Delete text mutation
  const deleteTextMutation = useMutation({
    mutationFn: (id) => neon.entities.ModelingText.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingTexts', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Texto excluído!');
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id) => neon.entities.ModelingLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Link excluído!');
    }
  });

  // Update modeling totals helper
  const updateModelingTotals = async () => {
    const allVideos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });
    const allTexts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });
    const allLinks = await neon.entities.ModelingLink.filter({ modeling_id: modelingId });

    const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
    const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
    const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
    const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);
    const linkChars = allLinks.reduce((sum, l) => sum + (l.character_count || 0), 0);
    const linkTokens = allLinks.reduce((sum, l) => sum + (l.token_estimate || 0), 0);

    await neon.entities.Modeling.update(modelingId, {
      total_characters: videoChars + textChars + linkChars,
      total_tokens_estimate: videoTokens + textTokens + linkTokens
    });
  };

  // Delete research mutation - REMOVED
  const deleteResearchMutation = { mutate: () => { } };

  // Stop transcription
  const handleStopTranscription = async (videoId) => {
    try {
      await neon.entities.ModelingVideo.update(videoId, {
        status: 'pending', // Voltar para pendente para permitir nova tentativa
        error_message: 'Interrompido pelo usuário'
      });
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      toast.info('Transcrição interrompida');
      setTranscribingId(null);
    } catch (error) {
      toast.error('Erro ao interromper: ' + error.message);
    }
  };

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
      await neon.entities.ModelingVideo.update(videoId, {
        status: 'transcribing',
        error_message: null
      });
      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });

      // Get modeling config for model and prompt
      const modelingConfigs = await neon.entities.ModelingConfig.list();
      const config = modelingConfigs[0];
      const cfg = config?.config || {};

      if (!cfg.model) {
        throw new Error('Configure o modelo de transcrição em Configurações de Agentes > Modelagem');
      }

      let systemPrompt = cfg.prompt || `Você é um especialista em transcrição de vídeos.

Tarefa:
- Transcreva todo o conteúdo do vídeo com precisão
- Mantenha a linguagem original e expressões usadas pelo palestrante
- Preserve gírias, palavras de preenchimento (tipo, né, mano, tá ligado, etc.)
- Mantenha padrões naturais de fala
- Marque [RISOS] para risadas, [PAUSA] para pausas
- NÃO reescreva em português formal - preserve a voz original

Retorne APENAS o texto da transcrição, limpo e normalizado.`;

      // Adicionar finalidade do material se informada
      if (video.purpose) {
        systemPrompt += `\n\n**FINALIDADE ESPECÍFICA DESTE MATERIAL:**\n${video.purpose}\n\nLeve esta finalidade em consideração durante a transcrição.`;
      }

      // Call OpenRouter via backend
      const data = await callFunction('openrouter', {
        model: cfg.model,
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
      });

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Resposta inválida da API');
      }

      const transcript = data.choices[0].message.content;
      const charCount = transcript.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Update video with transcript
      await neon.entities.ModelingVideo.update(videoId, {
        content: transcript,
        character_count: charCount,
        token_estimate: tokenEstimate,
        status: 'transcribed',
        error_message: null
      });

      // Update modeling totals
      const allVideos = await neon.entities.ModelingVideo.filter({ modeling_id: modelingId });
      const allTexts = await neon.entities.ModelingText.filter({ modeling_id: modelingId });

      const videoChars = allVideos.reduce((sum, v) => sum + (v.character_count || 0), 0);
      const videoTokens = allVideos.reduce((sum, v) => sum + (v.token_estimate || 0), 0);
      const textChars = allTexts.reduce((sum, t) => sum + (t.character_count || 0), 0);
      const textTokens = allTexts.reduce((sum, t) => sum + (t.token_estimate || 0), 0);

      await neon.entities.Modeling.update(modelingId, {
        total_characters: videoChars + textChars,
        total_tokens_estimate: videoTokens + textTokens
      });

      queryClient.invalidateQueries({ queryKey: ['modelingVideos', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Transcrição concluída!');

      // Executar análise individual do vídeo
      try {
        toast.info('Analisando vídeo...');
        await neon.functions.invoke('runModelingAnalysis', {
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
      await neon.entities.ModelingVideo.update(videoId, {
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

  // Scrape link (puxar dados)
  const handleScrapeLink = async (linkId) => {
    setScrapingLinkId(linkId);

    const link = links.find(l => l.id === linkId);
    if (!link) {
      toast.error('Link não encontrado');
      setScrapingLinkId(null);
      return;
    }

    try {
      // Atualizar status para processing
      await neon.entities.ModelingLink.update(linkId, {
        scrape_status: 'processing',
        scrape_error_message: null
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });

      // Extrair conteúdo usando InvokeLLM direto do frontend
      const extractResponse = await neon.integrations.Core.InvokeLLM({
        prompt: `Extraia o conteúdo principal deste artigo/página, removendo navegação, ads e elementos irrelevantes. Retorne apenas o texto do artigo de forma limpa e estruturada.\n\nURL: ${link.url}`,
        add_context_from_internet: true
      });

      const articleContent = extractResponse;

      if (!articleContent || articleContent.length < 100) {
        throw new Error('Não foi possível extrair conteúdo suficiente do link');
      }

      const charCount = articleContent.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Atualizar link com conteúdo extraído
      await neon.entities.ModelingLink.update(linkId, {
        content: articleContent,
        character_count: charCount,
        token_estimate: tokenEstimate,
        scrape_status: 'completed',
        scrape_error_message: null
      });

      // Atualizar totais da modelagem
      await updateModelingTotals();

      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Dados extraídos com sucesso!');
    } catch (error) {
      // Atualizar status para error
      await neon.entities.ModelingLink.update(linkId, {
        scrape_status: 'error',
        scrape_error_message: error.message
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      toast.error('Erro ao extrair dados: ' + error.message);
    } finally {
      setScrapingLinkId(null);
    }
  };

  // Analyze link (analisar)
  const handleAnalyzeLinkContent = async (linkId) => {
    setAnalyzingLinkId(linkId);

    try {
      await neon.functions.invoke('analyzeLinkContent', {
        linkId,
        modeling_id: modelingId
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
      toast.success('Link analisado com sucesso!');
    } catch (error) {
      toast.error('Erro ao analisar link: ' + error.message);
    } finally {
      setAnalyzingLinkId(null);
    }
  };

  // Process all pending links (scrape all)
  const handleProcessAllLinks = async () => {
    const pendingLinks = links.filter(l => l.scrape_status === 'pending');
    if (pendingLinks.length === 0) {
      toast.info('Nenhum link pendente para processar');
      return;
    }

    for (const link of pendingLinks) {
      await handleScrapeLink(link.id);
    }
  };

  // Analyze video
  const handleAnalyzeVideo = async (videoId) => {
    setAnalyzingId(videoId);

    const video = videos.find(v => v.id === videoId);
    if (!video || !video.content) {
      toast.error('Vídeo não transcrito');
      setAnalyzingId(null);
      return;
    }

    try {
      toast.info('Analisando vídeo...');

      // Buscar configuração do agente de análise
      const analyzerConfigs = await neon.entities.ModelingAnalyzerConfig.list();
      const config = analyzerConfigs?.[0];
      const cfg = config?.config || {};

      if (!cfg.model) {
        throw new Error('Configure o agente de Análise Individual em Configurações de Agentes');
      }

      let systemPrompt = cfg.prompt || `Você é um analista de conteúdo especializado. Analise este material e extraia os insights, tópicos-chave e informações mais relevantes para criação de conteúdo.`;

      // Adicionar finalidade do material se informada
      if (video.purpose) {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, `\n\n**FINALIDADE ESPECÍFICA DESTE MATERIAL:**\n${video.purpose}\n\nFoque sua análise considerando esta finalidade informada pelo usuário.`);
      } else {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, '');
      }

      // Chamar OpenRouter via backend
      const data = await callFunction('openrouter', {
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: video.content }
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      const analysisSummary = data.choices?.[0]?.message?.content;

      if (!analysisSummary) {
        throw new Error('Resposta inválida da API');
      }

      // Salvar análise
      await neon.entities.ModelingAnalysis.create({
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

  // Analyze link
  const handleAnalyzeLink = async (linkId) => {
    setAnalyzingLinkId(linkId);

    const link = links.find(l => l.id === linkId);
    if (!link || !link.content) {
      toast.error('Link sem conteúdo. Capture os dados primeiro.');
      setAnalyzingLinkId(null);
      return;
    }

    try {
      // Atualizar status para processing
      await neon.entities.ModelingLink.update(linkId, {
        analysis_status: 'processing',
        analysis_error_message: null
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });

      toast.info('Analisando link...');

      // Buscar configuração do agente de análise de links
      const analyzerConfigs = await neon.entities.ModelingLinkAnalyzerConfig.list();
      const config = analyzerConfigs?.[0];
      const cfg = config?.config || {};

      if (!cfg.model) {
        throw new Error('Configure o agente de Analisador de Links em Configurações de Agentes');
      }

      let systemPrompt = cfg.prompt || `Você é um analista de conteúdo especializado. Analise este material e extraia os insights, tópicos-chave e informações mais relevantes para criação de conteúdo.`;

      // Adicionar finalidade do material se informada
      if (link.purpose) {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, `\n\n**FINALIDADE ESPECÍFICA DESTE MATERIAL:**\n${link.purpose}\n\nFoque sua análise considerando esta finalidade informada pelo usuário.`);
      } else {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, '');
      }

      // Chamar OpenRouter via backend
      const linkAnalysisBody = {
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Por favor, analise este conteúdo:\n\n${link.content}` }
        ],
        temperature: 0.7,
        max_tokens: cfg.max_tokens || 4000,
      };

      if (cfg.enable_web_search) linkAnalysisBody.plugins = [{ id: 'web' }];
      if (cfg.enable_reasoning && cfg.model?.includes('claude')) {
        linkAnalysisBody.reasoning = { effort: cfg.reasoning_effort || 'medium' };
      }

      const linkAnalysisData = await callFunction('openrouter', linkAnalysisBody);
      const analysisSummary = linkAnalysisData.choices?.[0]?.message?.content;

      if (!analysisSummary) {
        throw new Error('Resposta inválida da IA');
      }

      // Salvar análise
      await neon.entities.ModelingAnalysis.create({
        modeling_id: modelingId,
        material_id: linkId,
        material_type: 'link',
        material_title: link.title,
        analysis_summary: analysisSummary,
        character_count: analysisSummary.length,
        token_estimate: Math.ceil(analysisSummary.length / 4),
        status: 'completed'
      });

      // Atualizar status do link
      await neon.entities.ModelingLink.update(linkId, {
        analysis_status: 'completed',
        analysis_error_message: null
      });

      queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      toast.success('Link analisado!');
    } catch (error) {
      // Atualizar status para error
      await neon.entities.ModelingLink.update(linkId, {
        analysis_status: 'error',
        analysis_error_message: error.message
      });
      queryClient.invalidateQueries({ queryKey: ['modelingLinks', modelingId] });
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAnalyzingLinkId(null);
    }
  };

  // Analyze text
  const handleAnalyzeText = async (textId) => {
    setAnalyzingTextId(textId);

    const text = texts.find(t => t.id === textId);
    if (!text || !text.content) {
      toast.error('Texto sem conteúdo');
      setAnalyzingTextId(null);
      return;
    }

    try {
      toast.info('Analisando texto...');

      // Buscar configuração do agente de análise de textos
      const analyzerConfigs = await neon.entities.ModelingTextAnalyzerConfig.list();
      const config = analyzerConfigs?.[0];
      const cfg = config?.config || {};

      if (!cfg.model) {
        throw new Error('Configure o agente de Análise de Textos em Configurações de Agentes');
      }

      let systemPrompt = (cfg.prompt || '').replace(/\{\{text_content\}\}/g, text.content);

      // Adicionar finalidade do material se informada
      if (text.purpose) {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, `\n\n**FINALIDADE ESPECÍFICA DESTE MATERIAL:**\n${text.purpose}\n\nFoque sua análise considerando esta finalidade informada pelo usuário.`);
      } else {
        systemPrompt = systemPrompt.replace(/\{\{purpose_note\}\}/g, '');
      }

      // Chamar OpenRouter via backend
      const data = await callFunction('openrouter', {
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Por favor, analise este texto:\n\n${text.content}` }
        ],
        temperature: 0.7,
        max_tokens: cfg.max_tokens || 4000
      });

      const analysisSummary = data.choices?.[0]?.message?.content;

      if (!analysisSummary) {
        throw new Error('Resposta inválida da API');
      }

      // Salvar análise
      await neon.entities.ModelingAnalysis.create({
        modeling_id: modelingId,
        material_id: textId,
        material_type: 'text',
        material_title: text.title,
        analysis_summary: analysisSummary,
        character_count: analysisSummary.length,
        token_estimate: Math.ceil(analysisSummary.length / 4),
        status: 'completed'
      });

      queryClient.invalidateQueries({ queryKey: ['modelingAnalyses', modelingId] });
      toast.success('Texto analisado!');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAnalyzingTextId(null);
    }
  };

  // Generate complete dossier with all references
  const handleGenerateDossier = async () => {
    setGeneratingDossier(true);

    try {
      toast.info('Coletando materiais...');

      // Buscar configuração do agente
      const generatorConfigs = await neon.entities.DossierGeneratorConfig.list();
      const config = generatorConfigs?.[0];
      const model = config?.config?.model || 'openai/gpt-4o-mini';
      const systemPrompt = config?.config?.prompt || `Você é um organizador de conteúdo. Sua tarefa é pegar os diversos materiais brutos (transcrições, textos, notas) e organizá-los em um único documento coeso em formato Markdown, chamado 'Dossiê de Conteúdo'. Crie seções claras para cada tipo de material.`;

      // Montar materiais brutos
      let materiaisBrutos = `# DOSSIÊ DE CONTEÚDO: ${modeling.title}\n\n`;

      if (modeling.description) {
        materiaisBrutos += `**Descrição:** ${modeling.description}\n\n`;
      }

      if (modeling.target_platform) {
        materiaisBrutos += `**Plataforma:** ${modeling.target_platform}\n`;
      }

      if (modeling.content_type) {
        materiaisBrutos += `**Tipo de Conteúdo:** ${modeling.content_type}\n\n`;
      }

      if (modeling.creator_idea) {
        materiaisBrutos += `## 💡 Ideia do Criador\n\n${modeling.creator_idea}\n\n`;
      }

      // Adicionar análises de vídeos
      const videoAnalyses = analyses.filter(a => a.material_type === 'video' && a.status === 'completed');
      if (videoAnalyses.length > 0) {
        materiaisBrutos += `---\n\n## 🎥 ANÁLISES DE VÍDEOS DE REFERÊNCIA (${videoAnalyses.length})\n\n`;
        videoAnalyses.forEach((a, i) => {
          const video = videos.find(v => v.id === a.material_id);
          materiaisBrutos += `### ${a.material_title || video?.title || 'Sem título'}\n\n`;
          if (video?.channel_name) {
            materiaisBrutos += `**Canal:** ${video.channel_name}\n`;
          }
          if (video?.url) {
            materiaisBrutos += `**URL:** ${video.url}\n\n`;
          }
          if (video?.purpose) {
            materiaisBrutos += `**Finalidade:** ${video.purpose}\n\n`;
          }
          materiaisBrutos += `${a.analysis_summary}\n\n`;
          materiaisBrutos += `---\n\n`;
        });
      }

      // Adicionar análises de textos
      const textAnalyses = analyses.filter(a => a.material_type === 'text' && a.status === 'completed');
      if (textAnalyses.length > 0) {
        materiaisBrutos += `## 📄 ANÁLISES DE TEXTOS DE REFERÊNCIA (${textAnalyses.length})\n\n`;
        textAnalyses.forEach((a, i) => {
          const text = texts.find(t => t.id === a.material_id);
          materiaisBrutos += `### ${a.material_title || text?.title || 'Sem título'}\n\n`;
          if (text?.description) {
            materiaisBrutos += `**Descrição:** ${text.description}\n\n`;
          }
          if (text?.purpose) {
            materiaisBrutos += `**Finalidade:** ${text.purpose}\n\n`;
          }
          materiaisBrutos += `${a.analysis_summary}\n\n`;
          materiaisBrutos += `---\n\n`;
        });
      }

      // Adicionar análises de links
      const linkAnalyses = analyses.filter(a => a.material_type === 'link' && a.status === 'completed');
      if (linkAnalyses.length > 0) {
        materiaisBrutos += `## 🔗 ANÁLISES DE LINKS DE REFERÊNCIA (${linkAnalyses.length})\n\n`;
        linkAnalyses.forEach((a, i) => {
          const link = links.find(l => l.id === a.material_id);
          materiaisBrutos += `### ${a.material_title || link?.title || 'Sem título'}\n\n`;
          if (link?.url) {
            materiaisBrutos += `**URL:** ${link.url}\n\n`;
          }
          if (link?.notes) {
            materiaisBrutos += `**Notas:** ${link.notes}\n\n`;
          }
          if (link?.purpose) {
            materiaisBrutos += `**Finalidade:** ${link.purpose}\n\n`;
          }
          materiaisBrutos += `${a.analysis_summary}\n\n`;
          materiaisBrutos += `---\n\n`;
        });
      }

      // Verificar se há conteúdo suficiente
      const hasContent = videoAnalyses.length > 0 || textAnalyses.length > 0 || linkAnalyses.length > 0 || modeling.creator_idea;

      if (!hasContent) {
        throw new Error('Não há conteúdo suficiente para gerar o dossiê. Analise os vídeos, textos e links primeiro, ou adicione uma ideia do criador.');
      }

      // Substituir placeholder e preparar prompt
      const finalSystemPrompt = systemPrompt.replace(/\{\{materiais_brutos\}\}/g, materiaisBrutos);

      toast.info('Gerando dossiê com IA...');

      // Chamar OpenRouter via backend
      const dossierBody = {
        model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: 'Organize todos esses materiais em um Dossiê de Conteúdo bem estruturado em Markdown.' }
        ],
        temperature: 0.7,
      };

      if (config?.enable_web_search) dossierBody.plugins = [{ id: 'web' }];
      if (config?.enable_reasoning && model?.includes('claude')) {
        dossierBody.reasoning = { effort: config?.reasoning_effort || 'medium' };
      }

      const dossierResponse = await callFunction('openrouter', dossierBody);
      const dossierContent = dossierResponse.choices?.[0]?.message?.content;
      const charCount = dossierContent.length;
      const tokenEstimate = Math.ceil(charCount / 4);

      // Salvar ou atualizar dossiê
      if (dossier) {
        await neon.entities.ContentDossier.update(dossier.id, {
          full_content: dossierContent,
          raw_materials: materiaisBrutos,
          system_prompt: finalSystemPrompt,
          character_count: charCount,
          token_estimate: tokenEstimate
        });
        toast.success('Dossiê atualizado com sucesso!');
      } else {
        await neon.entities.ContentDossier.create({
          title: modeling.title || 'Dossiê de Conteúdo',
          modeling_id: modelingId,
          full_content: dossierContent,
          raw_materials: materiaisBrutos,
          system_prompt: finalSystemPrompt,
          character_count: charCount,
          token_estimate: tokenEstimate
        });
        toast.success('Dossiê gerado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['modelingDossier', modelingId] });

    } catch (error) {
      console.error('Erro ao gerar dossiê:', error);
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
  const pendingLinksCount = links.filter(l => l.scrape_status === 'pending').length;

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
          {/* Pesquisa Profunda button removed */}

          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold text-slate-900">{formatNumber(modeling.total_tokens_estimate || 0)}</p>
            <p className="text-xs text-slate-500">tokens estimados</p>
          </div>
          <Button
            onClick={handleGenerateDossier}
            disabled={generatingDossier}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {generatingDossier ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : dossier ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Atualizar Dossiê
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Dossiê
              </>
            )}
          </Button>
          {/* Assistant and Deep Research buttons removed from header */}
          <Button variant="outline" size="icon" onClick={() => setShowEditModeling(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dossier Status */}
      {dossier && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Dossiê Gerado</p>
                <p className="text-sm text-slate-500">
                  {formatNumber(dossier.character_count)} caracteres • {formatNumber(dossier.token_estimate)} tokens
                </p>
              </div>
            </div>
            <Link to={createPageUrl('ContentDossiers')}>
              <Button variant="outline" size="sm">Ver Dossiês</Button>
            </Link>
          </div>
        </div>
      )}

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
            {/* <TabsTrigger value="pesquisas" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
              <Search className="w-4 h-4 mr-2" />
              Pesquisas ({researches.length})
            </TabsTrigger> */}
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
                    onRetranscribe={() => handleTranscribe(video.id)}
                    onAnalyze={() => handleAnalyzeVideo(video.id)}
                    onStopTranscription={() => handleStopTranscription(video.id)}
                    onEdit={() => setEditingVideo(video)}
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
          <div className="flex justify-end gap-2">
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
              {texts.map(text => {
                const analysis = analyses.find(a => a.material_id === text.id && a.material_type === 'text');
                return (
                  <TextCard
                    key={text.id}
                    text={text}
                    analysis={analysis}
                    isAnalyzing={analyzingTextId === text.id}
                    onView={() => setViewingText(text)}
                    onEdit={() => {
                      setEditingText(text);
                      setShowAddText(true);
                    }}
                    onAnalyze={() => handleAnalyzeText(text.id)}
                    onReanalyze={() => handleAnalyzeText(text.id)}
                    onDelete={() => {
                      if (confirm('Excluir este texto?')) {
                        deleteTextMutation.mutate(text.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Researches Tab - REMOVED (content moved to Texts) */}

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {pendingLinksCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProcessAllLinks}
                  disabled={scrapingLinkId !== null}
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
              {links.map(link => {
                const analysis = analyses.find(a => a.material_id === link.id && a.material_type === 'link');
                return (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onClick={() => setViewingLink(link)}
                    onEdit={() => setEditingLink(link)}
                    onScrape={() => handleScrapeLink(link.id)}
                    onAnalyze={() => handleAnalyzeLink(link.id)}
                    onDelete={() => {
                      if (confirm('Excluir este link?')) {
                        deleteLinkMutation.mutate(link.id);
                      }
                    }}
                    processing={scrapingLinkId === link.id}
                    analyzing={analyzingLinkId === link.id}
                  />
                );
              })}
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
        onOpenChange={(val) => {
          setShowAddText(val);
          if (!val) setEditingText(null);
        }}
        modelingId={modelingId}
        textToEdit={editingText}
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

      <TextViewerModal
        open={!!viewingText}
        onOpenChange={() => setViewingText(null)}
        text={viewingText}
      />

      <LinkViewerModal
        open={!!viewingLink}
        onOpenChange={() => setViewingLink(null)}
        link={viewingLink}
        analysis={analyses.find(a => a.material_id === viewingLink?.id && a.material_type === 'link')}
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

      <DeepResearchWebhookModal
        open={showDeepResearchWebhook}
        onOpenChange={setShowDeepResearchWebhook}
        modelingId={modelingId}
      />

      <EditVideoModal
        open={!!editingVideo}
        onOpenChange={(val) => {
          if (!val) setEditingVideo(null);
        }}
        video={editingVideo}
        modelingId={modelingId}
      />

      <EditLinkModal
        open={!!editingLink}
        onOpenChange={(val) => {
          if (!val) setEditingLink(null);
        }}
        link={editingLink}
        modelingId={modelingId}
      />
    </div>
  );
}