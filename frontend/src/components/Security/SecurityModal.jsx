import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Separator from '../ui/Separator';

const SecurityModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const handleSecurityChange = (field, value) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validations
    if (!securityData.currentPassword) {
      alert(t('security.errors.currentPasswordRequired'));
      return;
    }

    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      alert(t('security.errors.passwordMismatch'));
      return;
    }

    if (securityData.newPassword && securityData.newPassword.length < 8) {
      alert(t('security.errors.passwordTooShort'));
      return;
    }

    try {
      // Llamar a la función onSave pasada como prop
      await onSave(securityData);
      alert(t('security.success.settingsUpdated'));
      handleClose();
    } catch (error) {
      alert(t('security.errors.updateFailed'));
    }
  };

  const handleClose = () => {
    // Reset form
    setSecurityData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false
    });
    onClose();
  };

  const modalButtons = [
    { 
      label: t('modal.cancel'), 
      onClick: handleClose, 
      variant: "secondary" 
    },
    { 
      label: t('modal.saveChanges'), 
      onClick: handleSave, 
      variant: "primary" 
    }
  ];

  const modalContent = (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4"/>
        </svg>
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('security.title')}
        </h2>
      </div>

      {/* Change Password Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z"/>
          </svg>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('security.changePassword')}
          </h3>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            name="currentPassword"
            label={t('security.currentPassword')}
            value={securityData.currentPassword}
            onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
            placeholder={t('security.placeholders.currentPassword')}
            required
          />

          <Input
            type="password"
            name="newPassword"
            label={t('security.newPassword')}
            value={securityData.newPassword}
            onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
            placeholder={t('security.placeholders.newPassword')}
          />

          <Input
            type="password"
            name="confirmPassword"
            label={t('security.confirmNewPassword')}
            value={securityData.confirmPassword}
            onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
            placeholder={t('security.placeholders.confirmPassword')}
          />

          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {t('security.passwordRequirements')}
          </p>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Two-Factor Authentication Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4m-2 8.5a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3Z"/>
          </svg>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('security.twoFactorAuth')}
          </h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border-light)' 
        }}>
          <div>
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {t('security.enable2FA')}
            </h4>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('security.twoFactorDescription')}
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={securityData.twoFactorEnabled}
              onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      buttons={modalButtons}
      size="default"
    >
      {modalContent}
    </Modal>
  );
};

export default SecurityModal;