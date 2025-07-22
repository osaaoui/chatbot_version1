import React, { forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../context/CompanyContext';

const COUNTRIES = [
  { id: 1, name: "Afghanistan" }, { id: 2, name: "Albania" }, { id: 3, name: "Algeria" },
  { id: 4, name: "Andorra" }, { id: 5, name: "Angola" }, { id: 6, name: "Argentina" },
  { id: 7, name: "Armenia" }, { id: 8, name: "Australia" }, { id: 9, name: "Austria" },
  { id: 10, name: "Azerbaijan" }, { id: 11, name: "Bahamas" }, { id: 12, name: "Bahrain" },
  { id: 13, name: "Bangladesh" }, { id: 14, name: "Barbados" }, { id: 15, name: "Belarus" },
  { id: 16, name: "Belgium" }, { id: 17, name: "Belize" }, { id: 18, name: "Benin" },
  { id: 19, name: "Bhutan" }, { id: 20, name: "Bolivia" }, { id: 21, name: "Bosnia and Herzegovina" },
  { id: 22, name: "Botswana" }, { id: 23, name: "Brazil" }, { id: 24, name: "Brunei" },
  { id: 25, name: "Bulgaria" }, { id: 26, name: "Burkina Faso" }, { id: 27, name: "Burundi" },
  { id: 28, name: "Cambodia" }, { id: 29, name: "Cameroon" }, { id: 30, name: "Canada" },
  { id: 31, name: "Cape Verde" }, { id: 32, name: "Central African Republic" }, { id: 33, name: "Chad" },
  { id: 34, name: "Chile" }, { id: 35, name: "China" }, { id: 36, name: "Colombia" },
  { id: 37, name: "Comoros" }, { id: 38, name: "Congo" }, { id: 39, name: "Costa Rica" },
  { id: 40, name: "Croatia" }, { id: 41, name: "Cuba" }, { id: 42, name: "Cyprus" },
  { id: 43, name: "Czech Republic" }, { id: 44, name: "Denmark" }, { id: 45, name: "Djibouti" },
  { id: 46, name: "Dominica" }, { id: 47, name: "Dominican Republic" }, { id: 48, name: "Ecuador" },
  { id: 49, name: "Egypt" }, { id: 50, name: "El Salvador" }, { id: 51, name: "Equatorial Guinea" },
  { id: 52, name: "Eritrea" }, { id: 53, name: "Estonia" }, { id: 54, name: "Eswatini" },
  { id: 55, name: "Ethiopia" }, { id: 56, name: "Fiji" }, { id: 57, name: "Finland" },
  { id: 58, name: "France" }, { id: 59, name: "Gabon" }, { id: 60, name: "Gambia" },
  { id: 61, name: "Georgia" }, { id: 62, name: "Germany" }, { id: 63, name: "Ghana" },
  { id: 64, name: "Greece" }, { id: 65, name: "Grenada" }, { id: 66, name: "Guatemala" },
  { id: 67, name: "Guinea" }, { id: 68, name: "Guinea-Bissau" }, { id: 69, name: "Guyana" },
  { id: 70, name: "Haiti" }, { id: 71, name: "Honduras" }, { id: 72, name: "Hungary" },
  { id: 73, name: "Iceland" }, { id: 74, name: "India" }, { id: 75, name: "Indonesia" },
  { id: 76, name: "Iran" }, { id: 77, name: "Iraq" }, { id: 78, name: "Ireland" },
  { id: 79, name: "Israel" }, { id: 80, name: "Italy" }, { id: 81, name: "Jamaica" },
  { id: 82, name: "Japan" }, { id: 83, name: "Jordan" }, { id: 84, name: "Kazakhstan" },
  { id: 85, name: "Kenya" }, { id: 86, name: "Kiribati" }, { id: 87, name: "Kuwait" },
  { id: 88, name: "Kyrgyzstan" }, { id: 89, name: "Laos" }, { id: 90, name: "Latvia" },
  { id: 91, name: "Lebanon" }, { id: 92, name: "Lesotho" }, { id: 93, name: "Liberia" },
  { id: 94, name: "Libya" }, { id: 95, name: "Liechtenstein" }, { id: 96, name: "Lithuania" },
  { id: 97, name: "Luxembourg" }, { id: 98, name: "Madagascar" }, { id: 99, name: "Malawi" },
  { id: 100, name: "Malaysia" }, { id: 101, name: "Maldives" }, { id: 102, name: "Mali" },
  { id: 103, name: "Malta" }, { id: 104, name: "Marshall Islands" }, { id: 105, name: "Mauritania" },
  { id: 106, name: "Mauritius" }, { id: 107, name: "Mexico" }, { id: 108, name: "Micronesia" },
  { id: 109, name: "Moldova" }, { id: 110, name: "Monaco" }, { id: 111, name: "Mongolia" },
  { id: 112, name: "Montenegro" }, { id: 113, name: "Morocco" }, { id: 114, name: "Mozambique" },
  { id: 115, name: "Myanmar" }, { id: 116, name: "Namibia" }, { id: 117, name: "Nauru" },
  { id: 118, name: "Nepal" }, { id: 119, name: "Netherlands" }, { id: 120, name: "New Zealand" },
  { id: 121, name: "Nicaragua" }, { id: 122, name: "Niger" }, { id: 123, name: "Nigeria" },
  { id: 124, name: "North Korea" }, { id: 125, name: "North Macedonia" }, { id: 126, name: "Norway" },
  { id: 127, name: "Oman" }, { id: 128, name: "Pakistan" }, { id: 129, name: "Palau" },
  { id: 130, name: "Panama" }, { id: 131, name: "Papua New Guinea" }, { id: 132, name: "Paraguay" },
  { id: 133, name: "Peru" }, { id: 134, name: "Philippines" }, { id: 135, name: "Poland" },
  { id: 136, name: "Portugal" }, { id: 137, name: "Qatar" }, { id: 138, name: "Romania" },
  { id: 139, name: "Russia" }, { id: 140, name: "Rwanda" }, { id: 141, name: "Saint Kitts and Nevis" },
  { id: 142, name: "Saint Lucia" }, { id: 143, name: "Saint Vincent and the Grenadines" },
  { id: 144, name: "Samoa" }, { id: 145, name: "San Marino" }, { id: 146, name: "Sao Tome and Principe" },
  { id: 147, name: "Saudi Arabia" }, { id: 148, name: "Senegal" }, { id: 149, name: "Serbia" },
  { id: 150, name: "Seychelles" }, { id: 151, name: "Sierra Leone" }, { id: 152, name: "Singapore" },
  { id: 153, name: "Slovakia" }, { id: 154, name: "Slovenia" }, { id: 155, name: "Solomon Islands" },
  { id: 156, name: "Somalia" }, { id: 157, name: "South Africa" }, { id: 158, name: "South Korea" },
  { id: 159, name: "South Sudan" }, { id: 160, name: "Spain" }, { id: 161, name: "Sri Lanka" },
  { id: 162, name: "Sudan" }, { id: 163, name: "Suriname" }, { id: 164, name: "Sweden" },
  { id: 165, name: "Switzerland" }, { id: 166, name: "Syria" }, { id: 167, name: "Taiwan" },
  { id: 168, name: "Tajikistan" }, { id: 169, name: "Tanzania" }, { id: 170, name: "Thailand" },
  { id: 171, name: "Timor-Leste" }, { id: 172, name: "Togo" }, { id: 173, name: "Tonga" },
  { id: 174, name: "Trinidad and Tobago" }, { id: 175, name: "Tunisia" }, { id: 176, name: "Turkey" },
  { id: 177, name: "Turkmenistan" }, { id: 178, name: "Tuvalu" }, { id: 179, name: "Uganda" },
  { id: 180, name: "Ukraine" }, { id: 181, name: "United Arab Emirates" }, { id: 182, name: "United Kingdom" },
  { id: 183, name: "United States" }, { id: 184, name: "Uruguay" }, { id: 185, name: "Uzbekistan" },
  { id: 186, name: "Vanuatu" }, { id: 187, name: "Vatican City" }, { id: 188, name: "Venezuela" },
  { id: 189, name: "Vietnam" }, { id: 190, name: "Yemen" }, { id: 191, name: "Zambia" },
  { id: 192, name: "Zimbabwe" }
];

const EmpresaContent = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const {
    currentCompany,
    companies,
    loading,
    error,
    updateLocalData,
    updateCompany,
    selectCompany,
    setError
  } = useCompany();

  const handleInputChange = (field, value) => {
    if (field === 'country') value = value ? parseInt(value) : null;
    updateLocalData({ [field]: value });
  };

  const handleSave = async () => {
    if (!currentCompany) return { success: false };

    try {
      const result = await updateCompany({
        company_name: currentCompany.company_name,
        website: currentCompany.website,
        nuid: currentCompany.nuid,
        country_id: currentCompany.country_id,
        billing_address: currentCompany.billing_address,
        postal_code: currentCompany.postal_code,
        comments: currentCompany.comments
      });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  useImperativeHandle(ref, () => ({
    saveCompanyData: handleSave
  }), [handleSave]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-heading text-2xl font-bold mb-6">{t('company.title')}</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 text-xs mt-1">
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Selector de Empresa */}
      {companies.length > 1 && (
        <div className="mb-6 p-4 bg-bg-secondary rounded-lg border">
          <label className="block text-sm font-medium mb-2">
            {t('company.selectCompany')}
          </label>
          <select
            value={currentCompany?.company_id || ''}
            onChange={(e) => selectCompany(e.target.value)}
            className="input-base w-full"
          >
            <option value="">{t('company.selectCompanyOption')}</option>
            {companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Formulario */}
      {currentCompany && (
        <div className="space-y-4">
          {/* Nombre de la empresa */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.companyNameRequired')}
            </label>
            <input
              type="text"
              value={currentCompany.company_name || ''}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className="input-base w-full"
              placeholder={t('company.placeholders.companyName')}
            />
          </div>

          {/* Sitio web */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.companyWebsite')}
            </label>
            <input
              type="url"
              value={currentCompany.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="input-base w-full"
              placeholder={t('company.placeholders.companyWebsite')}
            />
          </div>

          {/* NIT/Número fiscal */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.taxId')}
            </label>
            <input
              type="text"
              value={currentCompany.nuid || ''}
              onChange={(e) => handleInputChange('nuid', e.target.value)}
              className="input-base w-full"
              placeholder={t('company.placeholders.taxId')}
            />
          </div>

          {/* País */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.country')}
            </label>
            <select
              value={currentCompany.country_id || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="input-base w-full"
            >
              <option value="">{t('company.placeholders.selectCountry')}</option>
              {COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dirección de facturación */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.billingAddress')}
            </label>
            <input
              type="text"
              value={currentCompany.billing_address || ''}
              onChange={(e) => handleInputChange('billing_address', e.target.value)}
              className="input-base w-full"
              placeholder={t('company.placeholders.billingAddress')}
            />
          </div>

          {/* Código postal */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.postalCode')}
            </label>
            <input
              type="text"
              value={currentCompany.postal_code || ''}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              className="input-base w-full"
              placeholder={t('company.placeholders.postalCode')}
            />
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.comments')}
            </label>
            <textarea
              value={currentCompany.comments || ''}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              className="input-base w-full h-20 resize-none"
              placeholder={t('company.placeholders.comments')}
            />
          </div>
        </div>
      )}

      {!currentCompany && companies.length > 0 && (
        <div className="text-center py-8">
          <p className="text-text-secondary">{t('company.selectCompanyToEdit')}</p>
        </div>
      )}
    </div>
  );
});

EmpresaContent.displayName = 'EmpresaContent';

export default EmpresaContent;