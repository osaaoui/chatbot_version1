import React from 'react';

const Separator = ({ 
  orientation = "horizontal", 
  className = "",
  ...props 
}) => {
  const orientationClasses = orientation === "horizontal" 
    ? "h-px w-full" 
    : "w-px h-full min-h-6";
  
  return (
    <div
      className={`bg-border-medium flex-shrink-0 ${orientationClasses} ${className}`}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
};

export default Separator;