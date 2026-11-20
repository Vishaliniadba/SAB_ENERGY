import React from 'react';
import { Select2, Select2Option, Select2Props } from './Select2';
import { PLACEHOLDERS, getSmartPlaceholder } from './placeholders';

export { Select2, PLACEHOLDERS, getSmartPlaceholder };
export type { Select2Option, Select2Props };

export interface Select2FieldProps extends Omit<Select2Props, 'className' | 'style'> {
  label?: React.ReactNode;
  required?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enterprise Select2Field Component
 * Integrates Select2 with standardized labels, required marks, error, and hints.
 */
export function Select2Field({
  label,
  required = false,
  error,
  hint,
  className = '',
  style = {},
  ...select2Props
}: Select2FieldProps) {
  return (
    <div
      className={`form-field-group ${className}`.trim()}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}
    >
      {label && (
        <label
          className="form-field-label"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            userSelect: 'none',
          }}
        >
          <span>{label}</span>
          {required && (
            <span
              style={{ color: 'var(--status-danger-text)', fontWeight: 700, marginLeft: '3px' }}
              title="Required field"
            >
              *
            </span>
          )}
        </label>
      )}

      <Select2 {...select2Props} />

      {error ? (
        <div
          className="form-field-error"
          style={{ fontSize: '0.72rem', color: 'var(--status-danger-text)', fontWeight: 550 }}
        >
          {error}
        </div>
      ) : hint ? (
        <div className="form-field-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  required?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: any;
  suffix?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  type?: string;
  options?: any[];
  [key: string]: any;
}

/**
 * Enterprise FormField Component
 * Standardizes form inputs, labels, required indicators, icons, hints, and error messaging.
 */
export function FormField({
  label,
  required = false,
  error,
  hint,
  icon: Icon,
  suffix,
  className = '',
  style = {},
  inputStyle = {},
  children,
  id,
  type = 'text',
  options = [],
  ...inputProps
}: FormFieldProps) {
  const generatedId = id || (label ? `field-${String(label).toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const resolvedPlaceholder = inputProps.placeholder ?? (typeof label === 'string' ? getSmartPlaceholder(label, type) : undefined);

  return (
    <div className={`form-field-group ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          htmlFor={generatedId}
          className="form-field-label"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            userSelect: 'none',
          }}
        >
          <span>{label}</span>
          {required && (
            <span style={{ color: 'var(--status-danger-text)', fontWeight: 700, marginLeft: '3px' }} title="Required field">
              *
            </span>
          )}
        </label>
      )}

      {children ? (
        children
      ) : type === 'select' ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <Select2
            id={generatedId}
            name={inputProps.name}
            value={inputProps.value !== undefined ? String(inputProps.value) : ''}
            onChange={(val) => {
              if (inputProps.onChange) {
                const syntheticEvent = {
                  target: { value: val, name: inputProps.name || '', id: generatedId },
                  currentTarget: { value: val, name: inputProps.name || '', id: generatedId },
                  stopPropagation: () => {},
                  preventDefault: () => {},
                };
                (inputProps.onChange as any)(syntheticEvent);
              }
            }}
            options={options.map((opt) => {
              if (typeof opt === 'string') return opt;
              return {
                value: String(opt.value ?? opt.id ?? ''),
                label: String(opt.label ?? opt.name ?? opt.value ?? ''),
                sublabel: opt.sublabel,
                badge: opt.badge,
                disabled: opt.disabled,
              };
            })}
            placeholder={resolvedPlaceholder || PLACEHOLDERS.general.select}
            disabled={inputProps.disabled}
            searchable={options.length >= 4}
            style={inputStyle}
          />
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%' }}>
          {Icon && (
            <div
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon size={15} />
            </div>
          )}
          <input
            id={generatedId}
            type={type}
            placeholder={resolvedPlaceholder}
            className={`form-field-input ${type === 'number' || (inputProps.className || '').includes('mono-num') ? 'mono-num' : ''}`}
            style={{
              paddingLeft: Icon ? '34px' : '12px',
              paddingRight: suffix ? '36px' : '12px',
              borderColor: error ? 'var(--status-danger-border)' : undefined,
              ...inputStyle,
            }}
            {...inputProps}
          />
          {suffix && (
            <span
              style={{
                position: 'absolute',
                right: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                fontWeight: 600,
              }}
            >
              {suffix}
            </span>
          )}
        </div>
      )}

      {error ? (
        <div className="form-field-error" style={{ fontSize: '0.72rem', color: 'var(--status-danger-text)', fontWeight: 550 }}>
          {error}
        </div>
      ) : hint ? (
        <div className="form-field-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Convenient wrapper for standard text/number input fields
 */
export function InputField(props: FormFieldProps) {
  return <FormField {...props} />;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode;
  options?: any[];
  icon?: any;
  error?: React.ReactNode;
  inputStyle?: React.CSSProperties;
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
}

// Recursive extractor for React node children to prevent array.toString() comma artifacts
const extractTextFromReactNode = (node: any): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('');
  }
  if (React.isValidElement(node) && node.props) {
    return extractTextFromReactNode((node.props as any).children);
  }
  return '';
};

