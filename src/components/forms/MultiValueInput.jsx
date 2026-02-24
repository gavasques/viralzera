import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MultiValueInput({ 
  label, 
  placeholder, 
  values = [], 
  onChange, 
  icon: Icon 
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onChange([...values, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(e);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        {label}
        <span className="text-slate-400 font-normal ml-auto text-xs">{values.length} itens</span>
      </label>
      
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-white border-slate-200 focus:border-indigo-500 transition-colors"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          variant="secondary"
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {values.map((item, index) => (
            <motion.div
              key={`${item}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all"
            >
              <div className="text-slate-400 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-700 flex-1 break-words">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {values.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-400 italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            Nenhum item adicionado ainda
          </div>
        )}
      </div>
    </div>
  );
}