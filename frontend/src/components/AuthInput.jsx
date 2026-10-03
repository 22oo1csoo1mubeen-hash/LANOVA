import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

const ICON_MAP = {
  user:     <User />,
  password: <Lock />,
  email:    <Mail />,
};

/**
 * AuthInput — reusable input component for auth forms.
 *
 * @param {string}   id
 * @param {string}   type         - "text" | "password" | "email"
 * @param {string}   placeholder
 * @param {string}   icon         - "user" | "password" | "email"
 * @param {string}   value
 * @param {function} onChange
 * @param {string}   error        - optional validation message
 * @param {boolean}  autoFocus
 */
export default function AuthInput({
  id,
  type = 'text',
  placeholder = '',
  icon,
  value,
  onChange,
  error,
  autoFocus = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <div className="auth-input-wrapper">
        {icon && (
          <span className="auth-input-icon" aria-hidden="true">
            {ICON_MAP[icon] ?? ICON_MAP['user']}
          </span>
        )}
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          autoComplete={isPassword ? 'current-password' : 'username'}
          className={`auth-input${isPassword ? ' has-toggle' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <Eye /> : <EyeOff />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="auth-input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
