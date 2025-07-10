import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const EmpresaContent = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  const [companyData, setCompanyData] = useState({
    name: 'TIA Applied Intelligent Technology',
    email: 'contact@tia.com.co',
    website: 'https://tia.com.co',
    taxId: '900.123.456-7',
    country: 'Colombia',
    logo: null
  });

  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('companyData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCompanyData(parsedData);
        if (parsedData.logo) {
          setLogoPreview(parsedData.logo);
        }
      }
    } catch (error) {
      console.error(t('company.errors.loadingData'), error);
    }
  }, [t]);

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target.result;
        setLogoPreview(logoData);
        setCompanyData(prev => ({
          ...prev,
          logo: logoData
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setCompanyData(prev => ({
      ...prev,
      logo: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('companyData', JSON.stringify(companyData));
      window.dispatchEvent(new CustomEvent('companyDataUpdated', { 
        detail: companyData 
      }));
    } catch (error) {
      console.error(t('company.errors.savingData'), error);
    }
  };

  // Exponer la función de guardar al componente padre
  useImperativeHandle(ref, () => ({
    saveCompanyData: handleSave
  }), [companyData]);

  const getInitials = (name) => {
    if (!name) return 'TI';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
  };

  return (
    <div className="w-full">
      <h2 className="text-heading text-2xl font-bold mb-6">{t('company.title')}</h2>

      <div className="space-y-6">
        {/* Sección del Logo */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-light">
          <div className="flex items-start space-x-6">
            {/* Vista previa del logo */}
            <div className="flex-shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={t('company.logoAlt')}
                  className="w-24 h-24 object-contain border border-border-light rounded-lg bg-bg-primary"
                />
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-border-medium rounded-lg flex items-center justify-center bg-bg-primary">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-secondary text-text-primary rounded-lg flex items-center justify-center text-sm font-bold mx-auto">
                      {getInitials(companyData.name)}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{t('company.noLogo')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de control */}
            <div className="flex flex-col space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="btn-primary cursor-pointer text-center"
              >
                {t('company.changeLogo')}
              </label>
              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  className="btn-secondary"
                >
                  {t('company.removeLogo')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          {/* Primera fila: Nombre y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('company.companyNameRequired')}
              </label>
              <input
                type="text"
                value={companyData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-base w-full"
                placeholder={t('company.placeholders.companyName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('company.companyEmail')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={companyData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-base w-full pl-10"
                  placeholder={t('company.placeholders.companyEmail')}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  📧
                </div>
              </div>
            </div>
          </div>

          {/* Segunda fila: Sitio web y Número fiscal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('company.companyWebsite')}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={companyData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="input-base w-full pl-10"
                  placeholder={t('company.placeholders.companyWebsite')}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  🌐
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('company.taxId')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyData.taxId || ''}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="input-base w-full pl-10"
                  placeholder={t('company.placeholders.taxId')}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  🏢
                </div>
              </div>
            </div>
          </div>

          {/* Tercera fila: País (solo) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('company.country')}
            </label>
            <div className="relative">
              <select
                value={companyData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="input-base w-full pl-10 pr-8 appearance-none bg-white"
              >
                <option value="">{t('company.placeholders.selectCountry')}</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none">
                🌍
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

EmpresaContent.displayName = 'EmpresaContent';

export default EmpresaContent;