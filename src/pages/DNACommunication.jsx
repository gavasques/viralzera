import React, { useState } from 'react';
import { useSelectedFocus } from '@/components/hooks/useSelectedFocus';
import { useFocusData } from '@/components/hooks/useFocusData';
import { useEntityCRUD } from '@/components/hooks/useEntityCRUD';
import { neon } from "@/api/neonClient";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from '@/components/common/PageHeader';
import { CardGridSkeleton } from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Dna, Plus, Video, Music, Youtube, FileText, Upload, 
  Loader2, Play, CheckCircle, AlertCircle, Sparkles, 
  Trash2, Eye, ChevronRight, Settings, EyeOff
} from "lucide-react";

import DNAContentCard from '@/components/dna/DNAContentCard';
import DNAProfileCard from '@/components/dna/DNAProfileCard';
import DNAProfileViewer from '@/components/dna/DNAProfileViewer';
import AddContentModal from '@/components/dna/AddContentModal';

export default function DNACommunication() {
  const { selectedFocusId } = useSelectedFocus();
  const queryClient = useQueryClient();
  
  const { data: contents, isLoading: loadingContents } = useFocusData('DNAContent', 'dnaContents');
  const { data: profiles, isLoading: loadingProfiles } = useFocusData('DNAProfile', 'dnaProfiles');
  
  const contentCRUD = useEntityCRUD('DNAContent', 'dnaContents');
  const profileCRUD = useEntityCRUD('DNAProfile', 'dnaProfiles');

  const [showAddContent, setShowAddContent] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [selectedContents, setSelectedContents] = useState([]);
  const [profileTitle, setProfileTitle] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const handleTranscribe = async (contentId) => {
    setProcessingId(contentId);
    try {
      const response = await neon.functions.invoke('dnaAnalyzer', {
        action: 'transcribe',
        contentId
      });
      
      if (response.data.error) throw new Error(response.data.error);
      queryClient.invalidateQueries({ queryKey: ['dnaContents'] });
      toast.success('Transcrição concluída!');
    } catch (error) {
      toast.error('Erro na transcrição: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAnalyze = async (contentId) => {
    setProcessingId(contentId);
    try {
      const response = await neon.functions.invoke('dnaAnalyzer', {
        action: 'analyze',
        contentId
      });
      
      if (response.data.error) throw new Error(response.data.error);
      queryClient.invalidateQueries({ queryKey: ['dnaContents'] });
      toast.success('Análise concluída!');
    } catch (error) {
      toast.error('Erro na análise: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleProfileActive = async (profile) => {
    try {
      const newStatus = profile.is_active === false ? true : false;
      await profileCRUD.save(profile.id, { ...profile, is_active: newStatus });
      toast.success(newStatus ? "Perfil ativado!" : "Perfil inativado!");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleGenerateDNA = async () => {
    if (selectedContents.length === 0) {
      toast.error('Selecione pelo menos um conteúdo analisado');
      return;
    }

    if (!profileTitle.trim()) {
      toast.error('Digite um nome para o perfil');
      return;
    }

    try {
      // Create profile first
      const profile = await neon.entities.DNAProfile.create({
        focus_id: selectedFocusId,
        title: profileTitle,
        content_ids: selectedContents,
        status: 'pending'
      });

      setShowCreateProfile(false);
      setProcessingId(profile.id);

      const response = await neon.functions.invoke('dnaAnalyzer', {
        action: 'generateDNA',
        contentIds: selectedContents,
        profileId: profile.id
      });

      if (response.data.error) throw new Error(response.data.error);
      
      queryClient.invalidateQueries({ queryKey: ['dnaProfiles'] });
      toast.success('DNA de Comunicação gerado com sucesso!');
      setSelectedContents([]);
      setProfileTitle('');
    } catch (error) {
      toast.error('Erro ao gerar DNA: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const analyzedContents = contents.filter(c => c.status === 'analyzed');

  if (loadingContents || loadingProfiles) {
    return (
      <div className="space-y-6">
        <PageHeader title="DNA de Comunicação" icon={Dna} />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="DNA de Comunicação" 
        subtitle="Analise vídeos, áudios e textos para extrair seu padrão único de comunicação"
        icon={Dna}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowInactive(!showInactive)}
              className={showInactive ? "bg-slate-100 border-slate-300" : ""}
            >
              {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showInactive ? "Ocultar Inativos" : "Mostrar Inativos"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddContent(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conteúdo
            </Button>
            {analyzedContents.length > 0 && (
              <Button onClick={() => setShowCreateProfile(true)} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar DNA
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl border border-slate-100 shadow-sm w-fit">
          <TabsTrigger value="profiles" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 rounded-lg px-4 py-2">
            Perfis DNA ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="contents" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 rounded-lg px-4 py-2">
            Conteúdos ({contents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contents" className="space-y-4">
          {contents.length === 0 ? (
            <EmptyState
              icon={Video}
              title="Nenhum conteúdo adicionado"
              description="Adicione vídeos, áudios, links do YouTube ou textos para análise"
              actionLabel="Adicionar Conteúdo"
              onAction={() => setShowAddContent(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contents.map(content => (
                <DNAContentCard
                  key={content.id}
                  content={content}
                  isProcessing={processingId === content.id}
                  onTranscribe={() => handleTranscribe(content.id)}
                  onAnalyze={() => handleAnalyze(content.id)}
                  onReanalyze={() => handleAnalyze(content.id)}
                  onDelete={() => contentCRUD.remove(content.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          {profiles.length === 0 ? (
            <EmptyState
              icon={Dna}
              title="Nenhum perfil DNA criado"
              description="Analise conteúdos e gere seu DNA de comunicação"
              actionLabel="Gerar DNA"
              onAction={() => analyzedContents.length > 0 ? setShowCreateProfile(true) : setShowAddContent(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.filter(p => showInactive || p.is_active !== false).map(profile => (
                <DNAProfileCard
                  key={profile.id}
                  profile={profile}
                  onView={() => setViewingProfile(profile)}
                  onDelete={() => profileCRUD.remove(profile.id)}
                  onToggleActive={() => toggleProfileActive(profile)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Content Modal */}
      <AddContentModal
        open={showAddContent}
        onOpenChange={setShowAddContent}
        focusId={selectedFocusId}
        onSave={(data) => {
          contentCRUD.create(data);
          setShowAddContent(false);
        }}
      />

      {/* Create Profile Modal */}
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Gerar DNA de Comunicação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Perfil</Label>
              <Input
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder="Ex: Meu DNA Principal"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Selecione os conteúdos analisados</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-600 hover:text-indigo-700 h-auto py-1"
                  onClick={() => {
                    if (selectedContents.length === analyzedContents.length) {
                      setSelectedContents([]);
                    } else {
                      setSelectedContents(analyzedContents.map(c => c.id));
                    }
                  }}
                >
                  {selectedContents.length === analyzedContents.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              <ScrollArea className="h-60 border rounded-lg p-3">
                <div className="space-y-2">
                  {analyzedContents.map(content => (
                    <div
                      key={content.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setSelectedContents(prev => 
                          prev.includes(content.id) 
                            ? prev.filter(id => id !== content.id)
                            : [...prev, content.id]
                        );
                      }}
                    >
                      <Checkbox checked={selectedContents.includes(content.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{content.title}</p>
                        <p className="text-xs text-slate-500">{content.type}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-slate-500 mt-1">
                {selectedContents.length} de {analyzedContents.length} selecionados
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProfile(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateDNA}
              disabled={selectedContents.length === 0 || !profileTitle.trim() || processingId}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {processingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar DNA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      {viewingProfile && (
        <DNAProfileViewer
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}

    </div>
  );
}