import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Sparkles, 
  FileText, 
  Bot,
  Database,
  Wand2,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const GENERATION_STEPS = [
  { id: 'collect', icon: Database, label: 'Coletando informações...', duration: 8000 },
  { id: 'analyze', icon: Search, label: 'Analisando contexto e dados...', duration: 9000 },
  { id: 'identify', icon: Brain, label: 'Identificando melhor estilo...', duration: 9000 },
  { id: 'build', icon: FileText, label: 'Construindo prompt otimizado...', duration: 9000 },
  { id: 'refine', icon: Wand2, label: 'Refinando com IA especialista...', duration: 10000 },
  { id: 'send', icon: Bot, label: 'Enviando para os Agentes...', duration: 9000 },
  { id: 'research', icon: Search, label: 'Agentes pesquisando...', duration: 12000 },
  { id: 'thinking', icon: Brain, label: 'Agentes analisando e criando...', duration: 14000 },
  { id: 'writing', icon: Sparkles, label: 'Escrevendo scripts magnéticos...', duration: 16000 },
  { id: 'optimizing', icon: Sparkles, label: 'Otimizando seu conteúdo...', duration: 5000 },
];

export default function GenerationLoadingScreen({ isGenerating, currentStatus }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Auto-advance steps based on timing
  useEffect(() => {
    if (!isGenerating) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
      return;
    }

    const step = GENERATION_STEPS[currentStepIndex];
    if (!step) return;

    const timer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, step.id]);
      if (currentStepIndex < GENERATION_STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }, step.duration);

    return () => clearTimeout(timer);
  }, [isGenerating, currentStepIndex]);

  // Reset when generation starts
  useEffect(() => {
    if (isGenerating) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
    }
  }, [isGenerating]);

  // Jump to optimizing step if status matches
  useEffect(() => {
    if (currentStatus === 'Otimizando seu conteúdo...') {
      const optIndex = GENERATION_STEPS.findIndex(s => s.id === 'optimizing');
      if (optIndex !== -1) {
        setCurrentStepIndex(optIndex);
        setCompletedSteps(GENERATION_STEPS.slice(0, optIndex).map(s => s.id));
      }
    }
  }, [currentStatus]);

  if (!isGenerating) return null;

  const currentStep = GENERATION_STEPS[currentStepIndex];
  const CurrentIcon = currentStep?.icon || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-400/20 rounded-full"
            initial={{ 
              x: Math.random() * 800, 
              y: Math.random() * 600,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              opacity: [0.2, 0]
            }}
            transition={{ 
              duration: Math.random() * 4 + 3, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-lg px-6">
        
        {/* Animated Icon */}
        <motion.div
          className="relative mb-8"
          animate={{ 
            scale: [1, 1.03, 1],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-pink-200/50 rounded-full blur-3xl scale-150" />
          
          {/* Icon Container */}
          <motion.div 
            className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-2xl shadow-xl shadow-pink-300/40"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CurrentIcon className="w-12 h-12 text-white" />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Orbiting Elements */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 bg-pink-300 rounded-full"
              style={{ 
                top: '50%', 
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * 2.094) * 55, 0],
                y: [0, Math.sin(i * 2.094) * 55, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Current Step Label */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentStep?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-xl font-semibold text-slate-800 mb-4 text-center"
          >
            {currentStep?.label}
          </motion.h2>
        </AnimatePresence>

        {/* Progress Steps */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md">
          {GENERATION_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStepIndex === idx;
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  opacity: isCurrent || isCompleted ? 1 : 0.3
                }}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${isCompleted 
                    ? 'bg-emerald-500' 
                    : isCurrent 
                      ? 'bg-pink-500 ring-2 ring-pink-200 ring-offset-2 ring-offset-white' 
                      : 'bg-slate-200'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <StepIcon className="w-4 h-4 text-slate-400" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Subtitle */}
        <motion.p 
          className="text-slate-500 text-sm text-center"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Múltiplas IAs trabalhando em paralelo para você...
        </motion.p>

        {/* Loading Bar */}
        <div className="w-full max-w-xs mt-6 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${((currentStepIndex + 1) / GENERATION_STEPS.length) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Models Info */}
        <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs">
          <Bot className="w-4 h-4" />
          <span>Aguarde enquanto os agentes processam seu conteúdo</span>
        </div>
      </div>
    </motion.div>
  );
}