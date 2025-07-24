import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Separator from '../ui/Separator';
import Input from '../ui/Input';

const CurrentPlanModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [newUserLimit, setNewUserLimit] = useState('50');
  const [newStorageLimit, setNewStorageLimit] = useState('2');

  // Datos del plan actual (estos vendrían de un contexto o API)
  const currentPlan = {
    name: 'Enterprise Pro',
    type: 'Annual Subscription',
    price: '$299.99',
    status: 'Active',
    users: {
      current: 25,
      limit: 50,
      percentage: 50
    },
    storage: {
      used: '1.2 TB',
      limit: '2 TB',
      percentage: 60
    },
    renewalDate: '2024-12-15',
    billingCycle: 'Monthly',
    additionalUsers: '$12/user/month',
    additionalStorage: '$25/TB/month',
    changesEffect: 'Immediately'
  };

  const handleRenewNow = () => {
    console.log('Renewing plan...');
    // Lógica para renovar el plan
  };

  const handleIncreaseUsers = () => {
    console.log('Increasing user limit to:', newUserLimit);
    // Lógica para aumentar límite de usuarios
  };

  const handleIncreaseStorage = () => {
    console.log('Increasing storage limit to:', newStorageLimit);
    // Lógica para aumentar límite de almacenamiento
  };

  const modalButtons = [
    {
      label: t('modal.close'),
      onClick: onClose,
      variant: 'secondary'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      buttons={modalButtons}
      size="large"
    >
      <div className="space-y-6">
        {/* Header del Plan */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('plan.currentPlanDetails')}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {currentPlan.price}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {currentPlan.type}
            </div>
            <span 
              className="inline-block px-2 py-1 text-xs font-medium rounded mt-1"
              style={{ 
                backgroundColor: 'var(--color-success)', 
                color: 'white' 
              }}
            >
              {currentPlan.status}
            </span>
          </div>
        </div>

        <Separator />

        {/* Usage Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users Section */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: 'var(--text-primary)' }}
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/>
              </svg>
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('plan.users')}
              </h3>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.current')}: {currentPlan.users.current}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.limit')}: {currentPlan.users.limit}
                </span>
              </div>
              <div 
                className="w-full h-2 rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${currentPlan.users.percentage}%`,
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {currentPlan.users.percentage}% {t('plan.ofUserLimitUsed')}
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: 'var(--text-primary)' }}
              >
                <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6m0 2h7v5h5v11H6V4"/>
              </svg>
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('plan.storage')}
              </h3>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.used')}: {currentPlan.storage.used}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.limit')}: {currentPlan.storage.limit}
                </span>
              </div>
              <div 
                className="w-full h-2 rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${currentPlan.storage.percentage}%`,
                    backgroundColor: 'var(--color-success)'
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {currentPlan.storage.percentage}% {t('plan.storageUsed')}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Renewal Information */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {t('plan.renewalInformation')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('plan.nextRenewalDate')}: {currentPlan.renewalDate}
              </p>
            </div>
            <button
              onClick={handleRenewNow}
              className="btn-primary px-4 py-2 text-sm"
            >
              {t('plan.renewNow')}
            </button>
          </div>
        </div>

        <Separator />

        {/* Increase Plan Limits */}
        <div className="space-y-4">
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('plan.increasePlanLimits')}
          </h3>

          {/* Increase User Limit */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t('plan.increaseUserLimit')}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.currentLimit')}: {currentPlan.users.limit} {t('plan.users').toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.additionalCost')}:
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                  +$0/month
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newUserLimit}
                  onChange={(e) => setNewUserLimit(e.target.value)}
                  placeholder={t('plan.newUserLimit')}
                  size="sm"
                  allowNumbers={true}
                  allowLetters={false}
                  maxLength={3}
                />
              </div>
              <button
                onClick={handleIncreaseUsers}
                className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                {t('plan.increase')}
              </button>
            </div>
          </div>

          {/* Increase Storage Limit */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--color-success-light)',
              borderColor: 'var(--color-success)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t('plan.increaseStorageLimit')}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.currentLimit')}: {currentPlan.storage.limit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t('plan.additionalCost')}:
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                  +$0/month
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newStorageLimit}
                  onChange={(e) => setNewStorageLimit(e.target.value)}
                  placeholder={t('plan.newStorageLimit')}
                  size="sm"
                  allowNumbers={true}
                  allowLetters={false}
                  maxLength={2}
                />
              </div>
              <button
                onClick={handleIncreaseStorage}
                className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                {t('plan.increase')}
              </button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing Details */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('plan.pricingDetails')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('plan.additionalUsers')}: 
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {currentPlan.additionalUsers}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('plan.additionalStorage')}: 
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {currentPlan.additionalStorage}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('plan.billingCycle')}: 
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {currentPlan.billingCycle}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('plan.changesTakeEffect')}: 
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {currentPlan.changesEffect}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CurrentPlanModal;