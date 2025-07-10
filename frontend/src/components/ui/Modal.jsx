import React from 'react';

const Modal = ({ isOpen, onClose, children, buttons = [], size = 'default' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 1000 }}>
      <div className={`bg-card shadow-strong ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-auto`}>
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="text-caption hover:text-body text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="px-6 pb-4">
          {children}
        </div>
        
        {buttons.length > 0 && (
          <div className="flex gap-2 justify-end p-4 pt-0">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={button.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;