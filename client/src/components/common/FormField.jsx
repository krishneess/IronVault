import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Labelled input with optional leading icon, inline error and hint.
 * Pass `as="select"` / `as="textarea"` for other controls; extra props go to the control.
 */
export default function FormField({
  label,
  error,
  hint,
  icon: Icon,
  as = 'input',
  className = '',
  children,
  required,
  ...props
}) {
  const autoId = useId();
  const id = props.id || autoId;
  const Control = as;
  const controlClass = `${as === 'select' ? 'form-select' : 'form-control'} ${error ? 'is-invalid' : ''}`;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-gold ms-1">*</span>}
        </label>
      )}
      <div className={Icon ? 'input-icon' : undefined}>
        {Icon && <Icon size={17} />}
        <Control
          id={id}
          className={controlClass}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          required={required}
          {...props}
        >
          {children}
        </Control>
      </div>
      {error ? (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      ) : (
        hint && (
          <div id={`${id}-hint`} className="form-text" style={{ fontSize: '.76rem' }}>
            {hint}
          </div>
        )
      )}
    </div>
  );
}

export function PasswordField({ label = 'Password', error, hint, icon: Icon, className = '', required, ...props }) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const id = props.id || autoId;
  return (
    <div className={`mb-3 ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="text-gold ms-1">*</span>}
      </label>
      <div className="input-icon">
        {Icon && <Icon size={17} />}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`form-control has-action ${error ? 'is-invalid' : ''}`}
          style={Icon ? undefined : { paddingLeft: '.9rem' }}
          aria-invalid={Boolean(error)}
          required={required}
          {...props}
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : hint && <div className="form-text" style={{ fontSize: '.76rem' }}>{hint}</div>}
    </div>
  );
}
