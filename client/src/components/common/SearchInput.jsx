import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

/** Debounced search box. Calls onSearch(value) 300 ms after typing stops. */
export default function SearchInput({ value = '', onSearch, placeholder = 'Search…', delay = 300, className = '' }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (text === value) return undefined;
    const t = setTimeout(() => onSearch(text.trim()), delay);
    return () => clearTimeout(t);
  }, [text, value, delay, onSearch]);

  return (
    <div className={`input-icon ${className}`} style={{ minWidth: 220 }}>
      <Search size={17} />
      <input
        type="search"
        className="form-control has-action"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={placeholder}
      />
      {text && (
        <button type="button" className="input-action" onClick={() => setText('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
