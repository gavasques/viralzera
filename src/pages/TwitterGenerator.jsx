import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Sparkles, User, Image, Download, ChevronLeft, ChevronRight, Loader2, Twitter, Plus, Trash2, Save, ArrowLeft, Type, PanelRightClose, PanelRightOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

import TweetCard from "@/components/twitter/TweetCard";
import TextEditorToolbar from "@/components/twitter/TextEditorToolbar";
import SlideSidebar from "@/components/twitter/SlideSidebar";
import { PageSkeleton as LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import CanvasToggleButton from "@/components/canvas/CanvasToggleButton";

const IMAGE_FORMATS = {
  portrait: { width: 1080, height: 1350, label: "Retrato (Feed) (1080x1350)" },
  square: { width: 1080, height: 1080, label: "Quadrado (1080x1080)" },
  story: { width: 1080, height: 1920, label: "Stories (1080x1920)" }
};

const FONTS = [
  { label: "Moderno (Chirp/Inter)", value: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Serif (Georgia)", value: "Georgia, serif" },
  { label: "Mono", value: "monospace" }
];

const DEFAULT_CONFIG = {
  display_name: "",
  username: "",
  profile_photo: "",
  verified: true,
  bg_color: "#FFFFFF",
  text_color: "#0F1419",
  font: FONTS[0].value
};

export default function TwitterGenerator() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showConfig, setShowConfig] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Project State
  const [projectTitle, setProjectTitle] = useState("");
  
  // Slide State
  const [slides, setSlides] = useState([{ id: 1, text: "", image: null }]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [imageFormat, setImageFormat] = useState("portrait");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(0);
  const [fontSize, setFontSize] = useState(22);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  
  const cardRefs = useRef([]);
  const textareaRef = useRef(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  // Ref for Auto-Save to access latest state without resetting interval
  const stateRef = useRef({ slides, projectTitle, config, imageFormat, projectId });
  
  useEffect(() => {
    stateRef.current = { slides, projectTitle, config, imageFormat, projectId };
  }, [slides, projectTitle, config, imageFormat, projectId]);

  // --- QUERIES ---

  // 1. User Profile Config
  const { data: savedConfig } = useQuery({
    queryKey: ['twitterConfig'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const configs = await base44.entities.TwitterConfig.filter({ created_by: user.email });
      return configs[0] || null;
    },
    staleTime: 1000 * 60 * 5
  });

  // 2. Load Project if ID exists
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['twitterProject', projectId],
    queryFn: () => projectId ? base44.entities.TwitterProject.get(projectId) : null,
    enabled: !!projectId
  });

  // --- EFFECTS ---

  // Apply saved profile config
  useEffect(() => {
    if (savedConfig && !projectId) { // Only apply default if not loading a project (or maybe apply if project doesn't have config?)
       // Let's stick to applying default savedConfig initially
       applyConfig(savedConfig);
    }
  }, [savedConfig, projectId]);

  // Apply project data when loaded
  useEffect(() => {
  if (project) {
    setProjectTitle(project.title);
    // Ensure slides are objects
    const loadedSlides = project.slides?.map((s, idx) => {
      if (typeof s === 'string') return { id: idx, text: s, image: null };
      return { id: s.id || idx, text: s.text || "", image: s.image || null };
    }) || [{ id: 1, text: "", image: null }];

    setSlides(loadedSlides);
    if (project.config) applyConfig(project.config);
    if (project.image_format) setImageFormat(project.image_format);
  }
  }, [project]);

  const applyConfig = (data) => {
    setConfig({
      display_name: data.display_name || "",
      username: data.username || "",
      profile_photo: data.profile_photo || "",
      verified: data.verified ?? true,
      bg_color: data.bg_color || "#FFFFFF",
      text_color: data.text_color || "#0F1419",
      font: data.font || FONTS[0].value
    });
  };

  // --- MUTATIONS ---

  const saveConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (savedConfig?.id) {
        return base44.entities.TwitterConfig.update(savedConfig.id, data);
      }
      return base44.entities.TwitterConfig.create(data);
    },
    onSuccess: () => {
      toast.success("Configuração do perfil salva!");
      queryClient.invalidateQueries({ queryKey: ['twitterConfig'] });
    }
  });

  const saveProjectMutation = useMutation({
    mutationFn: async (data) => {
      // Normalize slides before saving
      const normalizedSlides = data.slides.map((slide, idx) => ({ 
        id: idx, 
        text: typeof slide === 'string' ? slide : slide.text,
        image: typeof slide === 'string' ? null : slide.image
      }));
      
      const payload = {
        title: data.title,
        slides: normalizedSlides,
        config: data.config || config, // Allow passing config override or use state
        image_format: data.image_format || imageFormat
      };

      // Use the ID from data if provided (for auto-save flow consistency) or state
      const idToUpdate = data.projectId || projectId;

      if (idToUpdate) {
        return base44.entities.TwitterProject.update(idToUpdate, payload);
      }
      return base44.entities.TwitterProject.create(payload);
    },
    onSuccess: (saved, variables) => {
      const isAutoSave = variables.isAutoSave;
      
      if (!isAutoSave) {
        toast.success("Projeto salvo com sucesso!");
        setShowSaveDialog(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ['twitterProjects'] });
      
      // If it was new, redirect to URL with ID
      // Check both state projectId and variables.projectId to be sure
      const currentId = projectId || variables.projectId;
      if (!currentId && saved?.id) {
        navigate(`${createPageUrl('TwitterGenerator')}?id=${saved.id}`, { replace: true });
      }
    }
  });

  // Auto-Save Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const current = stateRef.current;
      
      // Don't auto-save if empty
      const isEmpty = current.slides.every(s => {
         const text = typeof s === 'string' ? s : s.text;
         return !text?.trim() && !s.image;
      });

      if (isEmpty) return;

      // Don't auto-save if no title and no ID (new empty project)
      // Unless we want to force a draft title
      if (!current.projectId && !current.projectTitle?.trim()) return;

      const titleToUse = current.projectTitle?.trim() || `Rascunho ${new Date().toLocaleTimeString()}`;

      saveProjectMutation.mutate({
        title: titleToUse,
        slides: current.slides,
        config: current.config,
        image_format: current.imageFormat,
        projectId: current.projectId,
        isAutoSave: true
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---

  const handleSaveProject = () => {
    const isEmpty = slides.every(s => {
       const text = typeof s === 'string' ? s : s.text;
       return !text?.trim() && !s.image;
    });

    if (isEmpty) {
      toast.error("O post está vazio");
      return;
    }
    
    if (!projectId) {
      setProjectTitle(`Post - ${new Date().toLocaleDateString()}`);
      setShowSaveDialog(true);
    } else {
      saveProjectMutation.mutate({ title: projectTitle, slides });
    }
  };

  const confirmSaveNew = () => {
    if (!projectTitle.trim()) {
      toast.error("Digite um nome para o post");
      return;
    }
    saveProjectMutation.mutate({ title: projectTitle, slides });
  };

  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setConfig(prev => ({ ...prev, profile_photo: file_url }));
  }, []);

  // Slide Logic
  const updateCurrentSlide = (text) => {
    setSlides(prev => {
      const newSlides = [...prev];
      const current = newSlides[activeSlideIndex];
      // If it was string, convert to object
      const slideObj = typeof current === 'string' ? { id: activeSlideIndex, text: current, image: null } : { ...current };
      slideObj.text = text;
      newSlides[activeSlideIndex] = slideObj;
      return newSlides;
    });
  };

  const updateSlideImage = (imageData) => {
    setSlides(prev => {
      const newSlides = [...prev];
      const current = newSlides[activeSlideIndex];
      const slideObj = typeof current === 'string' ? { id: activeSlideIndex, text: current, image: null } : { ...current };
      slideObj.image = imageData;
      newSlides[activeSlideIndex] = slideObj;
      return newSlides;
    });
  };

  const handleImagePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        toast.promise(
          base44.integrations.Core.UploadFile({ file }).then(({ file_url }) => {
            updateSlideImage({ url: file_url, x: 0, y: 0, scale: 1 });
            return file_url;
          }),
          {
            loading: 'Enviando imagem colada...',
            success: 'Imagem adicionada!',
            error: 'Erro ao enviar imagem'
          }
        );
        e.preventDefault();
        break; // Only one image
      }
    }
  }, [activeSlideIndex]);

  // Attach paste listener to window or specific area
  useEffect(() => {
    window.addEventListener('paste', handleImagePaste);
    return () => window.removeEventListener('paste', handleImagePaste);
  }, [handleImagePaste]);
  
  const handleAddImage = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const promise = base44.integrations.Core.UploadFile({ file }).then(({ file_url }) => {
        updateSlideImage({ url: file_url, x: 0, y: 0, scale: 1 });
      });
      
      toast.promise(promise, {
        loading: 'Enviando imagem...',
        success: 'Imagem adicionada!',
        error: 'Erro ao enviar imagem'
      });
  };

  const handleReorderSlides = (fromIndex, toIndex) => {
    const result = Array.from(slides);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    setSlides(result);
    // Adjust active index if needed or just keep it on the moved item?
    // If we moved the active slide, follow it
    if (activeSlideIndex === fromIndex) {
      setActiveSlideIndex(toIndex);
    } else if (activeSlideIndex > fromIndex && activeSlideIndex <= toIndex) {
       setActiveSlideIndex(activeSlideIndex - 1);
    } else if (activeSlideIndex < fromIndex && activeSlideIndex >= toIndex) {
       setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  const addNewSlide = () => {
    setSlides(prev => [...prev, { id: Date.now(), text: "", image: null }]);
    setActiveSlideIndex(slides.length);
  };

  const duplicateSlide = (index) => {
    const slideToCopy = slides[index];
    const newSlide = typeof slideToCopy === 'string' 
      ? { id: Date.now(), text: slideToCopy, image: null } 
      : { ...slideToCopy, id: Date.now() }; // Clone object
      
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(index + 1);
  };

  const removeSlide = (index) => {
    if (slides.length <= 1) {
      setSlides([{ id: Date.now(), text: "", image: null }]);
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlideIndex >= index) {
      setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    }
  };

  // Generation
  const generateImages = useCallback(async () => {
    if (!config.display_name || !config.username) {
      toast.error("Configure seu perfil primeiro");
      setShowConfig(true);
      return;
    }

    const isEmpty = slides.every(s => {
       const text = typeof s === 'string' ? s : s.text;
       return !text?.trim() && !s.image;
    });

    if (isEmpty) {
      toast.error("O slide deve ter texto ou imagem");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const format = IMAGE_FORMATS[imageFormat];
      const images = [];

      for (let i = 0; i < slides.length; i++) {
        const cardElement = cardRefs.current[i];
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
          scale: 4, // Increased resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: config.bg_color,
          width: format.width / 2,
          height: format.height / 2,
          logging: false
        });

        images.push(canvas.toDataURL('image/png'));
      }

      setGeneratedImages(images);
      setCurrentPreview(0);
      toast.success(`${images.length} imagens geradas!`);
    } catch (error) {
      toast.error("Erro ao gerar imagens");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [config, slides, imageFormat]);

  const downloadImage = useCallback((dataUrl, index) => {
    const link = document.createElement('a');
    link.download = `tweet-${index + 1}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const downloadAll = useCallback(() => {
    generatedImages.forEach((img, idx) => {
      setTimeout(() => downloadImage(img, idx), idx * 500);
    });
  }, [generatedImages, downloadImage]);

  if (isLoadingProject) return <LoadingSkeleton />;

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen overflow-hidden bg-slate-50 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lato:wght@400;700&family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
      `}</style>
      {/* LEFT SIDEBAR: SLIDES LIST - Hidden on small screens */}
      <div className="hidden lg:block">
        <SlideSidebar 
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSelect={setActiveSlideIndex}
          onAdd={addNewSlide}
          onRemove={removeSlide}
          onDuplicate={duplicateSlide}
          onReorder={handleReorderSlides}
          config={config}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFC]">
        
        {/* Top Header */}
        <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(createPageUrl('TwitterProjects'))}
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
               <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <Twitter className="w-4 h-4 text-indigo-600" />
                 {projectTitle || "Novo Post"}
               </h1>
               <p className="text-xs text-slate-500">
                 {projectId ? "Editando" : "Criando"} • {slides.length} páginas
               </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CanvasToggleButton />
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)} className="gap-2 h-9">
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button 
              onClick={handleSaveProject} 
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 h-9"
              disabled={saveProjectMutation.isPending}
            >
              {saveProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </div>

        {/* Editor & Preview Split */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className={`max-w-[1600px] mx-auto flex flex-col xl:grid ${showPreviewPanel ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-6 md:gap-8 items-start pb-20`}>
            
            {/* Editor Area (Left/Center) */}
            <div className={`${showPreviewPanel ? 'xl:col-span-7' : 'col-span-full'} flex flex-col gap-4 md:gap-6 w-full order-2 xl:order-1 ${!showPreviewPanel ? 'max-w-4xl mx-auto' : ''}`}>
              
              {/* Navigation Bar */}
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                 <div className="flex items-center gap-3">
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-500"
                     disabled={activeSlideIndex === 0}
                     onClick={() => setActiveSlideIndex(i => i - 1)}
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </Button>
                   <span className="text-sm font-semibold text-slate-700 min-w-[100px] text-center">
                     Página {activeSlideIndex + 1}
                   </span>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-500"
                     disabled={activeSlideIndex === slides.length - 1}
                     onClick={() => setActiveSlideIndex(i => i + 1)}
                   >
                     <ChevronRight className="w-5 h-5" />
                   </Button>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                    <span>{slides[activeSlideIndex].length} caracteres</span>
                 </div>
              </div>

              {/* Main Visual Editor */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 md:p-10 flex flex-col items-center justify-center min-h-[400px] md:min-h-[600px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                <div 
                  className="relative z-10 shadow-2xl shadow-indigo-500/5 rounded-xl transition-all duration-300 bg-white border border-slate-100 overflow-hidden flex flex-col w-full"
                  style={{ 
                    maxWidth: imageFormat === 'story' ? '320px' : '440px'
                  }}
                >
                   {/* Rich Text Toolbar */}
                  <div className="border-b border-slate-50 bg-white relative z-20">
                    <TextEditorToolbar
                      text={slides[activeSlideIndex]}
                      onTextChange={updateCurrentSlide}
                      fontSize={fontSize}
                      onFontSizeChange={setFontSize}
                      textareaRef={textareaRef}
                      onAddImage={handleAddImage}
                    />
                  </div>

                  {/* Editor Area */}
                  <div 
                    className="relative w-full bg-white overflow-hidden"
                    style={{
                      aspectRatio: `${IMAGE_FORMATS[imageFormat].width} / ${IMAGE_FORMATS[imageFormat].height}`
                    }}
                  >
                    <TweetCard 
                      config={config}
                      slide={typeof slides[activeSlideIndex] === 'string' ? { text: slides[activeSlideIndex] } : slides[activeSlideIndex]}
                      isEditing={true}
                      onTextChange={updateCurrentSlide}
                      onImageUpdate={updateSlideImage}
                      onImageRemove={() => updateSlideImage(null)}
                      textareaRef={textareaRef}
                      centerVertically={false}
                      fontSize={fontSize}
                      scale={(imageFormat === 'story' ? 320 : 440) / (IMAGE_FORMATS[imageFormat].width / 2)}
                    />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-1 sm:max-w-[300px]">
                   <div className="px-3 py-2">
                      <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Formato da Imagem</Label>
                      <Select value={imageFormat} onValueChange={setImageFormat}>
                        <SelectTrigger className="border-0 shadow-none h-8 p-0 focus:ring-0 text-slate-700 font-medium bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(IMAGE_FORMATS).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                
                <Button 
                  onClick={generateImages} 
                  disabled={isGenerating}
                  size="lg"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white rounded-xl h-auto py-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex flex-col items-center gap-0.5">
                     {isGenerating ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <Sparkles className="w-5 h-5" />
                     )}
                     <span className="font-semibold text-base">Gerar Imagens</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Results Area (Right) - Collapsible */}
            {showPreviewPanel && (
              <div className="xl:col-span-5 space-y-4 w-full order-1 xl:order-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visualização</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewPanel(false)}
                    className="h-7 px-2 text-slate-400 hover:text-slate-600"
                  >
                    <PanelRightClose className="w-4 h-4 mr-1" />
                    <span className="text-xs">Ocultar</span>
                  </Button>
                </div>
                {generatedImages.length > 0 ? (
                  <div className="xl:sticky xl:top-6">
                     <div className="bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden">
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                             <Image className="w-3.5 h-3.5" />
                           </div>
                           <div>
                              <h3 className="font-medium text-slate-900 text-xs">Resultado Final</h3>
                              <p className="text-[10px] text-slate-500">Pronto para download</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-medium bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                          {generatedImages.length} img
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50/50">
                        <div className="relative rounded-lg overflow-hidden shadow-xl bg-white group ring-2 ring-white">
                          <img 
                            src={generatedImages[currentPreview]} 
                            alt={`Tweet ${currentPreview + 1}`}
                            className="w-full h-auto object-contain"
                          />
                          
                          {generatedImages.length > 1 && (
                            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => setCurrentPreview(p => Math.max(0, p - 1))}
                                disabled={currentPreview === 0}
                                className="rounded-full shadow-lg h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => setCurrentPreview(p => Math.min(generatedImages.length - 1, p + 1))}
                                disabled={currentPreview === generatedImages.length - 1}
                                className="rounded-full shadow-lg h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          
                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[9px] font-medium px-2 py-0.5 rounded-full shadow-lg">
                              {currentPreview + 1} / {generatedImages.length}
                           </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border-t border-slate-50 grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(generatedImages[currentPreview], currentPreview)}
                            className="h-8 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> Atual
                          </Button>
                          {generatedImages.length > 1 && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs"
                              onClick={downloadAll}
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> Tudo
                            </Button>
                          )}
                        </div>
                     </div>
                  </div>
                ) : (
                   <div className="xl:sticky xl:top-6 min-h-[200px] xl:min-h-[300px] flex flex-col items-center justify-center text-center p-6 border border-slate-200 border-dashed rounded-2xl bg-white/50">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                         <Image className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="font-medium text-slate-900 text-sm mb-1">Visualização</h3>
                      <p className="text-xs text-slate-500 max-w-[180px] leading-relaxed">
                        Suas imagens geradas aparecerão aqui.
                      </p>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Preview Button when panel is collapsed */}
      {!showPreviewPanel && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreviewPanel(true)}
          className="fixed bottom-6 right-6 h-10 px-4 text-slate-600 hover:text-slate-800 bg-white shadow-lg border-slate-200 z-50"
        >
          <PanelRightOpen className="w-4 h-4 mr-2" />
          <span className="text-sm">Mostrar Preview</span>
        </Button>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Novo Post</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome do Post</Label>
              <Input 
                value={projectTitle} 
                onChange={(e) => setProjectTitle(e.target.value)} 
                placeholder="Ex: Carrossel Dicas de Marketing"
              />
            </div>
            <Button onClick={confirmSaveNew} className="w-full">
              Salvar e Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações do Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4" /> Perfil
          </h4>
              
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                    {config.profile_photo ? (
                      <img src={config.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <div>
                  <p className="font-medium text-sm">Foto de Perfil</p>
                  <p className="text-xs text-slate-500">Clique para enviar</p>
                </div>
              </div>

              <div>
                <Label>Nome de Exibição</Label>
                <Input
                  value={config.display_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Ex: Guilherme Vasques"
                />
              </div>

              <div>
                <Label>Username (@)</Label>
                <Input
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Ex: ga_vasques"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Selo de Verificado</Label>
                <Switch
                  checked={config.verified}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, verified: checked }))}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Aparência
              </h4>

              <div>
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.bg_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, bg_color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={config.bg_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, bg_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Cor do Texto</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.text_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={config.text_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, text_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Fonte</Label>
                <Select 
                  value={config.font || FONTS[0].value} 
                  onValueChange={(val) => setConfig(prev => ({ ...prev, font: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-3 mt-4">
                <TweetCard
                  config={config}
                  text="Preview do texto..."
                  showArrow={false}
                  arrowDirection={null}
                  scale={0.5}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={() => { saveConfigMutation.mutate(config); setShowConfig(false); }} 
            disabled={saveConfigMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
          >
            {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Auto-save Indicator */}
      {saveProjectMutation.isPending && (
         <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur border border-slate-200 shadow-sm px-3 py-1.5 rounded-full text-xs text-slate-500 flex items-center gap-2 z-50 pointer-events-none">
            <Loader2 className="w-3 h-3 animate-spin" />
            Salvando...
         </div>
      )}

      {/* Hidden render area for html2canvas */}
      <div className="fixed -left-[9999px] top-0">
      {slides.map((slide, idx) => (
      <div
      key={idx}
      ref={el => cardRefs.current[idx] = el}
      style={{
      width: IMAGE_FORMATS[imageFormat].width / 2,
      height: IMAGE_FORMATS[imageFormat].height / 2,
      backgroundColor: config.bg_color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Padding handled by TweetCard now or needs to be removed from here to allow full bleed?
      // TweetCard has internal padding. Let's remove padding here to allow TweetCard to control it.
      padding: '0px' 
      }}
      >
      <TweetCard
      config={config}
      slide={typeof slide === 'string' ? { text: slide } : slide}
      showArrow={slides.length > 1}
      arrowDirection={
      slides.length === 1 ? null :
      idx === 0 ? 'right' :
      idx === slides.length - 1 ? 'left' : 'both'
      }
      scale={1}
      fontSize={fontSize}
      // centerVertically is default false now which means top aligned, matching editor
      />
      </div>
      ))}
      </div>
    </div>
  );
}