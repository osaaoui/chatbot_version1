import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';

export const useProfileImage = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);

  const getStorageKey = () => user?.email ? `profile_image_${user.email}` : null;

  const loadImage = () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      const savedImage = localStorage.getItem(storageKey);
      setProfileImage(savedImage);
    }
  };

  const saveImage = (imageData) => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, imageData);
      setProfileImage(imageData);
      
      window.dispatchEvent(new CustomEvent('profileImageChanged', {
        detail: { imageData, userEmail: user.email }
      }));
    }
  };

  const removeImage = () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
      setProfileImage(null);
      
      window.dispatchEvent(new CustomEvent('profileImageChanged', {
        detail: { imageData: null, userEmail: user.email }
      }));
    }
  };

  useEffect(() => {
    loadImage();
  }, [user?.email]);

  useEffect(() => {
    const handleProfileImageChange = (event) => {
      if (event.detail.userEmail === user?.email) {
        setProfileImage(event.detail.imageData);
      }
    };

    window.addEventListener('profileImageChanged', handleProfileImageChange);

    return () => {
      window.removeEventListener('profileImageChanged', handleProfileImageChange);
    };
  }, [user?.email]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      const storageKey = getStorageKey();
      if (storageKey && event.key === storageKey) {
        setProfileImage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.email]);

  return {
    profileImage,
    saveImage,
    removeImage,
    loadImage
  };
};