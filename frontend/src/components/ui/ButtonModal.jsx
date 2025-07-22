import React, { useState, useRef, useEffect } from "react";

const ButtonModal = ({ 
  trigger, 
  children, 
  className = "", 
  dropdownClassName = "",
  position = "right",
  width = "w-64",
  zIndex = "z-[9999]"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "left-0";
      case "center":
        return "left-1/2 transform -translate-x-1/2";
      case "right":
      default:
        return "right-0";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${getPositionClasses()} mt-2 ${width} rounded-lg overflow-hidden ${zIndex} ${dropdownClassName}`}
        >
          {React.cloneElement(children, { 
            isOpen, 
            setIsOpen,
            closeModal: () => setIsOpen(false)
          })}
        </div>
      )}
    </div>
  );
};

export default ButtonModal;