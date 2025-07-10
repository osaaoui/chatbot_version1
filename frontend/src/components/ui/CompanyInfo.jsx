import React, { useState, useEffect } from "react";

const CompanyInfo = ({ companyName: propCompanyName, logoSrc: propLogoSrc, logoAlt = "Company Logo" }) => {
  const [companyData, setCompanyData] = useState({
    name: propCompanyName || 'TIA',
    logo: propLogoSrc || null
  });

  useEffect(() => {
    const savedData = localStorage.getItem('companyData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setCompanyData({
        name: parsedData.name || propCompanyName || 'TIA',
        logo: parsedData.logo || propLogoSrc
      });
    }

    const handleCompanyDataUpdate = (event) => {
      setCompanyData({
        name: event.detail.name || propCompanyName || 'TIA',
        logo: event.detail.logo || propLogoSrc
      });
    };

    window.addEventListener('companyDataUpdated', handleCompanyDataUpdate);
    return () => window.removeEventListener('companyDataUpdated', handleCompanyDataUpdate);
  }, [propCompanyName, propLogoSrc]);

  const getInitials = (name) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
  };

  return (
    <div className="flex items-center space-x-3">
      {companyData.logo ? (
        <img
          src={companyData.logo}
          alt={logoAlt}
          className="h-8 w-8 rounded-md object-cover border border-border-light"
        />
      ) : (
        <div className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center text-sm font-bold border border-border-light">
          {getInitials(companyData.name)}
        </div>
      )}
      
      <span className="text-xl font-medium text-heading">
        {companyData.name}
      </span>
    </div>
  );
};

export default CompanyInfo;