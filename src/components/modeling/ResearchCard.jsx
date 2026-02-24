import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Calendar, Hash, ExternalLink, Trash2, Eye } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ResearchCard({ research, onDelete }) {
  const [showFull, setShowFull] = React.useState(false);

  return (
    <>
      <Card className="h-full flex flex-col">
         <CardHeader className="pb-2">
           <div className="flex justify-between items-start gap-2">
               <div className="flex items-center gap-2 min-w-0">
                   <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                       <Search className="w-4 h-4 text-blue-500" />
                   </div>
                   <CardTitle className="text-sm font-medium line-clamp-2 leading-tight">
                      {research.query || 'Pesquisa sem título'}
                   </CardTitle>
               </div>
               <div className="flex shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={onDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
               </div>
           </div>
           <div className="flex flex-wrap gap-1.5 mt-2">
               {research.search_depth && <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{research.search_depth}</Badge>}
               {research.topic && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{research.topic}</Badge>}
               {research.time_range && research.time_range !== 'null' && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{research.time_range}</Badge>}
           </div>
         </CardHeader>
         <CardContent className="flex-1 min-h-0 pt-2 pb-2">
             <div className="text-xs text-slate-600 line-clamp-6 prose prose-xs prose-p:my-1 prose-headings:my-2 max-w-none">
                 <ReactMarkdown>{research.output}</ReactMarkdown>
             </div>
         </CardContent>
         <CardFooter className="pt-2 border-t border-slate-50 flex justify-between items-center">
             <p className="text-[10px] text-slate-400">
                 {new Date(research.created_date).toLocaleDateString()}
             </p>
             <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowFull(true)}>
                <Eye className="w-3 h-3 mr-1.5" />
                Ver Completo
             </Button>
         </CardFooter>
      </Card>

      <Dialog open={showFull} onOpenChange={setShowFull}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    {research.query || 'Detalhes da Pesquisa'}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                   {research.search_depth && <Badge variant="secondary">{research.search_depth}</Badge>}
                   {research.topic && <Badge variant="outline">{research.topic}</Badge>}
                </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-1 pr-2">
                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600">
                    <ReactMarkdown>{research.output}</ReactMarkdown>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}