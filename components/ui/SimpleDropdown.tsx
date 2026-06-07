'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SimpleDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function SimpleDropdown({ label, options, value, onChange, className = '' }: SimpleDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border rounded-lg text-sm text-text hover:border-border-strong transition-colors min-w-[140px] justify-between w-full"
      >
        <span className="truncate">{value || label}</span>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-bg-card border border-border rounded-lg z-50 overflow-hidden shadow-lg">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-text-muted">No options</p>
          )}
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bg-hover
                ${value === opt ? 'text-accent font-medium bg-accent-subtle' : 'text-text-muted'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
