import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Library, Plus, FileText, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import UserContentCard from "@/components/user-content/UserContentCard";
import UserContentFormModal from "@/components/user-content/UserContentFormModal";

export default function UserContent() {
  const { selectedFocusId } = useSelectedFocus();
  const [activeTab, setActiveTab] = useState('introductions');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: introductions = [], isLoading: isLoadingIntros } = useQuery({
    queryKey: ['user-introductions', selectedFocusId],
    queryFn: () => neon.entities.UserIntroduction.filter({ focus_id: selectedFocusId }, '-created_date', 100),
    enabled: !!selectedFocusId,
  });

  const { data: ctas = [], isLoading: isLoadingCTAs } = useQuery({
    queryKey: ['user-ctas', selectedFocusId],
    queryFn: () => neon.entities.UserCTA.filter({ focus_id: selectedFocusId }, '-created_date', 100),
    enabled: !!selectedFocusId,
  });

  const { data: descriptionBlocks = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['description-blocks', selectedFocusId],
    queryFn: () => neon.entities.DescriptionBlock.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      '-created_date'
    ),
    enabled: true
  });

  const { data: descriptionTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['description-templates', selectedFocusId],
    queryFn: () => neon.entities.DescriptionTemplate.filter(
      selectedFocusId ? { focus_id: selectedFocusId } : {},
      '-created_date'
    ),
    enabled: true
  });

  const isLoading = isLoadingIntros || isLoadingCTAs || isLoadingBlocks || isLoadingTemplates;

  const handleNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const getContentType = () => {
    switch (activeTab) {
      case 'introductions': return 'introduction';
      case 'ctas': return 'cta';
      case 'blocks': return 'block';
      case 'templates': return 'template';
      default: return 'introduction';
    }
  };

  const currentType = getContentType();

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conteúdo Padrão"
        subtitle="Gerencie suas introduções e CTAs reutilizáveis"
        icon={Library}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="introductions" className="data-[state=active]:bg-white">
              Introduções
            </TabsTrigger>
            <TabsTrigger value="ctas" className="data-[state=active]:bg-white">
              CTAs
            </TabsTrigger>
            <TabsTrigger value="blocks" className="data-[state=active]:bg-white gap-1.5">
              <Blocks className="w-3.5 h-3.5" />
              Blocos
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-white gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Templates
            </TabsTrigger>
          </TabsList>

          <Button onClick={handleNew} className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'introductions' && 'Nova Introdução'}
            {activeTab === 'ctas' && 'Novo CTA'}
            {activeTab === 'blocks' && 'Novo Bloco'}
            {activeTab === 'templates' && 'Novo Template'}
          </Button>
        </div>

        <TabsContent value="introductions" className="mt-0">
          {introductions.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Nenhuma introdução cadastrada"
              description="Crie suas introduções padrão para reutilizar nos roteiros"
              actionLabel="Criar Introdução"
              onAction={handleNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {introductions.map((item) => (
                <UserContentCard
                  key={item.id}
                  item={item}
                  type="introduction"
                  onEdit={() => handleEdit(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ctas" className="mt-0">
          {ctas.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Nenhum CTA cadastrado"
              description="Crie seus CTAs padrão para reutilizar nos roteiros"
              actionLabel="Criar CTA"
              onAction={handleNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ctas.map((item) => (
                <UserContentCard
                  key={item.id}
                  item={item}
                  type="cta"
                  onEdit={() => handleEdit(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocks" className="mt-0">
          {descriptionBlocks.length === 0 ? (
            <EmptyState
              icon={Blocks}
              title="Nenhum bloco cadastrado"
              description="Crie blocos reutilizáveis como links de redes sociais, ferramentas, patrocinadores"
              actionLabel="Criar Bloco"
              onAction={handleNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {descriptionBlocks.map((item) => (
                <UserContentCard
                  key={item.id}
                  item={item}
                  type="block"
                  onEdit={() => handleEdit(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          {descriptionTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum template cadastrado"
              description="Crie templates de descrição para YouTube com placeholders personalizados"
              actionLabel="Criar Template"
              onAction={handleNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {descriptionTemplates.map((item) => (
                <UserContentCard
                  key={item.id}
                  item={item}
                  type="template"
                  onEdit={() => handleEdit(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UserContentFormModal
        open={showModal}
        onOpenChange={handleCloseModal}
        item={editingItem}
        type={currentType}
      />
    </div>
  );
}