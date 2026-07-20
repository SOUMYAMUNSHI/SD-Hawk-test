import React from 'react';
import { Target } from 'lucide-react';

export default function Logo({ showText = true, layout = "vertical", className = "" }) {
  const isVertical = layout === "vertical";

  return (
    <div className={`flex select-none max-w-full overflow-visible ${isVertical ? 'flex-col items-center pt-4 w-full' : 'flex-row items-center gap-2 pt-1 w-auto'} ${className}`}>
      
      {/* SVG Logo Container (Dynamically scaled based on layout) */}
      <div className={`relative drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] flex-shrink-0 ${isVertical ? 'w-[55%] max-w-[160px] aspect-square mb-2' : 'w-10 h-10'}`}>
        <svg 
            className="w-full h-full transition-transform duration-300 hover:scale-105 hover:rotate-[-2deg]" 
            viewBox="0 0 512 512" 
            xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hawk-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <linearGradient id="hawk-eye" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path
            d="M110 260 C130 170 215 105 315 105 C365 105 405 122 435 152 L385 182 C358 160 327 150 292 150 C225 150 173 192 158 252 L250 252 L205 305 L100 305 C103 287 106 273 110 260 Z"
            fill="url(#hawk-body)"
            stroke="#22d3ee"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M250 252 L420 252 L305 345 Z"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          
          {/* Target Reticle Crosshairs */}
          <line x1="300" y1="165" x2="300" y2="225" stroke="#ef4444" strokeWidth="6" opacity="0.9" filter="url(#glow)" />
          <line x1="270" y1="195" x2="330" y2="195" stroke="#ef4444" strokeWidth="6" opacity="0.9" filter="url(#glow)" />
          
          <circle 
            cx="300" cy="195" r="32" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="20 10 5 10" opacity="0.9" filter="url(#glow)"
          >
             <animateTransform attributeName="transform" type="rotate" from="0 300 195" to="360 300 195" dur="8s" repeatCount="indefinite" />
          </circle>

          {/* Glowing Targeting Eyeball */}
          <circle cx="300" cy="195" r="22" fill="url(#hawk-eye)">
             <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Text Blocks */}
      {showText && (
        <div className={`flex flex-col ${isVertical ? 'items-center w-full' : 'items-start justify-center'}`}>
          {/* Title Row */}
          <div className={`font-black italic tracking-tight flex items-center leading-none overflow-visible relative ${isVertical ? 'text-[2rem] sm:text-[2.2rem] justify-center w-full mb-1' : 'text-xl justify-start'}`}>
            
            <span className="pr-1.5 pl-1 text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-orange-500 to-red-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
              SD
            </span>
            
            {/* Center Separator Replica */}
            <div className={`${isVertical ? 'mx-2 w-[34px] h-[34px]' : 'mx-1 w-[20px] h-[20px]'} flex items-center justify-center`}>
              <svg viewBox="260 155 80 80" className="w-full h-full overflow-visible drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
                <line x1="300" y1="165" x2="300" y2="225" stroke="#ef4444" strokeWidth="6" opacity="0.9" />
                <line x1="270" y1="195" x2="330" y2="195" stroke="#ef4444" strokeWidth="6" opacity="0.9" />
                <circle cx="300" cy="195" r="32" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="20 10 5 10" opacity="0.9">
                   <animateTransform attributeName="transform" type="rotate" from="0 300 195" to="360 300 195" dur="8s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="195" r="16" fill="url(#hawk-eye)">
                   <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] ${isVertical ? 'pr-2' : ''}`}>
              HAWK
            </span>
          </div>

          {/* Subtitle */}
          <div className={`w-full flex ${isVertical ? 'justify-center' : 'justify-start ml-[2px]'}`}>
            <span className={`${isVertical ? 'text-[0.65rem] tracking-[0.5em] ml-2' : 'text-[0.5rem] tracking-[0.3em]'} uppercase text-cyan-500/80 font-extrabold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]`}>
              Vision Systems
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
