import React, { useState, useEffect, useCallback } from 'react';
import { CarouselSlide } from '../types/catalog';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Maximize2,
  ArrowRight
} from 'lucide-react';
import { getStoredWhatsappNumber, cleanWhatsappNumber } from '../utils/whatsapp';

interface HeroCarouselProps {
  slides: CarouselSlide[];
  onOpenImage: (slide: CarouselSlide) => void;
  onExploreClick?: () => void;
  whatsappNumber?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  onOpenImage,
  onExploreClick,
  whatsappNumber,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeWhatsappNumber = whatsappNumber ? cleanWhatsappNumber(whatsappNumber) : getStoredWhatsappNumber();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  // Autoplay rotation every 5.5 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, nextSlide]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const getSlideWhatsappUrl = (slide: CarouselSlide) => {
    const name = slide.name
      ? slide.name.replace(/\.[^/.]+$/, '')
      : (slide.title || 'este producto');
    const link =
      slide.webViewLink ||
      (slide.id ? `https://drive.google.com/file/d/${slide.id}/view` : '');
    const linkText = link ? `: ${link}` : '';
    const message = `¡Hola! Estoy interesado(a) en comprar este producto *${name}*${linkText}\n¿Tienen disponibilidad para envío o entrega? ¡Muchas gracias!`;
    const text = encodeURIComponent(message);
    return `https://wa.me/${activeWhatsappNumber}?text=${text}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 group bg-slate-950/80 backdrop-blur-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Slides Container */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.7/1] w-full overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <img
                src={slide.highResUrl || slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-10000 ease-out hover:scale-105"
                loading={idx === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallbackDrive = `https://drive.google.com/thumbnail?id=${slide.id}&sz=w1600`;
                  const ucDrive = `https://drive.google.com/uc?export=view&id=${slide.id}`;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = '1';
                    target.src = fallbackDrive;
                  } else if (!target.dataset.triedUc) {
                    target.dataset.triedUc = '1';
                    target.src = ucDrive;
                  }
                }}
              />

              {/* Gradient Overlay for high-end look */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

              {/* Slide Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-12 z-20">
                <div className="max-w-2xl space-y-3 sm:space-y-4">
                  {/* Category / Highlight Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-cyan-300 border border-cyan-400/40 text-xs font-bold tracking-wide shadow-md shadow-cyan-950/50 font-mono-tech">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Colección Destacada</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                    {slide.title}
                  </h2>

                  {/* Subtitle / Description */}
                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 max-w-xl font-normal leading-relaxed drop-shadow-sm">
                      {slide.subtitle}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={getSlideWhatsappUrl(slide)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/70 active:scale-95 transition-all border border-emerald-400/30 no-underline cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Pedir por WhatsApp</span>
                    </a>

                    <button
                      onClick={() => onOpenImage(slide)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 border border-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
                    >
                      <Maximize2 className="w-4 h-4 text-cyan-400" />
                      <span className="hidden sm:inline">Ver detalle</span>
                    </button>

                    {onExploreClick && (
                      <button
                        onClick={onExploreClick}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 backdrop-blur-md text-xs sm:text-sm font-medium transition-all"
                      >
                        <span>Explorar catálogo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Anterior imagen"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/95 text-white border border-white/20 backdrop-blur-md shadow-lg shadow-black/50 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={nextSlide}
              aria-label="Siguiente imagen"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/95 text-white border border-white/20 backdrop-blur-md shadow-lg shadow-black/50 transition-all active:scale-90"
            >
              <ChevronRight className="w-5 h-5 text-cyan-400" />
            </button>

            {/* Slide Indicators / Dots */}
            <div className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-sm">
              <span className="text-[11px] text-slate-300 font-medium mr-1">
                {currentIndex + 1} / {slides.length}
              </span>
              {slides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Ir a imagen ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dotIdx === currentIndex
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : 'w-1.5 bg-slate-500 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
