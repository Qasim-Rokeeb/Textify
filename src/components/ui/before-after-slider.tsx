
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronsLeftRight } from "lucide-react";

type BeforeAfterSliderProps = {
  before: React.ReactNode;
  after: React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
};

export function BeforeAfterSlider({ before, after, className, onScroll }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let newPosition = (x / rect.width) * 100;
      if (newPosition < 0) newPosition = 0;
      if (newPosition > 100) newPosition = 100;
      setSliderPosition(newPosition);
    },
    [isDragging]
  );
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (onScroll) {
      onScroll(scrollTop);
    }
  };

  useEffect(() => {
    const beforeEl = beforeRef.current?.firstElementChild as HTMLElement;
    const afterEl = afterRef.current?.firstElementChild as HTMLElement;
    if (beforeEl && afterEl) {
        const resizeObserver = new ResizeObserver(() => {
            const maxHeight = Math.max(beforeEl.scrollHeight, afterEl.scrollHeight);
            if(containerRef.current) {
                containerRef.current.style.height = `${maxHeight}px`;
            }
        });
        resizeObserver.observe(beforeEl);
        resizeObserver.observe(afterEl);
        return () => resizeObserver.disconnect();
    }
  }, [before, after])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden select-none", className)}
      onMouseUp={handleMouseUp}
    >
      <div ref={beforeRef} className="absolute inset-0" onScroll={handleScroll}>
        {before}
      </div>

      <div
        ref={afterRef}
        className="absolute inset-0 w-full"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        onScroll={handleScroll}
      >
        {after}
      </div>

      <div
        className="absolute inset-y-0 w-1 bg-primary cursor-col-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <ChevronsLeftRight className="h-4 w-4"/>
        </div>
      </div>
    </div>
  );
}
