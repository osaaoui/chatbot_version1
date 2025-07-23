import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../context/CompanyContext';
import axios from 'axios';
import Dropdown from '../ui/Dropdown';
import Input from '../ui/Input';

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

  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v2/countries`
        );
        setCountries(response.data.data.countries);
      } catch (error) {
        console.error('Error loading countries:', error);
        setError(t('company.errors.countriesLoad'));
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [setError, t]);

  const handleInputChange = (field, value) => {
    if (field === 'country_id') value = value ? parseInt(value) : null;
    updateLocalData({ [field]: value });
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    handleInputChange(name, value);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCompanyLogo(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!currentCompany) return { success: false };

    try {
      const result = await updateCompany({
        company_name: currentCompany.company_name,
        company_email: currentCompany.company_email,
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <svg className="w-6 h-6" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 3a2 2 0 0 1 1.995 1.85L15 5v4h3a2 2 0 0 1 1.995 1.85L20 11v8h1a1 1 0 0 1 .117 1.993L21 21H3a1 1 0 0 1-.117-1.993L3 19h1V5a2 2 0 0 1 1.85-1.995L6 3h7Zm5 8h-3v8h3v-8Zm-5-6H6v14h7V5Zm-2 10v2H8v-2h3Zm0-4v2H8v-2h3Zm0-4v2H8V7h3Z"/>
        </svg>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('company.title')}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid var(--color-error)' 
        }}>
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-xs mt-1 hover:underline"
            style={{ color: 'var(--color-error)' }}
          >
            {t('common.close')}
          </button>
        </div>
      )}

      {/* Selector de Empresa */}
      {companies.length > 1 && (
        <div className="mb-6 p-4 rounded-lg" style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border-light)' 
        }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            {t('company.selectCompany')}
          </label>
          <select
            value={currentCompany?.company_id}
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

      {/* Logo Section */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          {t('company.logo')}
        </label>
        
        <div className="flex items-center gap-4">
          {/* Logo Preview */}
          <div 
            className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 cursor-pointer hover:border-opacity-80"
            style={{ 
              borderColor: 'var(--border-medium)',
              backgroundColor: companyLogo ? 'transparent' : 'var(--bg-tertiary)'
            }}
            onClick={handleLogoClick}
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-1" style={{ color: 'var(--text-tertiary)' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {t('company.logoPlaceholder')}
                </span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleLogoClick}
            className="px-4 py-2 rounded-md border transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-medium)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-primary)';
            }}
          >
            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            {t('company.uploadLogo')}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Formulario */}
      {currentCompany && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nombre de la empresa */}
          <Input
            name="company_name"
            label={`${t('company.companyName')} *`}
            value={currentCompany.company_name}
            onChange={handleFormInputChange}
            required
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={true}
            maxLength={100}
            placeholder={t('company.placeholders.companyName')}
          />

          {/* Email de la empresa */}
          <Input
            type="email"
            name="company_email"
            label={t('company.companyEmail')}
            value={currentCompany.company_email}
            onChange={handleFormInputChange}
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={true}
            maxLength={100}
            placeholder={t('company.placeholders.companyEmail')}
          />

          {/* Sitio web */}
          <Input
            type="url"
            name="website"
            label={t('company.companyWebsite')}
            value={currentCompany.website || ''}
            onChange={handleFormInputChange}
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={true}
            maxLength={200}
            placeholder={t('company.placeholders.companyWebsite')}
          />

          {/* NIT/Número fiscal */}
          <Input
            name="nuid"
            label={t('company.taxId')}
            value={currentCompany.nuid || ''}
            onChange={handleFormInputChange}
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={false}
            maxLength={20}
            placeholder={t('company.placeholders.taxId')}
          />
          
          {/* Dirección de facturación */}
          <Input
            name="billing_address"
            label={t('company.billingAddress')}
            value={currentCompany.billing_address || ''}
            onChange={handleFormInputChange}
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={true}
            maxLength={200}
            placeholder={t('company.placeholders.billingAddress')}
          />

          {/* Código postal */}
          <Input
            name="postal_code"
            label={t('company.postalCode')}
            value={currentCompany.postal_code}
            onChange={handleFormInputChange}
            allowNumbers={true}
            allowLetters={true}
            allowSpecialChars={false}
            maxLength={10}
            placeholder={t('company.placeholders.postalCode')}
          />

          {/* País - Span completo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              {t('company.country')}
            </label>
            {loadingCountries ? (
              <div className="input-base w-full animate-pulse h-10 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
            ) : (
              <Dropdown
                options={countries}
                value={currentCompany.country_id || ''}
                onChange={(e) => handleInputChange('country_id', e.target.value)}
                placeholder={t('company.placeholders.selectCountry')}
                valueKey="country_id"
                labelKey="country_name"
                searchPlaceholder={t('dropdown.searchCountry')}
                noResultsText={t('dropdown.noResults')}
                allowNumbers={false}
                allowLetters={true}
                allowSpecialChars={false}
                maxLength={25}
                validateInput={true}
              />
            )}
          </div>

          {/* Comentarios - Span completo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              {t('company.comments')}
            </label>
            <textarea
              name="comments"
              value={currentCompany.comments || ''}
              onChange={handleFormInputChange}
              className="input-base w-full h-20 resize-none"
              placeholder={t('company.placeholders.comments')}
              maxLength={500}
            />
          </div>
        </div>
      )}

      {!currentCompany && companies.length > 0 && (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('company.selectCompanyToEdit')}
          </p>
        </div>
      )}
    </div>
  );
});

EmpresaContent.displayName = 'EmpresaContent';

export default EmpresaContent;