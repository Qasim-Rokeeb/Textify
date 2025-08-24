
import * as React from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = React.ComponentProps<'textarea'> & {
  setScrollTop?: (scrollTop: number) => void;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, setScrollTop, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    React.useImperativeHandle(ref, () => Object.assign(combinedRef.current!, {
        setScrollTop: (scrollTop: number) => {
            if (combinedRef.current) {
                combinedRef.current.scrollTop = scrollTop;
            }
        }
    }));


    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (combinedRef.current) {
        combinedRef.current.style.height = 'auto';
        combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
      }
      if (onChange) {
        onChange(event);
      }
    };

    React.useLayoutEffect(() => {
        if (combinedRef.current) {
            combinedRef.current.style.height = 'auto';
            combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
        }
    }, [props.value, combinedRef]);


    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-base overflow-hidden transition-height duration-200 ease-in-out',
          className
        )}
        ref={combinedRef}
        onChange={handleInput}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
