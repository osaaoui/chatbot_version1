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

  return (
    <div className="flex items-center">
      {companyData.logo ? (
        <img
          src={companyData.logo}
          alt={logoAlt}
          className="h-8 w-8 rounded-md object-cover border border-border-light"
        />
      ) : (
       <img 
         src="/img/image4.png" 
         alt="Tia Landing" 
         className="logo w-24 rounded-md object-contain " 
       />
      )}
      
      <span className="text-xl font-medium text-heading">
        {companyData.name}
      </span>
    </div>
  );
};

export default CompanyInfo;