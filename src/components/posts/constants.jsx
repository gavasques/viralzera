import { Lightbulb, PenLine, CheckCircle, Calendar, Rocket } from "lucide-react";

export const COLUMNS = [
  { id: 'idea', slug: 'idea', title: 'Ideias', icon: Lightbulb, color: 'bg-amber-500', bgLight: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'writing', slug: 'writing', title: 'Em Criação', icon: PenLine, color: 'bg-blue-500', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'review', slug: 'review', title: 'Revisão', icon: CheckCircle, color: 'bg-purple-500', bgLight: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'scheduled', slug: 'scheduled', title: 'Agendado', icon: Calendar, color: 'bg-indigo-500', bgLight: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { id: 'published', slug: 'published', title: 'Publicado', icon: Rocket, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' },
];

export const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

export const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube'];

export const STATUS_OPTIONS = [
  { value: 'idea', label: 'Ideia', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'writing', label: 'Em Criação', icon: PenLine, color: 'text-blue-500' },
  { value: 'review', label: 'Revisão', icon: CheckCircle, color: 'text-purple-500' },
  { value: 'scheduled', label: 'Agendado', icon: Calendar, color: 'text-indigo-500' },
  { value: 'published', label: 'Publicado', icon: Rocket, color: 'text-emerald-500' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

export const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  post_type_id: "all",
  platform: "all",
  show_completed: false
};

export const DEFAULT_POST_FORM = {
  title: '',
  content: '',
  status: 'idea',
  post_type_id: '',
  platform: '',
  priority: 'medium',
  scheduled_date: null,
  notes: ''
};