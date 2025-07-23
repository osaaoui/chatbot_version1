import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CustomDropdown = ({ 
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
  translationKey = "dropdown" 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const finalPlaceholder = placeholder || t('dropdown.search');
  const finalSearchPlaceholder = searchPlaceholder || t('dropdown.search');
  const finalNoResultsText = noResultsText || t('dropdown.noResults');

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
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary-dark)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
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

export default CustomDropdown;