
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cleanText } from "@/ai/flows/clean-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Loader2, Sparkles } from "lucide-react";

export default function TextifyPage() {
  const [originalText, setOriginalText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Initial width in percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

      if (newLeftWidth > 20 && newLeftWidth < 80) { // Constraint the resize
        setLeftPanelWidth(newLeftWidth);
      }
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

  const handleCleanText = async () => {
    if (!originalText.trim()) return;
    setIsLoading(true);
    setCleanedText("");
    try {
      const result = await cleanText({ text: originalText });
      setCleanedText(result.cleanedText);
    } catch (error) {
      console.error("Error cleaning text:", error);
      toast({
        title: "Error",
        description: "Failed to clean text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!cleanedText) return;
    navigator.clipboard.writeText(cleanedText);
    toast({
      title: "Copied to clipboard!",
      description: "The cleaned text has been copied.",
    });
  };

  const gridStyle = isMobile ? {} : { gridTemplateColumns: `minmax(0, ${leftPanelWidth}fr) auto minmax(0, ${100 - leftPanelWidth}fr)` };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
            Textify
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Clean and refine your AI-generated text with a single click.
          </p>
        </header>

        <Card className="w-full shadow-lg rounded-lg">
          <CardContent className="p-6">
            <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:gap-4" style={gridStyle}>
              <div className="flex flex-col space-y-2" style={{minWidth: 0}}>
                <Label htmlFor="original-text" className="text-base font-medium sticky top-0 bg-card z-10 py-2">
                  Original Text
                </Label>
                <Textarea
                  id="original-text"
                  placeholder="Paste your AI-generated text here..."
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="flex-grow resize-none"
                  rows={12}
                />
              </div>
              
              <div onMouseDown={handleMouseDown} className="hidden md:flex items-center justify-center cursor-col-resize w-2 group">
                 <div className={`w-0.5 h-full bg-border group-hover:bg-primary transition-colors ${isDragging ? 'bg-primary' : ''}`} />
              </div>

              <div className="flex flex-col space-y-2 mt-4 md:mt-0" style={{minWidth: 0}}>
                <Label htmlFor="cleaned-text" className="text-base font-medium sticky top-0 bg-card z-10 py-2">
                  Cleaned Text
                </Label>
                {isLoading ? (
                  <div className="h-[258px] space-y-3 rounded-md border bg-muted/50 p-4">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/6" />
                  </div>
                ) : (
                  <Textarea
                    id="cleaned-text"
                    readOnly
                    value={cleanedText}
                    placeholder="Your cleaned text will appear here."
                    className="flex-grow resize-none bg-muted/50"
                    rows={12}
                  />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 border-t">
            <Button
              onClick={handleCleanText}
              disabled={isLoading || !originalText.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Clean Text
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={isLoading || !cleanedText.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardFooter>
        </Card>
      </div>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>
          Powered by{" "}
          <a
            href="https://firebase.google.com/docs/genkit"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Genkit
          </a>
        </p>
      </footer>
    </main>
  );
}
