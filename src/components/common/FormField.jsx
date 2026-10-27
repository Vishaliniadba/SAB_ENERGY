import React from 'react';

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
}) {
  const generatedId = id || (label ? `field-${String(label).toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

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
          <select
            id={generatedId}
            className="form-field-select"
            style={{
              paddingLeft: Icon ? '34px' : '12px',
              borderColor: error ? 'var(--status-danger-border)' : undefined,
              ...inputStyle,
            }}
            {...inputProps}
          >
            {options.map((opt, idx) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={idx} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        </div>
      ) : type === 'textarea' ? (
        <textarea
          id={generatedId}
          className="form-field-textarea"
          style={{
            borderColor: error ? 'var(--status-danger-border)' : undefined,
            ...inputStyle,
          }}
          {...inputProps}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          {Icon && (
            <div
              style={{
                position: 'absolute',
                left: '11px',
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
            className="form-field-input"
            style={{
              paddingLeft: Icon ? '34px' : '12px',
              paddingRight: suffix ? '44px' : '12px',
              borderColor: error ? 'var(--status-danger-border)' : undefined,
              ...inputStyle,
            }}
            {...inputProps}
          />
          {suffix && (
            <div
              style={{
                position: 'absolute',
                right: '11px',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
            >
              {suffix}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div
          className="form-field-error"
          style={{
            fontSize: '0.72rem',
            color: 'var(--status-danger-text)',
            fontWeight: 550,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{error}</span>
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
 * Convenient wrapper for text / number / date / email input fields
 */
export function InputField(props) {
  return <FormField {...props} />;
}

/**
 * Convenient wrapper for select dropdown fields
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
  ...selectProps
}) {
  const generatedId = id || (label ? `field-${String(label).toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

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
        <select
          id={generatedId}
          className="form-field-select"
          style={{
            paddingLeft: Icon ? '34px' : '12px',
            borderColor: error ? 'var(--status-danger-border)' : undefined,
            ...inputStyle,
          }}
          {...selectProps}
        >
          {children
            ? children
            : options?.map((opt, idx) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const lbl = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={idx} value={val}>
                    {lbl}
                  </option>
                );
              })}
        </select>
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
