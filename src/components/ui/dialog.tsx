<<<<<<< Updated upstream
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
=======
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
>>>>>>> Stashed changes

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

<<<<<<< Updated upstream
=======
interface DialogContentProps extends React.ComponentProps<"div"> {
  onClose?: () => void;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

>>>>>>> Stashed changes
function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
<<<<<<< Updated upstream
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      <div
        className="relative z-50 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
=======
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
>>>>>>> Stashed changes
  );
}

function DialogContent({
  className,
  children,
<<<<<<< Updated upstream
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-xl border border-slate-200/80 relative",
        "max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="p-6 sm:p-8">
        {children}
      </div>
=======
  onClose,
  ...props
}: DialogContentProps) {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <div
      className={cn(
        "relative z-50 w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {onClose && (
        <button
          onClick={() => {
            onClose();
            onOpenChange(false);
          }}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
>>>>>>> Stashed changes
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
<<<<<<< Updated upstream
    <div className={cn("mb-6 pr-8", className)} {...props} />
=======
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
>>>>>>> Stashed changes
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
<<<<<<< Updated upstream
      className={cn("text-xl font-semibold text-slate-900 tracking-tight", className)}
=======
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
>>>>>>> Stashed changes
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
<<<<<<< Updated upstream
      className={cn("text-sm text-slate-600 mt-2 leading-relaxed", className)}
=======
      className={cn("text-sm text-muted-foreground", className)}
>>>>>>> Stashed changes
      {...props}
    />
  );
}

<<<<<<< Updated upstream
function DialogClose({
  className,
  onClose,
  ...props
}: React.ComponentProps<"button"> & { onClose?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "absolute right-6 top-6 z-10 rounded-md p-1.5 text-slate-400",
        "hover:bg-slate-100 hover:text-slate-600",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      {...props}
    >
      <X className="h-5 w-5" />
      <span className="sr-only">Close</span>
    </button>
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200", className)}
=======
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
>>>>>>> Stashed changes
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
<<<<<<< Updated upstream
  DialogClose,
=======
>>>>>>> Stashed changes
  DialogFooter,
};
