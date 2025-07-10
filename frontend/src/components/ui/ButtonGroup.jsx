import React from 'react';

const ButtonGroup = ({ 
  buttons, 
  className = '', 
  spacing = 'sm',
  direction = 'horizontal' 
}) => {
  const getSpacingClass = () => {
    const spacingMap = {
      xs: 'gap-xs',
      sm: 'gap-sm', 
      md: 'gap-md',
      lg: 'gap-lg'
    };
    return spacingMap[spacing] || 'gap-sm';
  };

  const getDirectionClass = () => {
    return direction === 'vertical' ? 'flex-col' : 'flex-row';
  };

  const getButtonClass = (button) => {
    const baseClass = 'btn-base';
    
    switch (button.variant || 'primary') {
      case 'secondary':
        return `${baseClass} btn-secondary`;
      case 'success':
        return `${baseClass} bg-success text-white hover:opacity-90`;
      case 'warning':
        return `${baseClass} bg-warning text-white hover:opacity-90`;
      case 'error':
        return `${baseClass} bg-error text-white hover:opacity-90`;
      case 'info':
        return `${baseClass} bg-info text-white hover:opacity-90`;
      default:
        return `${baseClass} btn-header`;
    }
  };

  return (
    <div className={`flex ${getDirectionClass()} ${getSpacingClass()} ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={button.key || index}
          className={`${getButtonClass(button)} ${button.className || ''}`}
          onClick={button.onClick}
          disabled={button.disabled}
          type={button.type || 'button'}
          title={button.title}
        >
          {button.icon && (
            <span className="inline-flex items-center justify-center w-4 h-4">
              {button.icon}
            </span>
          )}
          {button.text && (
            <span className={button.icon ? 'ml-xs' : ''}>
              {button.text}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;