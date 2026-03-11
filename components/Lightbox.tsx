'use client';



import { useEffect, useCallback } from 'react';

import Image from 'next/image';

import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';



interface LightboxProps {

  isOpen: boolean;

  onClose: () => void;

  imageUrl: string;

  title?: string;

  onPrev?: () => void;

  onNext?: () => void;

  hasPrev?: boolean;

  hasNext?: boolean;

}



export function Lightbox({

  isOpen,

  onClose,

  imageUrl,

  title,

  onPrev,

  onNext,

  hasPrev,

  hasNext,

}: LightboxProps) {

  // 键盘导航

  const handleKeyDown = useCallback(

    (e: KeyboardEvent) => {

      if (!isOpen) return;



      switch (e.key) {

        case 'Escape':

          onClose();

          break;

        case 'ArrowLeft':

          if (hasPrev && onPrev) onPrev();

          break;

        case 'ArrowRight':

          if (hasNext && onNext) onNext();

          break;

      }

    },

    [isOpen, onClose, onPrev, onNext, hasPrev, hasNext]

  );



  useEffect(() => {

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [handleKeyDown]);



  // 禁止背景滚动

  useEffect(() => {

    if (isOpen) {

      document.body.style.overflow = 'hidden';

    } else {

      document.body.style.overflow = '';

    }

    return () => {

      document.body.style.overflow = '';

    };

  }, [isOpen]);



  if (!isOpen) return null;



  // Check if the image is from an external domain (Unsplash)

  const isExternalImage = imageUrl.startsWith('https://');



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"

      onClick={onClose}

    >

      {/* Close Button */}

      <button

        onClick={onClose}

        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"

      >

        <X className="h-6 w-6" />

      </button>



      {/* Navigation - Previous */}

      {hasPrev && onPrev && (

        <button

          onClick={(e) => {

            e.stopPropagation();

            onPrev();

          }}

          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"

        >

          <ChevronLeft className="h-8 w-8" />

        </button>

      )}



      {/* Navigation - Next */}

      {hasNext && onNext && (

        <button

          onClick={(e) => {

            e.stopPropagation();

            onNext();

          }}

          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"

        >

          <ChevronRight className="h-8 w-8" />

        </button>

      )}



      {/* Image Container */}

      <div

        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"

        onClick={(e) => e.stopPropagation()}

      >

        {isExternalImage ? (

          <Image

            src={imageUrl}

            alt={title || '图片预览'}

            width={1920}

            height={1080}

            className="max-w-full max-h-[85vh] object-contain"

            priority

            sizes="90vw"

          />

        ) : (

          // eslint-disable-next-line @next/next/no-img-element

          <img

            src={imageUrl}

            alt={title || '图片预览'}

            className="max-w-full max-h-[85vh] object-contain"

          />

        )}



        {/* Title Bar */}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">

          <div className="flex items-center justify-between">

            {title && <p className="text-white text-sm truncate mr-4">{title}</p>}

            <a

              href={imageUrl}

              download

              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"

              onClick={(e) => e.stopPropagation()}

            >

              <Download className="h-4 w-4" />

              下载

            </a>

          </div>

        </div>

      </div>



      {/* Instructions */}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">

        按 ESC 关闭 | ← → 切换图片

      </div>

    </div>

  );

}
