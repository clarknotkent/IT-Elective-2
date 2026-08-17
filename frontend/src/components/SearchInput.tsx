import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', id = 'search-input' }: SearchInputProps) {
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    const timer = setTimeout(() => onChange(input), 300);
    return () => clearTimeout(timer);
  }, [input, onChange]);

  useEffect(() => { setInput(value || ''); }, [value]);

  return (
    <div className="relative flex items-center">
      <span className="absolute left-[14px] opacity-45 pointer-events-none">
        <Search size={15} strokeWidth={2.75} />
      </span>
      <label htmlFor={id} className="sr-only">Search</label>
      <input
        id={id}
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-[290px] pl-[38px] pr-4 py-2 bg-surface border border-divider rounded-pill text-base text-ink caret-accent-500 placeholder:text-ink/45 hover:border-ink/45 focus:outline-none focus-visible:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/20"
      />
    </div>
  );
}
