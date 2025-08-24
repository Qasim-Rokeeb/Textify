
"use client";

import { useState, useRef, useEffect } from "react";
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
import { SplitView } from "@/components/ui/split-view";

export default function TextifyPage() {
  const [originalText, setOriginalText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const cleanedTextRef = useRef<HTMLTextAreaElement>(null);
  const originalTextRef = useRef<HTMLTextAreaElement>(null);
  const [cleanedPanelHeight, setCleanedPanelHeight] = useState('auto');

  useEffect(() => {
    if (cleanedTextRef.current) {
      cleanedTextRef.current.scrollTop = cleanedTextRef.current.scrollHeight;
    }
  }, [cleanedText]);

  useEffect(() => {
    if (originalTextRef.current && !isLoading) {
      const height = originalTextRef.current.offsetHeight;
      setCleanedPanelHeight(`${height}px`);
    }
  }, [originalText, isLoading]);


  const handleCleanText = async () => {
    if (!originalText.trim()) return;
    setIsLoading(true);
    setCleanedText("");
    try {
      if (originalTextRef.current) {
        const height = originalTextRef.current.offsetHeight;
        setCleanedPanelHeight(`${height}px`);
      }
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
            <SplitView>
              <div className="flex flex-col space-y-2 h-full">
                <Label htmlFor="original-text" className="text-base font-medium sticky top-0 bg-card z-10 py-2">
                  Original Text
                </Label>
                <Textarea
                  id="original-text"
                  ref={originalTextRef}
                  placeholder="Paste your AI-generated text here..."
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="flex-grow resize-none"
                />
              </div>
              
              <div className="flex flex-col space-y-2 h-full">
                <Label htmlFor="cleaned-text" className="text-base font-medium sticky top-0 bg-card z-10 py-2">
                  Cleaned Text
                </Label>
                {isLoading ? (
                   <div style={{ height: cleanedPanelHeight }} className="flex flex-col space-y-3 rounded-md border bg-muted/50 p-4">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/6" />
                  </div>
                ) : (
                  <Textarea
                    id="cleaned-text"
                    ref={cleanedTextRef}
                    readOnly
                    value={cleanedText}
                    placeholder="Your cleaned text will appear here."
                    className="flex-grow resize-none bg-muted/50 max-h-[400px] overflow-y-auto"
                  />
                )}
              </div>
            </SplitView>
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
