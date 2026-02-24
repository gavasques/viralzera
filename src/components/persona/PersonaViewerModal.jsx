import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Copy, Download, CheckCircle, Quote, Target, 
  Swords, Brain, Briefcase, Heart, BookOpen, Mic
} from "lucide-react";

function Section({ title, icon: Icon, children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`bg-slate-50 rounded-lg p-4 border ${className}`}>
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-600" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

function generatePersonaText(persona) {
  let text = `PERSONA: ${persona.name}\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  if (persona.who_am_i) {
    text += `📝 QUEM SOU EU:\n${persona.who_am_i}\n\n`;
  }
  
  if (persona.hobbies?.length > 0) {
    text += `🎯 HOBBIES E INTERESSES:\n`;
    persona.hobbies.forEach(h => text += `• ${h}\n`);
    text += `\n`;
  }
  
  if (persona.story) {
    text += `📖 MINHA HISTÓRIA:\n`;
    if (persona.story.origem_e_contexto) {
      text += `Origem: ${persona.story.origem_e_contexto}\n`;
    }
    if (persona.story.linha_do_tempo?.length > 0) {
      text += `\nLinha do Tempo:\n`;
      persona.story.linha_do_tempo.forEach(e => {
        text += `• ${e.evento} (${e.idade_ou_periodo})\n`;
        if (e.licao) text += `  Lição: ${e.licao}\n`;
      });
    }
    text += `\n`;
  }
  
  if (persona.skills) {
    text += `💼 HABILIDADES:\n`;
    if (persona.skills.habilidades_fortes?.length > 0) {
      persona.skills.habilidades_fortes.forEach(h => text += `• ${h}\n`);
    }
    text += `\n`;
  }
  
  if (persona.tone_of_voice) {
    text += `🎤 TOM DE VOZ:\n`;
    if (persona.tone_of_voice.descricao) {
      text += `${persona.tone_of_voice.descricao}\n`;
    }
    if (persona.tone_of_voice.palavras_e_expressoes_frequentes?.length > 0) {
      text += `\nExpressões: ${persona.tone_of_voice.palavras_e_expressoes_frequentes.join(', ')}\n`;
    }
    text += `\n`;
  }
  
  if (persona.thoughts_phrases) {
    text += `💬 FRASES E BORDÕES:\n`;
    if (persona.thoughts_phrases.frases_reais?.length > 0) {
      persona.thoughts_phrases.frases_reais.forEach(f => text += `• "${f}"\n`);
    }
    if (persona.thoughts_phrases.bordoes?.length > 0) {
      text += `\nBordões: ${persona.thoughts_phrases.bordoes.join(', ')}\n`;
    }
    text += `\n`;
  }
  
  if (persona.hatred_list?.length > 0) {
    text += `⚔️ O QUE ODEIO (ANTI-HERÓIS):\n`;
    persona.hatred_list.forEach(h => {
      text += `• ${h.alvo}: ${h.por_que_me_irrita}\n`;
    });
    text += `\n`;
  }
  
  if (persona.beliefs) {
    text += `🧠 CRENÇAS:\n`;
    Object.entries(persona.beliefs).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        text += `\n${key.toUpperCase()}:\n`;
        values.forEach(v => text += `• ${v}\n`);
      }
    });
    text += `\n`;
  }
  
  if (persona.values) {
    text += `❤️ VALORES:\n`;
    if (persona.values.nao_negociaveis?.length > 0) {
      text += `Não Negociáveis: ${persona.values.nao_negociaveis.join(', ')}\n`;
    }
    if (persona.values.nao_tolero?.length > 0) {
      text += `Não Tolero: ${persona.values.nao_tolero.join(', ')}\n`;
    }
    text += `\n`;
  }
  
  if (persona.objectives) {
    text += `🎯 OBJETIVOS:\n`;
    if (persona.objectives.em_12_meses) text += `• 12 meses: ${persona.objectives.em_12_meses}\n`;
    if (persona.objectives.em_3_anos) text += `• 3 anos: ${persona.objectives.em_3_anos}\n`;
    if (persona.objectives.em_10_anos) text += `• 10 anos: ${persona.objectives.em_10_anos}\n`;
    text += `\n`;
  }
  
  if (persona.identity?.length > 0) {
    text += `🪪 IDENTIDADE:\n`;
    persona.identity.forEach(i => text += `• ${i}\n`);
  }
  
  return text;
}

export default function PersonaViewerModal({ persona, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  
  const handleCopy = () => {
    const text = generatePersonaText(persona);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleExport = () => {
    const text = generatePersonaText(persona);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Persona_${persona.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // Check if this is a structured persona (from AI) or simple persona
  const isStructured = persona.story && typeof persona.story === 'object';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <User className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl">{persona.name}</DialogTitle>
          </div>
          
          {persona.who_am_i && (
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">{persona.who_am_i}</p>
          )}
        </DialogHeader>

        <div className="px-6 pb-2 flex gap-2">
          <Button 
            onClick={handleCopy} 
            variant="outline" 
            size="sm"
            className={`transition-all ${copied ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
          >
            {copied ? <><CheckCircle className="w-4 h-4 mr-1" /> Copiado!</> : <><Copy className="w-4 h-4 mr-1" /> Copiar</>}
          </Button>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            size="sm"
            className={`transition-all ${downloaded ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
          >
            {downloaded ? <><CheckCircle className="w-4 h-4 mr-1" /> Baixado!</> : <><Download className="w-4 h-4 mr-1" /> Exportar TXT</>}
          </Button>
        </div>

        <ScrollArea className="h-[60vh] px-6">
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="historia">História</TabsTrigger>
              <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4 mt-0">
              {/* Hobbies */}
              {persona.hobbies?.length > 0 && (
                <Section title="Hobbies & Interesses" icon={Heart}>
                  <div className="flex flex-wrap gap-2">
                    {persona.hobbies.map((h, i) => (
                      <Badge key={i} variant="secondary">{h}</Badge>
                    ))}
                  </div>
                </Section>
              )}

              {/* Skills */}
              {persona.skills?.habilidades_fortes?.length > 0 && (
                <Section title="Habilidades" icon={Briefcase}>
                  <ul className="space-y-1">
                    {persona.skills.habilidades_fortes.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700">• {s}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Identity */}
              {persona.identity?.length > 0 && (
                <Section title="Identidade" icon={User}>
                  <div className="space-y-2">
                    {persona.identity.map((id, i) => (
                      <p key={i} className="text-sm text-slate-700 italic bg-indigo-50 p-2 rounded">"{id}"</p>
                    ))}
                  </div>
                </Section>
              )}

              {/* Objectives */}
              {persona.objectives && (
                <Section title="Objetivos" icon={Target}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {persona.objectives.em_12_meses && (
                      <div className="bg-green-50 rounded p-3">
                        <p className="text-xs text-slate-500 mb-1">12 meses</p>
                        <p className="text-sm text-slate-700">{persona.objectives.em_12_meses}</p>
                      </div>
                    )}
                    {persona.objectives.em_3_anos && (
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-xs text-slate-500 mb-1">3 anos</p>
                        <p className="text-sm text-slate-700">{persona.objectives.em_3_anos}</p>
                      </div>
                    )}
                    {persona.objectives.em_10_anos && (
                      <div className="bg-purple-50 rounded p-3">
                        <p className="text-xs text-slate-500 mb-1">10 anos</p>
                        <p className="text-sm text-slate-700">{persona.objectives.em_10_anos}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </TabsContent>

            <TabsContent value="historia" className="space-y-4 mt-0">
              {persona.story && typeof persona.story === 'object' && (
                <>
                  {persona.story.origem_e_contexto && (
                    <Section title="Origem" icon={BookOpen}>
                      <p className="text-sm text-slate-700">{persona.story.origem_e_contexto}</p>
                    </Section>
                  )}

                  {persona.story.linha_do_tempo?.length > 0 && (
                    <Section title="Linha do Tempo" icon={BookOpen}>
                      <div className="space-y-4">
                        {persona.story.linha_do_tempo.map((evento, i) => (
                          <div key={i} className="border-l-2 border-indigo-300 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{evento.idade_ou_periodo}</Badge>
                              <span className="font-medium text-slate-900">{evento.evento}</span>
                            </div>
                            {evento.contexto && <p className="text-sm text-slate-600">{evento.contexto}</p>}
                            {evento.virada && <p className="text-sm text-amber-700 mt-1">↪ {evento.virada}</p>}
                            {evento.licao && <p className="text-sm text-green-700 mt-1 italic">💡 {evento.licao}</p>}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {persona.story.momentos_de_orgulho?.length > 0 && (
                    <Section title="Momentos de Orgulho" icon={Heart} className="bg-green-50 border-green-100">
                      <ul className="space-y-1">
                        {persona.story.momentos_de_orgulho.map((m, i) => (
                          <li key={i} className="text-sm text-green-800">✓ {m}</li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {persona.story.momentos_de_quebra?.length > 0 && (
                    <Section title="Momentos de Quebra" icon={Swords} className="bg-red-50 border-red-100">
                      <ul className="space-y-1">
                        {persona.story.momentos_de_quebra.map((m, i) => (
                          <li key={i} className="text-sm text-red-800">• {m}</li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </>
              )}

              {/* Fallback for string story */}
              {persona.story && typeof persona.story === 'string' && (
                <Section title="Minha História" icon={BookOpen}>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{persona.story}</p>
                </Section>
              )}
            </TabsContent>

            <TabsContent value="comunicacao" className="space-y-4 mt-0">
              {/* Tom de Voz */}
              {persona.tone_of_voice && (
                <Section title="Tom de Voz" icon={Mic}>
                  {persona.tone_of_voice.descricao && (
                    <p className="text-sm text-slate-700 mb-3">{persona.tone_of_voice.descricao}</p>
                  )}
                  {persona.tone_of_voice.palavras_e_expressoes_frequentes?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {persona.tone_of_voice.palavras_e_expressoes_frequentes.map((p, i) => (
                        <Badge key={i} className="bg-indigo-100 text-indigo-700">{p}</Badge>
                      ))}
                    </div>
                  )}
                  {persona.tone_of_voice.jeito_de_escrever && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {persona.tone_of_voice.jeito_de_escrever.nivel_de_direto && (
                        <div><span className="text-slate-500">Direto:</span> {persona.tone_of_voice.jeito_de_escrever.nivel_de_direto}</div>
                      )}
                      {persona.tone_of_voice.jeito_de_escrever.humor && (
                        <div><span className="text-slate-500">Humor:</span> {persona.tone_of_voice.jeito_de_escrever.humor}</div>
                      )}
                    </div>
                  )}
                </Section>
              )}

              {/* Frases e Bordões */}
              {persona.thoughts_phrases && (
                <>
                  {persona.thoughts_phrases.frases_reais?.length > 0 && (
                    <Section title="Frases Marcantes" icon={Quote}>
                      <div className="space-y-2">
                        {persona.thoughts_phrases.frases_reais.map((f, i) => (
                          <p key={i} className="text-sm bg-amber-50 p-2 rounded border border-amber-100">"{f}"</p>
                        ))}
                      </div>
                    </Section>
                  )}

                  {persona.thoughts_phrases.bordoes?.length > 0 && (
                    <Section title="Bordões" icon={Quote}>
                      <div className="flex flex-wrap gap-2">
                        {persona.thoughts_phrases.bordoes.map((b, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">"{b}"</Badge>
                        ))}
                      </div>
                    </Section>
                  )}
                </>
              )}

              {/* Anti-Heróis */}
              {persona.hatred_list?.length > 0 && (
                <Section title="O Que Odeio (Anti-Heróis)" icon={Swords} className="bg-red-50 border-red-100">
                  <div className="space-y-3">
                    {persona.hatred_list.map((h, i) => (
                      <div key={i} className="bg-white rounded p-3 border border-red-200">
                        <p className="font-medium text-red-800">{h.alvo}</p>
                        {h.por_que_me_irrita && <p className="text-sm text-slate-600 mt-1">{h.por_que_me_irrita}</p>}
                        {h.exemplo_real && <p className="text-xs text-slate-500 mt-1 italic">Ex: {h.exemplo_real}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </TabsContent>

            <TabsContent value="valores" className="space-y-4 mt-0">
              {/* Crenças */}
              {persona.beliefs && Object.keys(persona.beliefs).length > 0 && (
                <Section title="Crenças" icon={Brain}>
                  <div className="space-y-3">
                    {Object.entries(persona.beliefs).map(([key, values]) => {
                      if (!Array.isArray(values) || values.length === 0) return null;
                      return (
                        <div key={key} className="bg-purple-50 rounded p-3">
                          <p className="text-xs font-semibold text-purple-700 uppercase mb-2">{key}</p>
                          <ul className="space-y-1">
                            {values.map((v, i) => (
                              <li key={i} className="text-sm text-slate-700">• {v}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Valores */}
              {persona.values && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.values.nao_negociaveis?.length > 0 && (
                    <Section title="Valores Não Negociáveis" icon={Heart} className="bg-green-50 border-green-100">
                      <div className="flex flex-wrap gap-2">
                        {persona.values.nao_negociaveis.map((v, i) => (
                          <Badge key={i} className="bg-green-100 text-green-700">{v}</Badge>
                        ))}
                      </div>
                    </Section>
                  )}

                  {persona.values.nao_tolero?.length > 0 && (
                    <Section title="O Que Não Tolero" icon={Swords} className="bg-red-50 border-red-100">
                      <div className="flex flex-wrap gap-2">
                        {persona.values.nao_tolero.map((v, i) => (
                          <Badge key={i} variant="outline" className="border-red-200 text-red-700">{v}</Badge>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}