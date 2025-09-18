'use client';

import React from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  className?: string;
  children?: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg max-w-md w-full mx-4 ${className}`}>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ className = '', children }) => {
  return (
    <div className={`px-6 py-4 border-b ${className}`}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  className?: string;
  children?: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ className = '', children }) => {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
};

interface DialogFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ className = '', children }) => {
  return (
    <div className={`px-6 py-4 border-t flex justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
};