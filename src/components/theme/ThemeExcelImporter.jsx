import React, { useState, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Parse CSV content
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const rows = [];
  
  for (const line of lines) {
    // Handle quoted values and commas
    const cells = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    
    rows.push({
      col1: cells[0] || '',
      col2: cells[1] || '',
      col3: cells[2] || ''
    });
  }
  
  return rows;
}

export default function ThemeExcelImporter({ focusId, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only accept CSV files
    if (!file.name.match(/\.csv$/i)) {
      toast.error("Por favor, selecione um arquivo CSV. Exporte sua planilha Excel como CSV primeiro.");
      return;
    }

    setIsProcessing(true);

    try {
      // Read file content directly
      const text = await file.text();
      const allRows = parseCSV(text);
      
      // Skip header row (first row)
      const rows = allRows.slice(1);
      
      // Build hierarchy - using Maps to avoid duplicates
      const level1Map = new Map(); // title -> { title, level, children: Map }
      let currentLevel1 = null;
      let currentLevel2 = null;

      for (const row of rows) {
        const level1Value = row.col1?.trim();
        const level2Value = row.col2?.trim();
        const level3Value = row.col3?.trim();

        // Level 1 - only create if not exists
        if (level1Value) {
          if (!level1Map.has(level1Value)) {
            level1Map.set(level1Value, { title: level1Value, level: 1, childrenMap: new Map() });
          }
          currentLevel1 = level1Map.get(level1Value);
          currentLevel2 = null;
        }

        // Level 2 - only create if not exists within current Level 1
        if (level2Value && currentLevel1) {
          if (!currentLevel1.childrenMap.has(level2Value)) {
            currentLevel1.childrenMap.set(level2Value, { title: level2Value, level: 2, parent: currentLevel1.title, childrenSet: new Set() });
          }
          currentLevel2 = currentLevel1.childrenMap.get(level2Value);
        }

        // Level 3 - only add if not exists within current Level 2
        if (level3Value && currentLevel2) {
          currentLevel2.childrenSet.add(level3Value);
        }
      }

      // Convert Maps to arrays for preview
      const themesToCreate = Array.from(level1Map.values()).map(l1 => ({
        title: l1.title,
        level: 1,
        children: Array.from(l1.childrenMap.values()).map(l2 => ({
          title: l2.title,
          level: 2,
          parent: l2.parent,
          children: Array.from(l2.childrenSet).map(title => ({ title, level: 3, parent: l2.title }))
        }))
      }));

      setPreview(themesToCreate);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar arquivo: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;

    setIsProcessing(true);

    try {
      const createdMap = {};
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Create Level 1 themes
      for (const theme of preview) {
        const created = await base44.entities.Theme.create({
          title: theme.title,
          level: 1,
          focus_id: focusId,
          parent_id: null
        });
        createdMap[theme.title] = created.id;
        await delay(100); // Rate limit protection

        // Create Level 2 themes
        for (const child of theme.children) {
          const createdChild = await base44.entities.Theme.create({
            title: child.title,
            level: 2,
            focus_id: focusId,
            parent_id: created.id
          });
          createdMap[`${theme.title}>${child.title}`] = createdChild.id;
          await delay(100);

          // Create Level 3 themes
          for (const grandChild of child.children) {
            await base44.entities.Theme.create({
              title: grandChild.title,
              level: 3,
              focus_id: focusId,
              parent_id: createdChild.id
            });
            await delay(100);
          }
        }
      }

      const totalCount = preview.reduce((acc, t) => {
        return acc + 1 + t.children.reduce((acc2, c) => acc2 + 1 + c.children.length, 0);
      }, 0);

      toast.success(`${totalCount} temas importados com sucesso!`);
      setIsOpen(false);
      setPreview(null);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao importar temas: " + (err.message || "Tente novamente"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Count totals
  const totalLevel1 = preview?.length || 0;
  const totalLevel2 = preview?.reduce((acc, t) => acc + t.children.length, 0) || 0;
  const totalLevel3 = preview?.reduce((acc, t) => acc + t.children.reduce((acc2, c) => acc2 + c.children.length, 0), 0) || 0;

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" /> Importar Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Importar Matriz de Temas
            </DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV com 3 colunas: Nível 1, Nível 2, Nível 3. 
              Exporte sua planilha Excel como CSV. A primeira linha (cabeçalho) será ignorada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {!preview ? (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-300 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <p className="text-slate-600">Processando arquivo...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full">
                        <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Clique para selecionar arquivo</p>
                        <p className="text-sm text-slate-500 mt-1">Arquivo CSV (exporte sua planilha como CSV)</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-800">Arquivo processado com sucesso!</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      {totalLevel1} temas nível 1 • {totalLevel2} temas nível 2 • {totalLevel3} temas nível 3
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 border-b sticky top-0">
                    <p className="text-sm font-medium text-slate-600">Preview da importação</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {preview.map((level1, idx1) => (
                      <div key={idx1} className="text-sm">
                        <div className="font-medium text-indigo-700 flex items-center gap-1">
                          <span className="w-5 h-5 bg-indigo-100 rounded text-xs flex items-center justify-center">1</span>
                          {level1.title}
                        </div>
                        {level1.children.map((level2, idx2) => (
                          <div key={idx2} className="ml-6 mt-1">
                            <div className="text-amber-700 flex items-center gap-1">
                              <span className="w-5 h-5 bg-amber-100 rounded text-xs flex items-center justify-center">2</span>
                              {level2.title}
                            </div>
                            {level2.children.map((level3, idx3) => (
                              <div key={idx3} className="ml-6 mt-1 text-emerald-700 flex items-center gap-1">
                                <span className="w-5 h-5 bg-emerald-100 rounded text-xs flex items-center justify-center">3</span>
                                {level3.title}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {preview.length === 0 && (
                  <div className="flex gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Nenhum tema encontrado</p>
                      <p className="text-sm text-amber-700">Verifique se o arquivo possui dados nas 3 primeiras colunas.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            {preview && preview.length > 0 && (
              <Button 
                onClick={handleImport} 
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</>
                ) : (
                  <>Importar {totalLevel1 + totalLevel2 + totalLevel3} Temas</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}