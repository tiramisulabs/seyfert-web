'use client';

import React, { useEffect, useState } from "react";
import { cn } from '@/lib/utils';

interface StarryBackgroundProps {
  className?: string;
}

// Helper function to generate random star positions for box shadows
const generateStarBoxShadows = (count: number): string => {
  let shadows = '';
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);

    // Add some variation to star brightness
    const opacity = Math.random();
    const color = opacity > 0.9
      ? '#FFF'
      : opacity > 0.6
        ? 'rgba(255, 255, 255, 0.8)'
        : 'rgba(255, 255, 255, 0.6)';

    shadows += `${x}px ${y}px ${color}`;
    if (i < count - 1) shadows += ', ';
  }
  return shadows;
};

export function StarryBackground({
  className,
}: StarryBackgroundProps) {
  // Use state to store the generated shadows
  const [shadows, setShadows] = useState<{
    small: string;
    medium: string;
    large: string;
  } | null>(null);

  // Only generate shadows on the client side
  useEffect(() => {
    setShadows({
      small: generateStarBoxShadows(500),
      medium: generateStarBoxShadows(200),
      large: generateStarBoxShadows(50)
    });
  }, []);

  return (
    <div className={cn(
      "absolute inset-0 w-full h-full overflow-hidden bg-transparent",
      className
    )}>
      {shadows && (
        <>
          <style jsx>{`
            .starry-container {
              height: 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              overflow: hidden;
              z-index: 0;
            }
            
            #stars {
              width: 1px;
              height: 1px;
              background: transparent;
              box-shadow: ${shadows.small};
              animation: animStar 50s linear infinite;
              z-index: 1;
            }
            
            #stars:after {
              content: " ";
              position: absolute;
              top: 2000px;
              width: 1px;
              height: 1px;
              background: transparent;
              box-shadow: ${shadows.small};
            }
            
            #stars2 {
              width: 2px;
              height: 2px;
              background: transparent;
              box-shadow: ${shadows.medium};
              animation: animStar 100s linear infinite;
              z-index: 2;
            }
            
            #stars2:after {
              content: " ";
              position: absolute;
              top: 2000px;
              width: 2px;
              height: 2px;
              background: transparent;
              box-shadow: ${shadows.medium};
            }
            
            #stars3 {
              width: 3px;
              height: 3px;
              background: transparent;
              box-shadow: ${shadows.large};
              animation: animStar 150s linear infinite;
              z-index: 3;
            }
            
            #stars3:after {
              content: " ";
              position: absolute;
              top: 2000px;
              width: 3px;
              height: 3px;
              background: transparent;
              box-shadow: ${shadows.large};
            }
            
            @keyframes animStar {
              from {
                transform: translateY(0px);
              }
              to {
                transform: translateY(-2000px);
              }
            }
          `}</style>

          <div className="starry-container">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
          </div>
        </>
      )}

      {/* Empty transparent container while shadows are being generated */}
      {!shadows && (
        <div className="w-full h-full bg-transparent"></div>
      )}
    </div>
  );
}