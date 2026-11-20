import React from 'react';
import { Search, X } from 'lucide-react';
import { PLACEHOLDERS } from './placeholders';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (e: any) => void;
  placeholder?: string;
  onClear?: () => void;
  width?: string | number;
  style?: React.CSSProperties;
  className?: string;
  inputStyle?: React.CSSProperties;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  placeholder = PLACEHOLDERS.general.search,
  onClear,
  width,
  style,
  className = '',
  inputStyle,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            width: '20px',
            height: '20px',
            color: 'var(--text-muted)',
          }}
          title="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
