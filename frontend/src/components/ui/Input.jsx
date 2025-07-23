import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = ({
  type = "text",
  value = "",
  onChange,
  placeholder = null,
  label = null,
  name = "",
  disabled = false,
  required = false,
  error = null,
  success = null,
  allowNumbers = true,
  allowLetters = true,
  allowSpecialChars = false,
  maxLength = 255,
  minLength = 0,
  validateInput = true,
  showPasswordToggle = true,
  autoComplete = "off",
  translationKey = "input",
  className = "",
  id = null,
  size = "md", // sm, md, lg
  variant = "default", // default, filled, outlined
  ...props
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const finalPlaceholder = placeholder || (label ? `${t('common.enter')} ${label.toLowerCase()}` : '');
  const inputId = id || `input-${name}` || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sanitizeInput = (input) => {
    if (!validateInput) return input;

    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover tags script
      .replace(/<[^>]*>?/gm, '') // Remover tags HTML
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+\s*=/gi, '') // Remover event handlers
      .replace(/expression\s*\(/gi, '') // Remover CSS expressions
      .replace(/vbscript:/gi, '') // Remover vbscript:
      .replace(/data:/gi, ''); // Remover data URLs

    // Validar tipos de caracteres permitidos
    let pattern = '';
    if (allowLetters) pattern += 'a-zA-ZÀ-ÿ\\u00f1\\u00d1\\s'; // Incluye acentos y ñ
    if (allowNumbers) pattern += '0-9';
    if (allowSpecialChars) pattern += '\\-_\\.@#$%&*+=!?';

    if (pattern) {
      const regex = new RegExp(`[^${pattern}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }

    // Aplicar límite de longitud
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  };

  // Función para validar en tiempo real
  const isValidInput = (input) => {
    if (!validateInput) return true;

    // Verificar patrones maliciosos
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:/i,
      /<[^>]*>/,
      /[<>'"]/
    ];

    return !maliciousPatterns.some(pattern => pattern.test(input));
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    if (!isValidInput(inputValue)) {
      return;
    }

    const sanitizedValue = sanitizeInput(inputValue);
    
    // Crear evento sintético con valor sanitizado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue,
        name: name
      }
    };

    onChange && onChange(syntheticEvent);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
      setTimeout(() => {
        const input = e.target;
        const sanitized = sanitizeInput(input.value);
        if (input.value !== sanitized) {
          input.value = sanitized;
          const syntheticEvent = {
            target: {
              value: sanitized,
              name: name
            }
          };
          onChange && onChange(syntheticEvent);
        }
      }, 0);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'filled':
        return 'border-0 bg-tertiary';
      case 'outlined':
        return 'border-2 bg-transparent';
      default:
        return 'border bg-primary';
    }
  };

  const inputType = (type === 'password' && showPassword) ? 'text' : type;

  const inputClasses = `
    input-base w-full transition-all duration-200
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text'}
    ${error ? 'border-error focus:border-error focus:ring-error' : ''}
    ${success ? 'border-success focus:border-success focus:ring-success' : ''}
    ${isFocused && !error && !success ? 'border-primary-dark focus:ring-primary' : ''}
    ${type === 'password' && showPasswordToggle ? 'pr-10' : ''}
    ${className}
  `.trim();

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-error)' }} className="ml-1">*</span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type={inputType}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={finalPlaceholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          autoComplete={autoComplete}
          spellCheck="false"
          className={inputClasses}
          style={{
            backgroundColor: variant === 'filled' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
            borderColor: error 
              ? 'var(--color-error)' 
              : success 
                ? 'var(--color-success)' 
                : isFocused 
                  ? 'var(--color-primary-dark)' 
                  : 'var(--border-medium)',
            color: 'var(--text-primary)',
            boxShadow: isFocused 
              ? error 
                ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                : success 
                  ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                  : '0 0 0 3px rgba(59, 130, 246, 0.1)'
              : 'none'
          }}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            style={{ 
              color: 'var(--text-secondary)',
              opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Error/Success Icon */}
        {(error || success) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle 
              size={18} 
              style={{ 
                color: error ? 'var(--color-error)' : 'var(--color-success)' 
              }} 
            />
          </div>
        )}
      </div>

      {/* Helper Text / Error Message / Success Message */}
      {(error || success) && (
        <div className="mt-1.5">
          {error && (
            <p 
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-error)' }}
            >
              <AlertCircle size={12} />
              {error}
            </p>
          )}
          {success && !error && (
            <p 
              className="text-xs"
              style={{ color: 'var(--color-success)' }}
            >
              {success}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Input;