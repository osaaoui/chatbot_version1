import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthProvider";
import Modal from "../ui/Modal.jsx";
import axios from "axios";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, token, login } = useAuth();
  const { t } = useTranslation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    role: ''
  });
  const [formData, setFormData] = useState({
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      loadProfile();
    }
  }, [isOpen, token]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const { full_name, email, role } = response.data.data;
        setProfileData({
          fullName: full_name,
          email,
          role
        });
        setFormData({ email });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('profile.error.loadFailed') || t('errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        { email: formData.email },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const result = response.data.data;
        
        setProfileData(prev => ({
          ...prev,
          email: result.profile.email
        }));
        
        if (result.token_regenerated && result.new_token) {
          const updatedUser = {
            ...user,
            email: result.profile.email
          };
          
          login(result.new_token, updatedUser);
        }
        
        setSuccess(t('profile.success.updated') || t('common.success'));
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(
        err.response?.data?.detail || 
        t('profile.error.updateFailed') || 
        t('errors.failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ email: profileData.email });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  const buttons = isEditing ? [
    { 
      label: t('modal.cancel'), 
      onClick: handleCancel, 
      variant: "secondary",
      disabled: loading
    },
    { 
      label: t('modal.save'), 
      onClick: handleSave, 
      variant: "primary",
      disabled: loading
    }
  ] : [
    { 
      label: t('modal.close'), 
      onClick: handleClose, 
      variant: "secondary" 
    },
    { 
      label: t('modal.edit'), 
      onClick: () => setIsEditing(true), 
      variant: "primary" 
    }
  ];

  const content = (
    <div className="space-y-4">
      <h2 className="text-heading text-xl font-bold mb-4">
        {t('profile.title')}
      </h2>
      
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="text-body">{t('common.loading')}</div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {!loading && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-body">
              {t('auth.fullName')}
            </label>
            <p className="text-heading">{profileData.fullName}</p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-body">
              {t('auth.email')}
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-base w-full"
                disabled={loading}
              />
            ) : (
              <p className="text-heading">{profileData.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-body">
              {t('auth.selectRole')}
            </label>
            <p className="text-heading">{profileData.role}</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      buttons={buttons}
    >
      {content}
    </Modal>
  );
};

export default ProfileModal;