import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  onClear,
  width,
  style,
  className = '',
  inputStyle,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div
      className={`search-input-wrapper ${className}`}
      style={{
        width: width || undefined,
        ...style,
      }}
    >
      <Search size={14} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClear();
          }
        }}
        style={{
          paddingRight: value ? '30px' : '12px',
          ...inputStyle,
        }}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="btn-icon"
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '3px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export const SearchBar = SearchInput;
export default SearchInput;
