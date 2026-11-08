import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, X, Search, Loader2 } from 'lucide-react';
import { locationService, LocationSuggestion } from '../../services/locationService';

interface IndianLocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/**
 * Indian Location Selector with debounced autocomplete backed by the
 * in-memory Indian administrative directory (all 36 States/UTs).
 *
 * Policy: Does NOT call Nominatim on every keystroke. All suggestions come
 * from the AccessMap backend's authoritative directory.
 */
export const IndianLocationSelector: React.FC<IndianLocationSelectorProps> = ({
  value,
  onChange,
  placeholder = 'City or State…',
  className = '',
  id,
  'aria-label': ariaLabel,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep local input in sync when value is reset externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    locationService.suggestDebounced(
      q,
      (results) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
        setIsLoading(false);
      },
      250
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    fetchSuggestions(val);
    // Propagate the raw typed text so parent can still filter by partial input
    onChange(val);
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    // Use city name if available, otherwise state
    const selectedValue = suggestion.city || suggestion.district || suggestion.state;
    setInputValue(selectedValue);
    onChange(selectedValue);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const getSuggestionLabel = (s: LocationSuggestion): string => {
    if (s.type === 'CITY' && s.city) {
      return s.district ? `${s.city}, ${s.district}, ${s.state}` : `${s.city}, ${s.state}`;
    }
    if (s.type === 'DISTRICT' && s.district) {
      return `${s.district} (District), ${s.state}`;
    }
    return s.state;
  };

  const getTypeColor = (type: LocationSuggestion['type']): string => {
    switch (type) {
      case 'CITY':
        return 'bg-teal-100 text-teal-700';
      case 'DISTRICT':
        return 'bg-blue-100 text-blue-700';
      case 'STATE':
        return 'bg-violet-100 text-violet-700';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-[#0F9D91] pointer-events-none z-10" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label={ariaLabel || placeholder}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
          className="w-full pl-9 pr-14 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-[#102A43]
                     placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F9D91]/40
                     focus:border-[#0F9D91] transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-[#0F9D91] animate-spin" />}
          {!isLoading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear location"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!isLoading && !inputValue && (
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl
                     max-h-64 overflow-y-auto py-1 divide-y divide-slate-50"
        >
          {suggestions.map((s, index) => (
            <li
              key={`${s.type}-${s.displayName}-${index}`}
              id={`location-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors text-sm
                ${index === activeIndex
                  ? 'bg-[#0F9D91]/10 text-[#102A43]'
                  : 'text-[#334E68] hover:bg-slate-50'
                }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#0F9D91] shrink-0" />
              <span className="flex-1 truncate">{getSuggestionLabel(s)}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${getTypeColor(s.type)}`}>
                {s.type}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && suggestions.length === 0 && !isLoading && inputValue.length >= 2 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Search className="w-4 h-4" />
            <span>No location found for "{inputValue}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

