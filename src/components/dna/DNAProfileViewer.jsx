import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dna, X, Quote, Zap, MessageSquare, Target, 
  Swords, Brain, CheckCircle, XCircle, FileText,
  Sparkles, Copy, Download
} from "lucide-react";
import { toast } from "sonner";

function Section({ title, icon: Icon, items, renderItem }) {
  if (!items || items.length === 0) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="text-sm">
              {renderItem ? renderItem(item, i) : (
                <Badge variant="outline" className="mr-1 mb-1">{item}</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function generateDNAText(profile, sig) {
  let text = `DNA DE COMUNICAÇÃO: ${profile.title}\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  // Descrição
  if (sig.resumo_em_1_linha) {
    text += `📝 DESCRIÇÃO:\n"${sig.resumo_em_1_linha}"\n\n`;
  }
  
  // Tom
  if (sig.tom) {
    text += `🎯 TOM DE VOZ:\n`;
    text += `• Energia: ${sig.tom.energia}\n`;
    text += `• Direto: ${sig.tom.direto}\n`;
    text += `• Humor: ${sig.tom.humor}\n`;
    text += `• Formalidade: ${sig.tom.formalidade}\n`;
    text += `• Empatia: ${sig.tom.empatia}\n\n`;
  }
  
  // Bordões
  if (sig.bordoes_centrais?.length > 0) {
    text += `💬 BORDÕES CENTRAIS:\n`;
    sig.bordoes_centrais.forEach(b => text += `• "${b}"\n`);
    text += `\n`;
  }
  
  // Frases de Efeito
  if (sig.frases_de_efeito_centrais?.length > 0) {
    text += `⚡ FRASES DE EFEITO:\n`;
    sig.frases_de_efeito_centrais.forEach(f => text += `• "${f}"\n`);
    text += `\n`;
  }
  
  // Palavras Assinatura
  if (sig.palavras_assinatura?.length > 0) {
    text += `✍️ PALAVRAS ASSINATURA:\n`;
    text += sig.palavras_assinatura.join(', ') + '\n\n';
  }
  
  // Estruturas
  if (sig.estruturas_assinatura?.length > 0) {
    text += `📐 ESTRUTURAS ASSINATURA:\n`;
    sig.estruturas_assinatura.forEach(e => text += `• ${e}\n`);
    text += `\n`;
  }
  
  // CTAs
  if (sig.ctas_assinatura?.length > 0) {
    text += `🎯 CTAs ASSINATURA:\n`;
    sig.ctas_assinatura.forEach(c => text += `• ${c}\n`);
    text += `\n`;
  }
  
  // Anti-Heróis
  if (sig.anti_herois_centrais?.length > 0) {
    text += `⚔️ ANTI-HERÓIS CENTRAIS:\n`;
    sig.anti_herois_centrais.forEach(a => text += `• ${a}\n`);
    text += `\n`;
  }
  
  // Crenças
  if (sig.crencas_centrais?.length > 0) {
    text += `🧠 CRENÇAS CENTRAIS:\n`;
    sig.crencas_centrais.forEach(c => text += `• ${c}\n`);
    text += `\n`;
  }
  
  // Regras do Tom
  if (sig.regras_do_tom?.length > 0) {
    text += `✨ REGRAS DO TOM:\n`;
    sig.regras_do_tom.forEach(r => text += `• ${r}\n`);
    text += `\n`;
  }
  
  // DO / DON'T
  if (sig.do?.length > 0) {
    text += `✅ FAÇA:\n`;
    sig.do.forEach(d => text += `• ${d}\n`);
    text += `\n`;
  }
  
  if (sig.dont?.length > 0) {
    text += `❌ NÃO FAÇA:\n`;
    sig.dont.forEach(d => text += `• ${d}\n`);
    text += `\n`;
  }
  
  return text;
}

export default function DNAProfileViewer({ profile, onClose }) {
  const sig = profile.signature;
  const [copied, setCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);
  
  const handleCopy = () => {
    const text = generateDNAText(profile, sig);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleExport = () => {
    const text = generateDNAText(profile, sig);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DNA_${profile.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };
  
  if (!sig) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DNA não disponível</DialogTitle>
          </DialogHeader>
          <p>O perfil ainda não foi processado.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Dna className="w-5 h-5 text-white" />
              </div>
              {profile.title}
            </DialogTitle>
          </div>
          
          {sig.resumo_em_1_linha && (
            <p className="text-slate-600 italic mt-2">"{sig.resumo_em_1_linha}"</p>
          )}

          {/* Tom badges */}
          {sig.tom && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-indigo-100 text-indigo-700">
                Energia: {sig.tom.energia}
              </Badge>
              <Badge className="bg-purple-100 text-purple-700">
                Direto: {sig.tom.direto}
              </Badge>
              <Badge className="bg-amber-100 text-amber-700">
                Humor: {sig.tom.humor}
              </Badge>
              <Badge className="bg-green-100 text-green-700">
                Formalidade: {sig.tom.formalidade}
              </Badge>
              <Badge className="bg-pink-100 text-pink-700">
                Empatia: {sig.tom.empatia}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="completo" className="px-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="completo">DNA Completo</TabsTrigger>
            <TabsTrigger value="expressoes">Expressões</TabsTrigger>
            <TabsTrigger value="estruturas">Estruturas</TabsTrigger>
            <TabsTrigger value="crencas">Crenças</TabsTrigger>
            <TabsTrigger value="regras">Regras</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4 pr-4">
            <TabsContent value="completo" className="mt-0">
              <div className="space-y-4">
                {/* Botões de Ação */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={handleCopy} 
                    variant="outline" 
                    className={`flex-1 transition-all ${copied ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar DNA
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleExport} 
                    variant="outline" 
                    className={`flex-1 transition-all ${downloaded ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
                  >
                    {downloaded ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Baixado!
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar TXT
                      </>
                    )}
                  </Button>
                </div>

                {/* Descrição */}
                {sig.resumo_em_1_linha && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <h4 className="font-semibold text-indigo-800 mb-2">📝 Descrição</h4>
                    <p className="text-slate-700 italic">"{sig.resumo_em_1_linha}"</p>
                  </div>
                )}

                {/* Tom */}
                {sig.tom && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-3">🎯 Tom de Voz</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="bg-indigo-100 rounded p-2 text-center">
                        <p className="text-xs text-slate-500">Energia</p>
                        <p className="font-bold text-indigo-700">{sig.tom.energia}</p>
                      </div>
                      <div className="bg-purple-100 rounded p-2 text-center">
                        <p className="text-xs text-slate-500">Direto</p>
                        <p className="font-bold text-purple-700">{sig.tom.direto}</p>
                      </div>
                      <div className="bg-amber-100 rounded p-2 text-center">
                        <p className="text-xs text-slate-500">Humor</p>
                        <p className="font-bold text-amber-700">{sig.tom.humor}</p>
                      </div>
                      <div className="bg-green-100 rounded p-2 text-center">
                        <p className="text-xs text-slate-500">Formalidade</p>
                        <p className="font-bold text-green-700">{sig.tom.formalidade}</p>
                      </div>
                      <div className="bg-pink-100 rounded p-2 text-center">
                        <p className="text-xs text-slate-500">Empatia</p>
                        <p className="font-bold text-pink-700">{sig.tom.empatia}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bordões */}
                {sig.bordoes_centrais?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">💬 Bordões Centrais</h4>
                    <div className="flex flex-wrap gap-2">
                      {sig.bordoes_centrais.map((item, i) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700">"{item}"</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Frases de Efeito */}
                {sig.frases_de_efeito_centrais?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">⚡ Frases de Efeito</h4>
                    <div className="space-y-2">
                      {sig.frases_de_efeito_centrais.map((item, i) => (
                        <p key={i} className="text-slate-700 bg-amber-50 p-2 rounded border border-amber-100">"{item}"</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palavras Assinatura */}
                {sig.palavras_assinatura?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">✍️ Palavras Assinatura</h4>
                    <div className="flex flex-wrap gap-2">
                      {sig.palavras_assinatura.map((item, i) => (
                        <Badge key={i} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estruturas */}
                {sig.estruturas_assinatura?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">📐 Estruturas Assinatura</h4>
                    <ul className="space-y-1">
                      {sig.estruturas_assinatura.map((item, i) => (
                        <li key={i} className="text-slate-700 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTAs */}
                {sig.ctas_assinatura?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">🎯 CTAs Assinatura</h4>
                    <div className="flex flex-wrap gap-2">
                      {sig.ctas_assinatura.map((item, i) => (
                        <Badge key={i} className="bg-green-100 text-green-700">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anti-Heróis */}
                {sig.anti_herois_centrais?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">⚔️ Anti-Heróis Centrais</h4>
                    <div className="flex flex-wrap gap-2">
                      {sig.anti_herois_centrais.map((item, i) => (
                        <Badge key={i} variant="outline" className="border-red-200 text-red-700">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crenças */}
                {sig.crencas_centrais?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">🧠 Crenças Centrais</h4>
                    <ul className="space-y-2">
                      {sig.crencas_centrais.map((item, i) => (
                        <li key={i} className="text-slate-700 bg-purple-50 p-2 rounded text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Regras do Tom */}
                {sig.regras_do_tom?.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-slate-800 mb-2">✨ Regras do Tom</h4>
                    <ul className="space-y-1">
                      {sig.regras_do_tom.map((item, i) => (
                        <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DO / DON'T */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sig.do?.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <h4 className="font-semibold text-green-800 mb-2">✅ Faça</h4>
                      <ul className="space-y-1">
                        {sig.do.map((item, i) => (
                          <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sig.dont?.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <h4 className="font-semibold text-red-800 mb-2">❌ Não Faça</h4>
                      <ul className="space-y-1">
                        {sig.dont.map((item, i) => (
                          <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expressoes" className="space-y-4 mt-0">
              <Section
                title="Bordões Centrais"
                icon={Quote}
                items={sig.bordoes_centrais}
                renderItem={(item) => (
                  <Badge variant="secondary" className="mr-1 mb-1 bg-indigo-50 text-indigo-700">
                    "{item}"
                  </Badge>
                )}
              />
              
              <Section
                title="Frases de Efeito"
                icon={Zap}
                items={sig.frases_de_efeito_centrais}
                renderItem={(item) => (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 mb-2">
                    <p className="text-slate-800">"{item}"</p>
                  </div>
                )}
              />

              <Section
                title="Palavras Assinatura"
                icon={MessageSquare}
                items={sig.palavras_assinatura}
                renderItem={(item) => (
                  <Badge variant="outline" className="mr-1 mb-1">{item}</Badge>
                )}
              />
            </TabsContent>

            <TabsContent value="estruturas" className="space-y-4 mt-0">
              <Section
                title="Estruturas Assinatura"
                icon={FileText}
                items={sig.estruturas_assinatura}
                renderItem={(item) => (
                  <div className="p-2 bg-slate-50 rounded-lg border mb-2">
                    <p className="text-slate-700">{item}</p>
                  </div>
                )}
              />

              <Section
                title="CTAs Assinatura"
                icon={Target}
                items={sig.ctas_assinatura}
                renderItem={(item) => (
                  <Badge className="mr-1 mb-1 bg-green-100 text-green-700">{item}</Badge>
                )}
              />

              <Section
                title="Anti-Heróis Centrais"
                icon={Swords}
                items={sig.anti_herois_centrais}
                renderItem={(item) => (
                  <Badge variant="outline" className="mr-1 mb-1 border-red-200 text-red-700">{item}</Badge>
                )}
              />
            </TabsContent>

            <TabsContent value="crencas" className="space-y-4 mt-0">
              <Section
                title="Crenças Centrais"
                icon={Brain}
                items={sig.crencas_centrais}
                renderItem={(item) => (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 mb-2">
                    <p className="text-slate-800">{item}</p>
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="regras" className="space-y-4 mt-0">
              <Section
                title="Regras do Tom"
                icon={Sparkles}
                items={sig.regras_do_tom}
                renderItem={(item) => (
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section
                  title="DO (Faça)"
                  icon={CheckCircle}
                  items={sig.do}
                  renderItem={(item) => (
                    <div className="flex items-start gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-slate-700 text-sm">{item}</p>
                    </div>
                  )}
                />

                <Section
                  title="DON'T (Não Faça)"
                  icon={XCircle}
                  items={sig.dont}
                  renderItem={(item) => (
                    <div className="flex items-start gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-slate-700 text-sm">{item}</p>
                    </div>
                  )}
                />
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        <div className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}