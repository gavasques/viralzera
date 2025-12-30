import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, Repeat, Heart, Bookmark, Share, X, Move, Maximize, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function TweetCard({ 
  config, 
  slide, 
  showArrow, 
  arrowDirection, 
  scale = 1, 
  centerVertically = false,
  isEditing = false,
  onTextChange,
  onImageUpdate,
  onImageRemove,
  textareaRef,
  fontSize
}) {
  const { display_name, username, profile_photo, verified, bg_color, text_color, font } = config;
  const { text, image } = slide || {};
  
  const currentFontSize = fontSize || 22;

  const currentDate = new Date();
  const timeString = format(currentDate, 'HH:mm', { locale: ptBR });
  const dateString = format(currentDate, "d 'de' MMM 'de' yyyy", { locale: ptBR });

  // Image Dragging Logic
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (!isEditing || !image) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (image.x || 0),
      y: e.clientY - (image.y || 0)
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isEditing) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    onImageUpdate({ ...image, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full h-full flex flex-col"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: bg_color,
        fontFamily: font || "Inter, sans-serif",
        width: scale !== 1 ? `${100/scale}%` : '100%',
        height: scale !== 1 ? `${100/scale}%` : '100%',
      }}
    >
      {/* Left Arrow */}
      {showArrow && (arrowDirection === 'left' || arrowDirection === 'both') && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center z-10"
          style={{ color: text_color }}
        >
          <ChevronLeft className="w-5 h-5" />
        </div>
      )}

      {/* Header */}
      <div className="pt-6 px-8 pb-2 shrink-0 z-10 relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="rounded-full bg-slate-200 overflow-hidden flex-shrink-0"
            style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
          >
            {profile_photo ? (
              <img 
                src={profile_photo} 
                alt="" 
                crossOrigin="anonymous"
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '50%'
                }} 
              />
            ) : (
              <div className="w-full h-full bg-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-nowrap">
              <span className="font-bold text-lg leading-none whitespace-nowrap block" style={{ color: text_color }}>
                {display_name || "Nome"}
              </span>
              {verified && (
                <svg viewBox="0 0 22 22" width="20" height="20" className="flex-shrink-0 block mt-[1px]" style={{ width: '20px', height: '20px', fill: '#1D9BF0' }}>
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                </svg>
              )}
            </div>
            <span className="text-base opacity-60 block" style={{ color: text_color }}>
              @{username || "username"}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 px-8 py-0 pb-4 flex flex-col ${centerVertically ? 'justify-center' : 'justify-start'} z-0`}>

        {/* Text */}
        <div className="relative flex-1">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text || ""}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Digite seu texto aqui..."
              className="w-full h-full bg-transparent resize-none focus:outline-none p-0 [&::-webkit-scrollbar]:hidden"
              style={{ 
                fontSize: `${currentFontSize}px`, 
                lineHeight: '1.5',
                color: text_color,
                fontFamily: font || "Inter, sans-serif",
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          ) : (
             <div className="w-full font-medium whitespace-pre-wrap" style={{ fontSize: `${currentFontSize}px`, lineHeight: '1.5', color: text_color }}>
                     <ReactMarkdown components={{
                        strong: ({node, ...props}) => <span className="font-bold" style={{ color: text_color }} {...props} />,
                        em: ({node, ...props}) => <span className="italic" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        a: ({node, ...props}) => <span className="text-[#1D9BF0]" {...props} />
                     }}>
                  {text || ""}
               </ReactMarkdown>
             </div>
          )}
        </div>

        {/* Image */}
        {image && (
          <div className="relative flex-1 w-full min-h-[200px] overflow-hidden rounded-xl border border-black/5 bg-slate-50 mb-4 group">
             <img 
               ref={imageRef}
               src={image.url} 
               alt="Post attachment" 
               className={`absolute max-w-none origin-top-left ${isEditing ? 'cursor-move' : ''}`}
               style={{ 
                 transform: `translate(${image.x || 0}px, ${image.y || 0}px) scale(${image.scale || 1})`,
               }}
               onMouseDown={handleMouseDown}
               draggable={false}
             />
             
             {/* Image Controls (Only in Editing Mode) */}
             {isEditing && (
               <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur-sm z-20">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={onImageRemove}
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </Button>
               </div>
             )}
             
             {isEditing && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 shadow-lg backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 w-[60%]">
                   <ZoomIn className="w-4 h-4 text-slate-500" />
                   <Slider 
                      value={[image.scale || 1]} 
                      min={0.1} 
                      max={3} 
                      step={0.1} 
                      onValueChange={([val]) => onImageUpdate({ ...image, scale: val })}
                      className="flex-1"
                   />
                </div>
             )}
             
             {isEditing && (
               <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/0 group-hover:border-indigo-500/50 transition-colors rounded-xl z-10" />
             )}
          </div>
        )}

      </div>

      {/* Spacer */}
      <div className="pb-4 shrink-0"></div>

      {/* Swipe Indicator */}
      {showArrow && (arrowDirection === 'right' || arrowDirection === 'both') && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12 flex items-center gap-2 animate-pulse z-20" style={{ color: text_color }}>
          <span className="font-medium text-sm">Arrasta</span>
          <span className="text-2xl">👉</span>
        </div>
      )}
    </div>
  );
}