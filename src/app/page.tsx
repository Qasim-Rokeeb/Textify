
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { cleanText, TextSegment } from "@/ai/flows/clean-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Loader2, Sparkles, Sun, Moon, Command as CommandIcon, Undo2, Check } from "lucide-react";
import { SplitView } from "@/components/ui/split-view";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function TextifyPage() {
  const [originalText, setOriginalText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [diff, setDiff] = useState<TextSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClean, setLastClean] = useState<{ originalText: string; cleanedText: string; diff: TextSegment[] } | null>(null);
  const { toast } = useToast();
  const cleanedTextRef = useRef<HTMLDivElement>(null);
  const originalTextRef = useRef<HTMLTextAreaElement>(null);
  const [cleanedPanelHeight, setCleanedPanelHeight] = useState('auto');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [animationKey, setAnimationKey] = useState(0);
  const [openCommand, setOpenCommand] = useState(false);
  const { setTheme } = useTheme();
  const [isShaking, setIsShaking] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [autoCleanOnPaste, setAutoCleanOnPaste] = useState(false);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommand((open) => !open)
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRevert();
      }
    }
 
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [lastClean]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (cleanedTextRef.current) {
      cleanedTextRef.current.scrollTop = cleanedTextRef.current.scrollHeight;
    }
  }, [diff]);

  useEffect(() => {
    if (originalTextRef.current && !isLoading) {
      const height = originalTextRef.current.offsetHeight;
      setCleanedPanelHeight(`${height}px`);
    }
  }, [originalText, isLoading]);

  const handleRevert = useCallback(() => {
    if (lastClean) {
      setOriginalText(lastClean.originalText);
      setCleanedText(lastClean.cleanedText);
      setDiff(lastClean.diff);
      setLastClean(null); // Only allow one level of undo
      toast({
        title: "Reverted",
        description: "The last cleaning action has been undone.",
      });
    }
  }, [lastClean, toast]);

  const handleCleanText = useCallback(async () => {
    if (!originalText.trim() || isLoading) {
      if (!originalText.trim()) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
      return;
    }
    setIsLoading(true);
    setLastClean({ originalText, cleanedText, diff });
    setCleanedText("");
    setDiff([]);
    try {
      if (originalTextRef.current) {
        const height = originalTextRef.current.offsetHeight;
        setCleanedPanelHeight(`${height}px`);
      }
      const result = await cleanText({ text: originalText });
      setCleanedText(result.cleanedText);
      setDiff(result.diff);
      setAnimationKey(prev => prev + 1);
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
  }, [originalText, cleanedText, diff, isLoading, toast]);

  const handleCopy = () => {
    if (!cleanedText) return;
    navigator.clipboard.writeText(cleanedText);
    toast({
      title: "Copied to clipboard!",
      description: "The cleaned text has been copied.",
    });
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleCleanText();
    }
  };

  const runCommand = (command: () => void) => {
    setOpenCommand(false);
    command();
  };

  const debouncedCleanText = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      handleCleanText();
    }, 500); // 500ms debounce delay
  }, [handleCleanText]);

  const handlePaste = () => {
    if (!autoCleanOnPaste) return;
    // We need a slight delay to allow the pasted text to be set in the state
    setTimeout(debouncedCleanText, 50);
  };
  
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const calculateReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    const minutes = wordCount / wordsPerMinute;
    const readTime = Math.ceil(minutes);
    if (readTime < 1) return "< 1 min read";
    return `${readTime} min read`;
  };

  const originalCharCount = originalText.length;
  const originalWordCount = originalText.trim() === "" ? 0 : originalText.trim().split(/\s+/).length;
  const originalReadingTime = calculateReadingTime(originalWordCount);
  
  const cleanedCharCount = cleanedText.length;
  const cleanedWordCount = cleanedText.trim() === "" ? 0 : cleanedText.trim().split(/\s+/).length;
  const cleanedReadingTime = calculateReadingTime(cleanedWordCount);


  return (
    <TooltipProvider>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <header className="text-center mb-8 relative">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              Textify
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Clean and refine your AI-generated text with a single click.
            </p>
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpenCommand(true)} className="gap-2">
                <CommandIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Commands</span>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <Card className={cn("w-full shadow-lg rounded-lg", isShaking && 'animate-shake')}>
            <CardContent className="p-6">
              <SplitView>
                <div className="flex flex-col space-y-2 h-full">
                  <Label htmlFor="original-text" className="text-base font-medium sticky top-0 bg-card z-10 py-2">
                    Original Text
                  </Label>
                  <Textarea
                    id="original-text"
                    ref={originalTextRef}
                    placeholder="Paste your AI-generated text here... (Ctrl+Enter to clean)"
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className="flex-grow resize-none font-mono text-base"
                  />
                  <div className="text-xs text-muted-foreground flex justify-end gap-4">
                      <span>{originalReadingTime}</span>
                      <span>{originalWordCount} {originalWordCount === 1 ? 'word' : 'words'}</span>
                      <span>{originalCharCount} {originalCharCount === 1 ? 'character' : 'characters'}</span>
                  </div>
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
                    <div
                      id="cleaned-text"
                      key={animationKey}
                      ref={cleanedTextRef}
                      className="flex-grow resize-none bg-muted/50 max-h-[400px] overflow-y-auto font-sans rounded-md border border-input p-2 text-base break-words whitespace-pre-wrap"
                      style={{ animation: 'fadeIn 0.5s ease-in-out' }}
                    >
                      {diff.length > 0 ? (
                        <>
                          {diff.map((part, index) => (
                            <span
                              key={index}
                              className={
                                part.removed
                                  ? "bg-red-200/50 text-red-700 line-through dark:bg-red-900/50 dark:text-red-400"
                                  : ""
                              }
                            >
                              {part.value}
                            </span>
                          ))}
                        </>
                      ) : (
                        <div className="text-muted-foreground">Your cleaned text will appear here.</div>
                      )}
                    </div>
                  )}
                   <div className="text-xs text-muted-foreground flex justify-end gap-4">
                      <span>{cleanedReadingTime}</span>
                      <span>{cleanedWordCount} {cleanedWordCount === 1 ? 'word' : 'words'}</span>
                      <span>{cleanedCharCount} {cleanedCharCount === 1 ? 'character' : 'characters'}</span>
                  </div>
                </div>
              </SplitView>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch id="auto-clean" checked={autoCleanOnPaste} onCheckedChange={setAutoCleanOnPaste} />
                <Label htmlFor="auto-clean">Auto-clean on paste</Label>
              </div>
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Removes markdown symbols like #, *, etc.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleCopy}
                      disabled={isLoading || !cleanedText.trim()}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy the cleaned text to your clipboard.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
          <p className="mt-2">
              &copy; {currentYear} Textify. Built by <b>Qasim Rokeeb</b>.
          </p>
        </footer>
      </main>
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(handleCleanText)} disabled={isLoading || !originalText.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Clean Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleCopy)} disabled={isLoading || !cleanedText.trim()}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Cleaned Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleRevert)} disabled={!lastClean}>
                <Undo2 className="mr-2 h-4 w-4" />
                <span>Undo Last Clean</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
               <CommandItem onSelect={() => runCommand(() => setAutoCleanOnPaste(!autoCleanOnPaste))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={autoCleanOnPaste} />
                    <span>Auto-clean on paste</span>
                 </div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                <Moon className="mr-2 h-4 w-4" />
                <span>System</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
    </TooltipProvider>
  );
}
