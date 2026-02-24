import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package, Plus, Pencil, Trash2, Sparkles, GraduationCap, Users, BookOpen, MessageSquare, Clock, ShoppingBag, FileText, Calendar, HelpCircle, Eye, Power, Settings, Brain, Keyboard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFocusData } from "@/components/hooks/useFocusData";
import { useEntityCRUD } from "@/components/hooks/useEntityCRUD";
import PageHeader from "@/components/common/PageHeader";
import InfoCard from "@/components/common/InfoCard";
import EmptyState from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/LoadingSkeleton";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";


const PRODUCT_TYPES = [
  { value: "Curso", icon: GraduationCap },
  { value: "Mentoria", icon: Users },
  { value: "Aulas", icon: BookOpen },
  { value: "Consulta", icon: MessageSquare },
  { value: "Sessão", icon: Clock },
  { value: "Produto", icon: ShoppingBag },
  { value: "Arquivos", icon: FileText },
  { value: "Evento", icon: Calendar },
  { value: "Outro", icon: HelpCircle }
];

const PRICE_TYPES = ["Grátis", "Mensal", "Pagamento Único"];

const EMPTY_FORM = {
  type: "Curso",
  name: "",
  description: "",
  benefits: "",
  problem_solved: "",
  price_type: "Pagamento Único",
  price: "",
  is_active: true
};

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewProduct, setViewProduct] = useState(null);
  
  const [showCreationType, setShowCreationType] = useState(false);
  
  const navigate = useNavigate();

  const { data: products, isLoading, selectedFocusId } = useFocusData('Product', 'products');
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const { save, remove, isSaving } = useEntityCRUD('Product', 'products', {
    onSaveSuccess: handleClose,
    saveSuccessMessage: editingId ? "Produto atualizado!" : "Produto criado!",
    deleteSuccessMessage: "Produto removido!"
  });

  const handleOpen = useCallback((product = null) => {
    if (product) {
      setEditingId(product.id);
      setForm({
        type: product.type || "Curso",
        name: product.name || "",
        description: product.description || "",
        benefits: product.benefits || "",
        problem_solved: product.problem_solved || "",
        price_type: product.price_type || "Pagamento Único",
        price: product.price || "",
        is_active: product.is_active !== false
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setIsOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const data = editingId ? form : { ...form, focus_id: selectedFocusId };
    save(editingId, data);
  }, [form, editingId, selectedFocusId, save]);

  const getTypeIcon = (type) => {
    const found = PRODUCT_TYPES.find(t => t.value === type);
    return found ? found.icon : Package;
  };

  const formatPrice = (product) => {
    if (product.price_type === "Grátis") return "Grátis";
    if (!product.price) return product.price_type;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
    return product.price_type === "Mensal" ? `${formatted}/mês` : formatted;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Produtos" subtitle="Carregando..." icon={Package} />
        <ListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Produtos" 
        subtitle="Cadastre o que você oferece ao seu público"
        icon={Package}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowCreationType(true)} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </div>
        }
      />

      <InfoCard 
        icon={Sparkles}
        title="Por que cadastrar seus produtos?"
        description="Ter seus produtos cadastrados ajuda a IA a criar conteúdo direcionado para venda, destacando benefícios e solucionando dores do público."
        variant="purple"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              icon={Package}
              description="Nenhum produto cadastrado ainda"
              actionLabel="Criar primeiro produto"
              onAction={() => handleOpen()}
            />
          </div>
        ) : (
          products.map((product) => {
          const TypeIcon = getTypeIcon(product.type);
          const isActive = product.is_active !== false;

          return (
          <Card key={product.id} className={`hover:shadow-md transition-shadow ${!isActive ? 'opacity-70' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                    <TypeIcon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{product.type}</Badge>
                      {!isActive && (
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">Inativo</Badge>
                      )}
                      {isActive && (
                         <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                    onClick={() => setViewProduct(product)}
                    title="Visualizar Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600" 
                    onClick={() => handleOpen(product)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={() => remove(product.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2 h-10">{product.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-slate-500">{product.price_type}</span>
                <span className="font-semibold text-indigo-600">{formatPrice(product)}</span>
              </div>
            </CardContent>
          </Card>
          );
          })
        )}
      </div>

      {/* Modal Seleção Tipo Criação */}
      <Dialog open={showCreationType} onOpenChange={setShowCreationType}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold">Como deseja cadastrar seu produto?</DialogTitle>
            <DialogDescription className="text-base">Escolha a melhor forma para adicionar seu produto agora.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Opção Manual */}
            <div 
              onClick={() => { setShowCreationType(false); handleOpen(); }}
              className="group cursor-pointer relative overflow-hidden rounded-xl border-2 border-slate-100 bg-white p-6 hover:border-indigo-600 hover:shadow-xl transition-all duration-300"
            >
              <div className="mb-4 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Keyboard className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Manualmente</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Preencha os dados do seu produto (nome, descrição, preço) você mesmo, se já tiver tudo definido.
              </p>
              <div className="mt-6 flex items-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Começar agora <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Opção com IA */}
            <div 
              onClick={() => { setShowCreationType(false); navigate(createPageUrl('ProductAnalyzer')); }}
              className="group cursor-pointer relative overflow-hidden rounded-xl border-2 border-indigo-50 bg-indigo-50/30 p-6 hover:border-pink-500 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-0">Recomendado</Badge>
              </div>
              <div className="mb-4 bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Com Inteligência Artificial</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nossa IA analisa seu produto e ajuda a extrair os melhores benefícios e argumentos de venda.
              </p>
              <div className="mt-6 flex items-center text-pink-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Iniciar Analisador <Sparkles className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription>Cadastre o que você oferece ao seu público.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Top Section: Active Switch + Name */}
            <div className="flex flex-col gap-6">
              {/* Active Switch */}
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-900">Status do Produto</span>
                  <span className="text-xs text-slate-500">Defina se este produto deve ser considerado nas análises de IA.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${form.is_active !== false ? 'text-green-600' : 'text-slate-400'}`}>
                    {form.is_active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    checked={form.is_active !== false}
                    onCheckedChange={(checked) => setForm({...form, is_active: checked})}
                  />
                </div>
              </div>

              {/* Name Input - Prominent */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Nome do Produto *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Curso Completo de Marketing Digital"
                  className="text-lg py-6 bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Grid for details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Tipo de Produto *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger className="h-11 bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4 text-slate-500" />
                            {type.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Modelo de Preço</Label>
                    <Select value={form.price_type} onValueChange={(v) => setForm({...form, price_type: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.price_type !== "Grátis" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Valor (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                        <Input 
                          type="number"
                          value={form.price} 
                          onChange={(e) => setForm({...form, price: e.target.value})}
                          placeholder="0,00"
                          className="h-11 pl-9 bg-white border-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Descrição</Label>
                  <Textarea 
                    value={form.description} 
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Descreva seu produto em detalhes..."
                    className="min-h-[140px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Right Column: Deep Dive */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Benefícios Principais</Label>
                  <Textarea 
                    value={form.benefits} 
                    onChange={(e) => setForm({...form, benefits: e.target.value})}
                    placeholder="O que o cliente ganha com isso? Liste os principais ganhos."
                    className="min-h-[140px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Problema que Resolve</Label>
                  <Textarea 
                    value={form.problem_solved} 
                    onChange={(e) => setForm({...form, problem_solved: e.target.value})}
                    placeholder="Qual dor específica esse produto elimina?"
                    className="min-h-[140px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t sticky bottom-0">
            <Button variant="ghost" onClick={handleClose} className="hover:bg-slate-200">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8">
              {isSaving ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* View Modal */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewProduct && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-indigo-50`}>
                    {React.createElement(getTypeIcon(viewProduct.type), { className: "w-6 h-6 text-indigo-600" })}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{viewProduct.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{viewProduct.type}</Badge>
                      <Badge variant={viewProduct.is_active !== false ? "default" : "secondary"} className={viewProduct.is_active !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                        {viewProduct.is_active !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {viewProduct.description && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <FileText className="w-4 h-4" /> Descrição
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed border border-slate-100 whitespace-pre-wrap">
                      {viewProduct.description}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {viewProduct.benefits && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Sparkles className="w-4 h-4" /> Benefícios
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed border border-slate-100 h-full whitespace-pre-wrap">
                        {viewProduct.benefits}
                      </div>
                    </div>
                  )}

                  {viewProduct.problem_solved && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Users className="w-4 h-4" /> Problema que Resolve
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed border border-slate-100 h-full whitespace-pre-wrap">
                        {viewProduct.problem_solved}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="text-sm text-slate-500">
                    Preço: <span className="font-semibold text-indigo-600 text-base ml-1">{formatPrice(viewProduct)}</span>
                  </div>
                  <Button variant="outline" onClick={() => { setViewProduct(null); handleOpen(viewProduct); }}>
                    <Pencil className="w-4 h-4 mr-2" /> Editar Produto
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}