/**
 * Convenient wrapper for select dropdown fields (powered by enterprise Select2)
 */
export function SelectField({
  children,
  options,
  icon: Icon,
  error,
  inputStyle = {},
  id,
  label,
  required,
  hint,
  style,
  className,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = id || (label ? `field-${String(label).toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const resolvedPlaceholder = placeholder || (typeof label === 'string' ? `Select ${label}...` : PLACEHOLDERS.general.select);

  // Normalise options if provided or parse from child <option> tags
  const select2Options: (string | Select2Option)[] = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === 'string') return opt;
        return {
          value: String(opt.value ?? opt.id ?? ''),
          label: String(opt.label ?? opt.name ?? opt.value ?? ''),
          sublabel: opt.sublabel,
          badge: opt.badge,
          disabled: opt.disabled,
        };
      });
    }
    if (children) {
      const parsed: (string | Select2Option)[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const props = child.props as any;
          const val = props.value !== undefined ? String(props.value) : '';
          let lbl = extractTextFromReactNode(props.children);
          if (!lbl.trim()) lbl = val;
          lbl = lbl.replace(/\s+/g, ' ').trim();
          parsed.push({ value: val, label: lbl, disabled: props.disabled });
        }
      });
      if (parsed.length > 0) return parsed;
    }
    return [];
  }, [options, children]);

  const handleSelect2Change = (val: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: val, name: selectProps.name || '', id: generatedId },
        currentTarget: { value: val, name: selectProps.name || '', id: generatedId },
        stopPropagation: () => {},
        preventDefault: () => {},
      };
      (onChange as any)(syntheticEvent);
    }
  };

  return (
    <div className={`form-field-group ${className || ''}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          htmlFor={generatedId}
          className="form-field-label"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            userSelect: 'none',
          }}
        >
          <span>{label}</span>
          {required && (
            <span style={{ color: 'var(--status-danger-text)', fontWeight: 700, marginLeft: '3px' }} title="Required field">
              *
            </span>
          )}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <Select2
          id={generatedId}
          name={selectProps.name}
          value={value !== undefined ? String(value) : ''}
          onChange={handleSelect2Change}
          options={select2Options}
          placeholder={placeholder}
          disabled={disabled || (selectProps as any).disabled}
          searchable={select2Options.length >= 4}
          style={inputStyle}
        />
      </div>

      {error ? (
        <div className="form-field-error" style={{ fontSize: '0.72rem', color: 'var(--status-danger-text)', fontWeight: 550 }}>
          {error}
        </div>
      ) : hint ? (
        <div className="form-field-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export default FormField;
