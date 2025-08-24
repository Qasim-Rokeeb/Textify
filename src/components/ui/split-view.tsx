
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type SplitViewProps = {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}

export function SplitView({ children, className }: SplitViewProps) {
  const [leftPanel, rightPanel] = children;
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Initial width in percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setLeftPanelWidth(100);
      } else {
        setLeftPanelWidth(50);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    setIsDragging(false);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || isMobile) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      let newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      if (newLeftWidth < 20) newLeftWidth = 20;
      if (newLeftWidth > 80) newLeftWidth = 80;

      setLeftPanelWidth(newLeftWidth);
    },
    [isDragging, isMobile]
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const gridStyle = isMobile ? {} : { gridTemplateColumns: `minmax(0, ${leftPanelWidth}fr) auto minmax(0, ${100 - leftPanelWidth}fr)` };

  return (
    <div ref={containerRef} className={cn("grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:gap-4", className)} style={gridStyle}>
        <div style={{minWidth: 0}}>{leftPanel}</div>
        
        <div onMouseDown={handleMouseDown} className="hidden md:flex items-center justify-center cursor-col-resize w-2 group">
            <div className={`w-0.5 h-full bg-border group-hover:bg-primary transition-colors ${isDragging ? 'bg-primary' : ''}`} />
        </div>

        <div className="mt-4 md:mt-0" style={{minWidth: 0}}>{rightPanel}</div>
    </div>
  );
}
