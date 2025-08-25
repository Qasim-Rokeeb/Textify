
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { cleanText, TextSegment } from "@/ai/flows/clean-text";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Copy, Loader2, Sparkles, Sun, Moon, Command as CommandIcon, Undo2, Check, ChevronsUpDown, Brush, Droplets, Trees, Palette, GlassWater, Link2Off, CaseLower, Type, ListOrdered, Regex, Replace, CaseSensitive, FileDown, FileText, Share2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
  const [isOriginalCopied, setIsOriginalCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
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
  const [regexReplace, setRegexReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [screenReaderMessage, setScreenReaderMessage] = useState("");
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const findBarRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRevert();
      }
      if (e.key === "Escape" && useRegex) {
        e.preventDefault();
        setUseRegex(false);
      }
      if (e.key === "Tab" && useRegex && findBarRef.current) {
        const focusableElements = Array.from(
          findBarRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null); // Ensure element is visible

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const currentFocusIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || currentFocusIndex === -1) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement || currentFocusIndex === -1) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
 
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [useRegex, lastClean]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (useRegex && regexPattern && originalText) {
      try {
        const regex = new RegExp(regexPattern, caseSensitive ? 'g' : 'gi');
        const matches = originalText.match(regex);
        setMatchCount(matches ? matches.length : 0);
      } catch (e) {
        setMatchCount(0); // Invalid regex
      }
    } else {
      setMatchCount(0);
    }
  }, [originalText, regexPattern, useRegex, caseSensitive]);

  useEffect(() => {
    const handleHashChange = () => {
      try {
        if (window.location.hash.startsWith("#/s/")) {
          const encodedText = window.location.hash.substring(4);
          const decodedText = atob(encodedText);
          setOriginalText(decodedText);
          setCleanedText(decodedText);
          setDiff([{ value: decodedText, added: false, removed: false }]);
          setShowSlider(true);
          // Clear the hash to avoid re-processing if user cleans again
          history.replaceState(null, "", " ");
        }
      } catch (error) {
        console.error("Failed to decode text from URL hash:", error);
        toast({
          title: "Error",
          description: "Could not load text from the URL.",
          variant: "destructive",
        });
      }
    };
  
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
  
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [toast]);


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

  const handleCleanText = useCallback(async (isReplace: boolean = false) => {
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
      const result = await cleanText({ 
        text: originalText, 
        removeEmojis, 
        normalizeQuotes, 
        trimTrailingSpaces, 
        convertToLowercase, 
        convertToSentenceCase, 
        removeUrls, 
        removeLineNumbers, 
        useRegex, 
        regexPattern,
        regexReplace: isReplace ? regexReplace : undefined,
        caseSensitive,
      });
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
  }, [originalText, cleanedText, diff, isLoading, toast, removeEmojis, normalizeQuotes, trimTrailingSpaces, convertToLowercase, convertToSentenceCase, removeUrls, removeLineNumbers, useRegex, regexPattern, regexReplace, caseSensitive]);

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

  const handleShare = () => {
    if (!cleanedText) return;
    try {
      const encodedText = btoa(cleanedText);
      const url = new URL(window.location.href);
      url.hash = `#/s/${encodedText}`;
      navigator.clipboard.writeText(url.toString());
      toast({
        title: "Share link copied!",
        description: "A link to this text has been copied to your clipboard.",
      });
      setScreenReaderMessage("Shareable link copied to clipboard.");
      setIsShareCopied(true);
      setTimeout(() => {
        setIsShareCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        title: "Error",
        description: "Could not create a shareable link.",
        variant: "destructive",
      });
      setScreenReaderMessage("Error creating shareable link.");
    }
  };

  const handleExportTxt = () => {
    if (!cleanedText) return;
    const blob = new Blob([cleanedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cleaned-text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported as .txt",
      description: "The cleaned text has been downloaded.",
    });
    setScreenReaderMessage("Cleaned text exported as a .txt file.");
  };

  const handleExportMd = () => {
    if (!cleanedText) return;
    const blob = new Blob([cleanedText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cleaned-text.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported as .md",
      description: "The cleaned text has been downloaded.",
    });
    setScreenReaderMessage("Cleaned text exported as a .md file.");
  };

  const handleCopyOriginal = () => {
    if (!originalText) return;
    navigator.clipboard.writeText(originalText);
    toast({
      title: "Copied original text!",
      description: "The original text has been copied.",
    });
    setScreenReaderMessage("Original text copied to clipboard.");
    setIsOriginalCopied(true);
    setTimeout(() => {
      setIsOriginalCopied(false);
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
      const regex = new RegExp(regexPattern, caseSensitive ? 'g' : 'gi');
      return originalText.split(regex).flatMap((part, i) => {
        if (i === 0) return [part];
        const matches = originalText.match(regex);
        const match = matches?.[i - 1] || '';
        return [<span key={`match-${i}`} className="border-b-2 border-yellow-400 dark:border-yellow-600">{match}</span>, part];
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
                  <div ref={findBarRef} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                    <Input
                      id="regex-pattern"
                      placeholder="Enter regex pattern..."
                      value={regexPattern}
                      onChange={(e) => setRegexPattern(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    <Input
                      id="regex-replace"
                      placeholder="Replace with..."
                      value={regexReplace}
                      onChange={(e) => setRegexReplace(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                     <div className="flex items-center space-x-2">
                      <Switch id="case-sensitive" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                      <Label htmlFor="case-sensitive">Case-Sensitive</Label>
                    </div>
                     {regexPattern && (
                        <Badge variant="secondary" className="whitespace-nowrap">
                            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                        </Badge>
                     )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleCopyOriginal}
                        disabled={!originalText.trim()}
                        className="w-full sm:w-auto"
                        size="lg"
                      >
                        {isOriginalCopied ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Original
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy the original text to your clipboard.</p>
                    </TooltipContent>
                  </Tooltip>
                {useRegex && regexPattern ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowReplaceConfirm(true)}
                        disabled={isLoading || !originalText.trim()}
                        className="w-full sm:w-auto"
                        size="lg"
                        variant="destructive"
                        id="replace-all-button"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Replacing...
                          </>
                        ) : (
                          <>
                            <Replace className="mr-2 h-4 w-4" />
                            Replace All
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Replace all matches of the regex pattern.</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleCleanText(false)}
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
                )}
                 <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isLoading || !cleanedText.trim()}
                                    className="w-full sm:w-auto"
                                    size="lg"
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Export cleaned text.</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportTxt}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Export as .txt</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportMd}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Export as .md</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      disabled={isLoading || !cleanedText.trim()}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {isShareCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy a shareable link to the cleaned text.</p>
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
              <CommandItem onSelect={() => runCommand(() => handleCleanText(false))} disabled={isLoading || !originalText.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Clean Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleCopy)} disabled={isLoading || !cleanedText.trim()}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Cleaned Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleCopyOriginal)} disabled={!originalText.trim()}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Original Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleShare)} disabled={isLoading || !cleanedText.trim()}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share Text</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleExportTxt)} disabled={isLoading || !cleanedText.trim()}>
                <FileDown className="mr-2 h-4 w-4" />
                <span>Export as .txt</span>
              </CommandItem>
               <CommandItem onSelect={() => runCommand(handleExportMd)} disabled={isLoading || !cleanedText.trim()}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as .md</span>
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
                    <Type className="mr-2 h-4 w-4" />
                    <span>Convert to Sentence Case</span>
                 </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setRemoveUrls(!removeUrls))}>
                 <div className="flex items-center">
                    <Link2Off className="mr-2 h-4 w-4" />
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
              <CommandItem onSelect={() => runCommand(() => setCaseSensitive(!caseSensitive))}>
                <div className="flex items-center">
                  <CaseSensitive className="mr-2 h-4 w-4" />
                  <Switch className="mr-2" checked={caseSensitive} />
                  <span>Case-Sensitive Regex</span>
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
      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all occurrences of the pattern in the text. This action cannot be undone after another cleaning action has been performed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowReplaceConfirm(false);
                handleCleanText(true);
              }}
            >
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

    
