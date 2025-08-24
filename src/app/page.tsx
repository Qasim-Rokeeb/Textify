
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Loader2, Sparkles, Sun, Moon, Command as CommandIcon, Undo2, Check, ChevronsUpDown, Brush, Droplets, Trees, Palette, GlassWater, Link2Off, CaseLower, CaseUpper, Type, ListOrdered, Regex } from "lucide-react";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function TextifyPage() {
  const [originalText, setOriginalText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [diff, setDiff] = useState<TextSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClean, setLastClean] = useState<{ originalText: string; cleanedText: string; diff: TextSegment[] } | null>(null);
  const { toast } = useToast();
  const cleanedTextRef = useRef<HTMLDivElement>(null);
  const originalTextRef = useRef<HTMLTextAreaElement>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [openCommand, setOpenCommand] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isShaking, setIsShaking] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [autoCleanOnPaste, setAutoCleanOnPaste] = useState(false);
  const [removeEmojis, setRemoveEmojis] = useState(false);
  const [normalizeQuotes, setNormalizeQuotes] = useState(false);
  const [trimTrailingSpaces, setTrimTrailingSpaces] = useState(false);
  const [convertToLowercase, setConvertToLowercase] = useState(false);
  const [convertToSentenceCase, setConvertToSentenceCase] = useState(false);
  const [removeUrls, setRemoveUrls] = useState(false);
  const [removeLineNumbers, setRemoveLineNumbers] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [regexPattern, setRegexPattern] = useState("");
  const [showSlider, setShowSlider] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [screenReaderMessage, setScreenReaderMessage] = useState("");


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

  const handleRevert = useCallback(() => {
    if (lastClean) {
      setOriginalText(lastClean.originalText);
      setCleanedText(lastClean.cleanedText);
      setDiff(lastClean.diff);
      setLastClean(null); // Only allow one level of undo
      setShowSlider(true);
      toast({
        title: "Reverted",
        description: "The last cleaning action has been undone.",
      });
      setScreenReaderMessage("Last cleaning action undone.");
    } else {
      setOriginalText("");
      setCleanedText("");
      setDiff([]);
      setShowSlider(false);
      setScreenReaderMessage("History cleared.");
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
    setShowSlider(false);
    setScreenReaderMessage("Cleaning text...");
    try {
      const result = await cleanText({ text: originalText, removeEmojis, normalizeQuotes, trimTrailingSpaces, convertToLowercase, convertToSentenceCase, removeUrls, removeLineNumbers, useRegex, regexPattern });
      setCleanedText(result.cleanedText);
      setDiff(result.diff);
      setShowSlider(true);
      setScreenReaderMessage("Text cleaning complete.");
    } catch (error) {
      console.error("Error cleaning text:", error);
      toast({
        title: "Error",
        description: "Failed to clean text. Please try again.",
        variant: "destructive",
      });
      setScreenReaderMessage("Error cleaning text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [originalText, cleanedText, diff, isLoading, toast, removeEmojis, normalizeQuotes, trimTrailingSpaces, convertToLowercase, convertToSentenceCase, removeUrls, removeLineNumbers, useRegex, regexPattern]);

  const handleCopy = () => {
    if (!cleanedText) return;
    navigator.clipboard.writeText(cleanedText);
    toast({
      title: "Copied to clipboard!",
      description: "The cleaned text has been copied.",
    });
    setScreenReaderMessage("Cleaned text copied to clipboard.");
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
    setTimeout(debouncedCleanText, 50);
  };
  
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = (scrollTop: number) => {
    if (originalTextRef.current) {
        originalTextRef.current.scrollTop = scrollTop;
    }
    if (cleanedTextRef.current) {
        (cleanedTextRef.current as any).setScrollTop?.(scrollTop);
    }
  };

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

  const getHighlightedText = () => {
    if (!useRegex || !regexPattern) {
      return originalText;
    }
    try {
      const regex = new RegExp(regexPattern, 'g');
      return originalText.split(regex).flatMap((part, i) => {
        if (i === 0) return [part];
        const matches = originalText.match(regex);
        const match = matches?.[i - 1] || '';
        return [<span key={`match-${i}`} className="bg-yellow-300 dark:bg-yellow-700">{match}</span>, part];
      });
    } catch (e) {
      return originalText; // Invalid regex
    }
  };


  return (
    <TooltipProvider>
      <div aria-live="polite" className="sr-only">
        {screenReaderMessage}
      </div>
      <main id="main-content" className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <Collapsible open={isHeaderOpen} onOpenChange={setIsHeaderOpen}>
            <header className={cn("text-center mb-8 relative", theme === 'glass' && 'sticky top-0 z-10 py-4 glass-header')}>
              <div className="flex justify-center items-center gap-2">
                  <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                    Textify
                  </h1>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronsUpDown className="h-5 w-5" />
                      <span className="sr-only">Toggle header</span>
                    </Button>
                  </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <p className="text-muted-foreground mt-2 text-lg">
                  Clean and refine your AI-generated text with a single click.
                </p>
              </CollapsibleContent>

              <div className="absolute top-0 right-0 flex items-center gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpenCommand(true)} className="gap-2">
                  <CommandIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Commands</span>
                </Button>
                <ThemeToggle />
              </div>
            </header>
          </Collapsible>

          <Card className={cn("w-full shadow-lg rounded-lg", isShaking && 'animate-shake')}>
            <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <div className="grid grid-cols-2">
                      <Label htmlFor="original-text" className="text-base font-medium">
                          Original Text
                      </Label>
                      <Label htmlFor="cleaned-text" className={cn("text-base font-medium", !showSlider && 'invisible')}>
                          Cleaned Text
                      </Label>
                  </div>
                
                 {isLoading ? (
                    <div className="flex flex-col space-y-3 rounded-md border bg-muted/50 p-4 min-h-[120px]">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : showSlider && !isShaking ? (
                     <BeforeAfterSlider
                        onScroll={handleScroll}
                        before={
                           <Textarea
                              id="original-text"
                              ref={originalTextRef}
                              value={originalText}
                              readOnly
                              className="flex-grow resize-none font-mono text-base bg-card"
                            />
                        }
                        after={
                          <div
                            id="cleaned-text"
                            ref={cleanedTextRef}
                            className="flex-grow resize-none bg-muted/50 font-sans rounded-md border border-input p-2 text-base break-words whitespace-pre-wrap overflow-y-auto"
                           >
                            {diff.length > 0 ? (
                              <>
                                {diff.map((part, index) => (
                                  <span
                                    key={index}
                                    className={
                                      part.removed
                                        ? "bg-destructive/20 text-destructive line-through"
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
                        }
                      />
                  ) : (
                    <div className="relative">
                      <Textarea
                        id="original-text"
                        ref={originalTextRef}
                        placeholder="Paste your AI-generated text here... (Ctrl+Enter to clean)"
                        value={originalText}
                        onChange={(e) => setOriginalText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onScroll={(e) => {
                           handleScroll(e.currentTarget.scrollTop);
                           const highlightDiv = e.currentTarget.previousElementSibling as HTMLDivElement;
                           if (highlightDiv) {
                               highlightDiv.scrollTop = e.currentTarget.scrollTop;
                           }
                        }}
                        className={cn("flex-grow resize-none font-mono text-base", useRegex && regexPattern && "bg-transparent text-transparent caret-black dark:caret-white")}
                      />
                       {useRegex && regexPattern && (
                        <div className="absolute inset-0 -z-10 p-2 overflow-y-auto font-mono text-base pointer-events-none rounded-md border border-input whitespace-pre-wrap break-words">
                          {getHighlightedText()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 text-xs text-muted-foreground">
                      <div className="flex justify-start gap-4">
                          <span>{originalReadingTime}</span>
                          <span>{originalWordCount} {originalWordCount === 1 ? 'word' : 'words'}</span>
                          <span>{originalCharCount} {originalCharCount === 1 ? 'character' : 'characters'}</span>
                      </div>
                      <div className={cn("flex justify-end gap-4", !showSlider && "invisible")}>
                          <span>{cleanedReadingTime}</span>
                          <span>{cleanedWordCount} {cleanedWordCount === 1 ? 'word' : 'words'}</span>
                          <span>{cleanedCharCount} {cleanedCharCount === 1 ? 'character' : 'characters'}</span>
                      </div>
                  </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-clean" checked={autoCleanOnPaste} onCheckedChange={setAutoCleanOnPaste} />
                  <Label htmlFor="auto-clean">Auto-clean</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="remove-emojis" checked={removeEmojis} onCheckedChange={setRemoveEmojis} />
                  <Label htmlFor="remove-emojis">Remove Emojis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="normalize-quotes" checked={normalizeQuotes} onCheckedChange={setNormalizeQuotes} />
                  <Label htmlFor="normalize-quotes">Normalize Quotes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="trim-trailing-spaces" checked={trimTrailingSpaces} onCheckedChange={setTrimTrailingSpaces} />
                  <Label htmlFor="trim-trailing-spaces">Trim Trailing Spaces</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="convert-to-lowercase" checked={convertToLowercase} onCheckedChange={setConvertToLowercase} />
                  <Label htmlFor="convert-to-lowercase">Lowercase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="convert-to-sentence-case" checked={convertToSentenceCase} onCheckedChange={setConvertToSentenceCase} />
                  <Label htmlFor="convert-to-sentence-case">Sentence Case</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="remove-urls" checked={removeUrls} onCheckedChange={setRemoveUrls} />
                  <Label htmlFor="remove-urls">Remove URLs</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Switch id="remove-line-numbers" checked={removeLineNumbers} onCheckedChange={setRemoveLineNumbers} />
                  <Label htmlFor="remove-line-numbers">Remove Line Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="use-regex" checked={useRegex} onCheckedChange={setUseRegex} />
                  <Label htmlFor="use-regex">Use Regex</Label>
                </div>
                {useRegex && (
                  <Input
                    id="regex-pattern"
                    placeholder="Enter regex pattern..."
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                )}
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
              <CommandItem onSelect={() => runCommand(() => setRemoveEmojis(!removeEmojis))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={removeEmojis} />
                    <span>Remove Emojis</span>
                 </div>
              </CommandItem>
               <CommandItem onSelect={() => runCommand(() => setNormalizeQuotes(!normalizeQuotes))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={normalizeQuotes} />
                    <span>Normalize Quotes</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTrimTrailingSpaces(!trimTrailingSpaces))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={trimTrailingSpaces} />
                    <span>Trim Trailing Spaces</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setConvertToLowercase(!convertToLowercase))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={convertToLowercase} />
                    <span>Convert to Lowercase</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setConvertToSentenceCase(!convertToSentenceCase))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={convertToSentenceCase} />
                    <span>Convert to Sentence Case</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setRemoveUrls(!removeUrls))}>
                 <div className="flex items-center">
                    <Switch className="mr-2" checked={removeUrls} />
                    <span>Remove URLs</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setRemoveLineNumbers(!removeLineNumbers))}>
                 <div className="flex items-center">
                    <ListOrdered className="mr-2 h-4 w-4" />
                    <Switch className="mr-2" checked={removeLineNumbers} />
                    <span>Remove Line Numbers</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setUseRegex(!useRegex))}>
                <div className="flex items-center">
                  <Regex className="mr-2 h-4 w-4" />
                  <Switch className="mr-2" checked={useRegex} />
                  <span>Use Regex</span>
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
              <CommandItem onSelect={() => runCommand(() => setTheme("minimal"))}>
                <Brush className="mr-2 h-4 w-4" />
                <span>Minimal</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("ocean"))}>
                <Droplets className="mr-2 h-4 w-4" />
                <span>Ocean</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("forest"))}>
                <Trees className="mr-2 h-4 w-4" />
                <span>Forest</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("gradient"))}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Gradient</span>
              </CommandItem>
               <CommandItem onSelect={() => runCommand(() => setTheme("glass"))}>
                <GlassWater className="mr-2 h-4 w-4" />
                <span>Glass</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
    </TooltipProvider>
  );
}

    