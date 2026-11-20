import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { PLACEHOLDERS } from './placeholders';
import './select2.css';

export interface Select2Option {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface Select2Props {
  value?: string;
  onChange: (value: string) => void;
  options: (string | Select2Option)[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  required?: boolean;
  usePortal?: boolean;
}

export const Select2: React.FC<Select2Props> = ({
  value = '',
  onChange,
  options = [],
  placeholder = PLACEHOLDERS.general.select,
  searchable,
  clearable = false,
  disabled = false,
  className = '',
  style = {},
  size = 'md',
  id,
  name,
  required = false,
  usePortal = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({ top: 0, left: 0, width: 0, openUpward: false });

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalise options to standard Select2Option format
  const normalisedOptions: Select2Option[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Determine if search should be enabled (default: true if >= 4 options)
  const isSearchable = searchable !== undefined ? searchable : normalisedOptions.length >= 4;

  // Selected Option
  const selectedOption = useMemo(() => {
    return normalisedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalisedOptions, value]);

  // Filtered Options based on Search Term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalisedOptions;
    const q = searchTerm.toLowerCase().trim();
    return normalisedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalisedOptions, searchTerm]);

  // Calculate coordinates for portal placement
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(260, (filteredOptions.length + 1) * 38 + 50);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownPosition({
      top: openUpward ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }, [filteredOptions.length]);

  // Open handler
  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchTerm('');
    const curIdx = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
    setHighlightedIndex(curIdx >= 0 ? curIdx : 0);
  };

  // Close handler
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Toggle
  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Selection
  const handleSelect = (val: string) => {
    onChange(val);
    handleClose();
    triggerRef.current?.focus();
  };

  // Clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    handleClose();
  };

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // Auto-focus search input if searchable
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 30);
    }
  }, [isOpen, updatePosition]);

  // Window resize & scroll listeners to reposition or close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      // Don't close if scrolling inside dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        handleClose();
        break;
    }
  };

  // Render Dropdown Content
  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownStyle: React.CSSProperties = usePortal
      ? {
          position: 'fixed',
          top: dropdownPosition.openUpward ? undefined : `${dropdownPosition.top}px`,
          bottom: dropdownPosition.openUpward
            ? `${window.innerHeight - dropdownPosition.top}px`
            : undefined,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 999999,
        }
      : {
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 9999,
        };

    const content = (
      <div
        ref={dropdownRef}
        className={`select2-dropdown-container ${
          dropdownPosition.openUpward ? 'open-upward' : 'open-downward'
        }`}
        style={dropdownStyle}
        onKeyDown={handleKeyDown}
        role="listbox"
      >
        {/* Select2 Embedded Search Filter */}
        {isSearchable && (
          <div className="select2-search-wrapper">
            <Search size={14} className="select2-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Type to search..."
              className="select2-search-input"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="select2-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        <div className="select2-options-list">
          {filteredOptions.length === 0 ? (
            <div className="select2-no-results">No matches found</div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value || idx}
                  className={`select2-option-item ${
                    isSelected ? 'selected' : ''
                  } ${isHighlighted ? 'highlighted' : ''} ${
                    opt.disabled ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    if (!opt.disabled) {
                      handleSelect(opt.value);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="select2-option-content">
                    <span className="select2-option-label">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="select2-option-sublabel">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  <div className="select2-option-meta">
                    {opt.badge && (
                      <span className="select2-option-badge">{opt.badge}</span>
                    )}
                    {isSelected && (
                      <Check size={14} className="select2-check-icon" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );

    return usePortal ? createPortal(content, document.body) : content;
  };

  return (
    <div
      className={`select2-wrapper select2-size-${size} ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Hidden input for native form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          id={id}
        />
      )}

      {/* Select2 Trigger Box */}
      <div
        ref={triggerRef}
        className={`select2-trigger ${isOpen ? 'open' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="select2-rendered-value">
          {selectedOption ? (
            <span className="select2-value-text">{selectedOption.label}</span>
          ) : (
            <span className="select2-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="select2-controls">
          {clearable && value && !disabled && (
            <button
              type="button"
              className="select2-clear-btn"
              onClick={handleClear}
              title="Clear selection"
              tabIndex={-1}
            >
              <X size={13} />
            </button>
          )}

          <ChevronDown
            size={14}
            className={`select2-arrow-icon ${isOpen ? 'open' : ''}`}
          />
        </div>
      </div>

      {/* Floating Select2 Dropdown */}
      {renderDropdown()}
    </div>
  );
};

