import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthProvider";
import { useProfileImage } from "../../context/useProfileImage"; 
import Modal from "../ui/Modal.jsx";
import Avatar from "../ui/Avatar.jsx";
import Input from "../ui/Input.jsx";
import axios from "axios";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const { profileImage, saveImage, removeImage } = useProfileImage();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    role: ''
  });
  const [formData, setFormData] = useState({
    fullName: ''
  });

  useEffect(() => {
    if (isOpen && token) {
      loadProfile();
    }
  }, [isOpen, token]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
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
        setFormData({ fullName: full_name });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      saveImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    removeImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
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

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        { full_name: formData.fullName },
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
          fullName: result.profile.full_name
        }));
        
        if (updateUser) {
          updateUser({
            ...user,
            fullName: result.profile.full_name
          });
        }
        
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ fullName: profileData.fullName });
    setIsEditing(false);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  const getModalButtons = () => {
    if (isEditing) {
      return [
        {
          label: t('modal.cancel'),
          onClick: handleCancel,
          variant: 'secondary'
        },
        {
          label: t('modal.save'),
          onClick: handleSave,
          variant: 'primary'
        }
      ];
    } else {
      return [
        {
          label: t('modal.edit'),
          onClick: () => setIsEditing(true),
          variant: 'primary'
        }
      ];
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="small"
      buttons={getModalButtons()}
    >
      {/* Header con título */}
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-body" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <h2 className="text-heading text-lg font-semibold">
          {t('profile.title')}
        </h2>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-body">{t('common.loading')}</div>
        </div>
      )}
      
      {!loading && (
        <>
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar 
                name={profileData.fullName || 'User'}
                size="w-20 h-20"
                className="text-xl"
                showMenu={false}
                profileImage={profileImage}
              />
              <button
                onClick={handleCameraClick}
                className="profile-camera-btn"
                title={t('profile.uploadPhoto')}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4H16L17 5V6C17.8 6.4 18.4 7.1 18.7 8H20C21.1 8 22 8.9 22 10V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V10C2 8.9 2.9 8 4 8H5.3C5.6 7.1 6.2 6.4 7 6V5L8 4H10C10 2.9 10.9 2 12 2M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7M12 9C13.66 9 15 10.34 15 12S13.66 15 12 15 9 13.66 9 12 10.34 9 12 9Z"/>
                </svg>
              </button>
              
              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <p className="profile-upload-text">
              {t('profile.uploadPhoto')}
            </p>
            
            {/* Botón para remover imagen */}
            {profileImage && (
              <button
                onClick={handleRemoveImage}
                className="btn-secondary mt-4"
              >
                {t('profile.removePhoto')}
              </button>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {isEditing ? (
              <Input
                type="text"
                name="fullName"
                label={t('auth.fullName')}
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
                required
                allowNumbers={false}
                allowLetters={true}
                allowSpecialChars={false}
                maxLength={35}
                placeholder={t('auth.fullName')}
              />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-body">
                  {t('auth.fullName')}
                </label>
                <div className="profile-input-disabled input-base w-full cursor-not-allowed">
                  {profileData.fullName}
                </div>
              </div>
            )}
            
            <Input
              type="email"
              name="email"
              label={t('profile.email')}
              value={profileData.email}
              disabled={true}
              className="profile-input-readonly cursor-not-allowed"
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default ProfileModal;