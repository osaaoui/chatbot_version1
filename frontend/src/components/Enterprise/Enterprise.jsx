import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../context/CompanyContext';
import axios from 'axios';
import CustomDropdown from '../ui/customDropdown';

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
          <button 
            onClick={() => setError(null)} 
            className="text-red-500 text-xs mt-1"
          >
            {t('common.close')}
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

          {/* CustomDropdown para la lista desplegable de países */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('company.country')}
            </label>
            {loadingCountries ? (
              <div className="input-base w-full bg-gray-100 animate-pulse h-10 rounded"></div>
            ) : (
              <CustomDropdown
                options={countries}
                value={currentCompany.country_id || ''}
                onChange={(e) => handleInputChange('country_id', e.target.value)}
                placeholder={t('company.placeholders.selectCountry')}
                valueKey="country_id"
                labelKey="country_name"
                searchPlaceholder={t('dropdown.searchCountry')}
                noResultsText={t('dropdown.noResults')}
              />
            )}
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