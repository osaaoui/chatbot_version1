import React from "react";
import { useCompany } from "../../context/CompanyContext";

const CompanyInfo = ({ logoAlt = "Company Logo" }) => {
  const { 
    companyName, 
    currentCompany, 
    companies, 
    selectCompany, 
    loading 
  } = useCompany();

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="w-24 h-4 bg-gray-200 rounded ml-2 animate-pulse"></div>
      </div>
    );
  }

  const companyLogo = currentCompany?.logo;
  const displayName = companyName || 'TIA';

  // Si hay múltiples empresas, mostrar selector
  if (companies.length > 1) {
    return (
      <div className="flex items-center">
        <img 
          src="/img/image4.png" 
          alt="Tia Landing" 
          className="logo w-24 rounded-md object-contain" 
        />
        
        <select
          value={currentCompany?.company_id || ''}
          onChange={(e) => selectCompany(e.target.value)}
          className="text-xl font-medium text-heading bg-transparent border-none outline-none cursor-pointer ml-2"
        >
          {companies.map((company) => (
            <option key={company.company_id} value={company.company_id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Si hay una sola empresa, mostrar normal
  return (
    <div className="flex items-center">
      <img 
        src="/img/image4.png" 
        alt="Tia Landing" 
        className="logo w-24 rounded-md object-contain" 
      />
      
      <span className="text-xl font-medium text-heading ml-2">
        {displayName}
      </span>
    </div>
  );
};

export default CompanyInfo;