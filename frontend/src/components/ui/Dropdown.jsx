import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Dropdown = ({ 
  options = [],
  value,
  onChange,
  placeholder = null, 
  searchPlaceholder = null, 
  noResultsText = null, 
  valueKey = "id",
  labelKey = "name",
  disabled = false,
  searchable = true,
  translationKey = "dropdown",
  allowNumbers = true,
  allowLetters = true,
  allowSpecialChars = false,
  maxLength = 50,
  validateInput = true
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const finalPlaceholder = placeholder || t('dropdown.search');
  const finalSearchPlaceholder = searchPlaceholder || t('dropdown.search');
  const finalNoResultsText = noResultsText || t('dropdown.noResults');

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
    if (allowSpecialChars) pattern += '\\-_\\.@';

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

  const filteredOptions = searchable 
    ? options.filter(option =>
        option[labelKey]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => 
    option[valueKey]?.toString() === value?.toString()
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    const inputValue = e.target.value;
    
    if (!isValidInput(inputValue)) {
      return;
    }

    const sanitizedValue = sanitizeInput(inputValue);
    setSearchTerm(sanitizedValue);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
      setTimeout(() => {
        const input = e.target;
        const sanitized = sanitizeInput(input.value);
        if (input.value !== sanitized) {
          input.value = sanitized;
          setSearchTerm(sanitized);
        }
      }, 0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`input-base w-full flex items-center justify-between text-left transition-all duration-200 ${
          disabled 
            ? 'opacity-60 cursor-not-allowed' 
            : 'cursor-pointer hover:border-color-transition'
        } ${
          isOpen 
            ? 'border-color-primary focus-ring' 
            : ''
        }`}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: isOpen ? 'var(--color-primary-dark)' : 'var(--border-medium)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          '--hover-border-color': 'var(--border-dark)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>
          {selectedOption ? selectedOption[labelKey] : finalPlaceholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {isOpen && !disabled && (
        <div 
          className="absolute left-0 right-0 mt-1 rounded-md shadow-lg z-50 max-h-60 overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {searchable && (
            <div 
              className="p-2"
              style={{
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <input
                type="text"
                placeholder={finalSearchPlaceholder}
                className="w-full px-3 py-1 text-sm rounded transition-colors duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  '--focus-border-color': 'var(--color-primary-dark)',
                  '--focus-ring-color': 'rgba(59, 130, 246, 0.1)'
                }}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary-dark)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={maxLength}
                autoComplete="off"
                spellCheck="false"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-40 overflow-y-auto dropdown-scroll">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value?.toString() === option[valueKey]?.toString();
                return (
                  <button
                    key={option[valueKey]}
                    type="button"
                    className="w-full text-left px-3 py-2 flex items-center justify-between transition-colors duration-150"
                    style={{
                      backgroundColor: isSelected 
                        ? 'var(--color-secondary)' 
                        : 'transparent',
                      color: isSelected 
                        ? 'var(--text-primary)' 
                        : 'var(--text-primary)'
                    }}
                    onClick={() => handleSelect(option[valueKey])}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{option[labelKey]}</span>
                    {isSelected && (
                      <Check 
                        className="w-4 h-4" 
                        style={{ color: 'var(--text-primary)' }}
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div 
                className="px-3 py-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {finalNoResultsText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;