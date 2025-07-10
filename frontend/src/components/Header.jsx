// src/components/Header.jsx
import React, { useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../context/AuthProvider";
import Separator from "./ui/Separator";
import Avatar from "./ui/Avatar";
import Modal from "./ui/Modal";
import ButtonGroup from "./ui/ButtonGroup";
import CompanyInfo from "./ui/CompanyInfo";
import EmpresaContent from "./Enterprise";
import EquiposContent from "./Teams";

const Header = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState(null);
  const empresaRef = useRef(null);

  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  const handleSaveCompany = () => {
    if (empresaRef.current && empresaRef.current.saveCompanyData) {
      empresaRef.current.saveCompanyData();
      alert(t('company.success.dataSaved'));
      closeModal();
    }
  };

  const headerButtons = [
    {
      text: t('header.company'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><path fill="currentColor" d="M13 3a2 2 0 0 1 1.995 1.85L15 5v4h3a2 2 0 0 1 1.995 1.85L20 11v8h1a1 1 0 0 1 .117 1.993L21 21H3a1 1 0 0 1-.117-1.993L3 19h1V5a2 2 0 0 1 1.85-1.995L6 3h7Zm5 8h-3v8h3v-8Zm-5-6H6v14h7V5Zm-2 10v2H8v-2h3Zm0-4v2H8v-2h3Zm0-4v2H8V7h3Z"/></svg>,
      onClick: () => openModal('company'),
      variant: 'primary'
    },
    {
      text: t('header.teams'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c1.873 0 3.57.62 4.815 1.487c1.183.825 2.185 2.051 2.185 3.37c0 .724-.309 1.324-.796 1.77c-.458.421-1.056.694-1.672.88C15.301 19.88 13.68 20 12 20c-1.68 0-3.301-.12-4.532-.493c-.616-.186-1.214-.459-1.673-.88C5.31 18.182 5 17.582 5 16.858c0-1.319 1.002-2.545 2.185-3.37C8.43 12.62 10.127 12 12 12m7 1c1.044 0 1.992.345 2.693.833c.64.447 1.307 1.19 1.307 2.096c0 .517-.225.946-.56 1.253c-.306.281-.684.446-1.029.55c-.47.142-1.025.215-1.601.247c.122-.345.19-.72.19-1.122c0-1.535-.959-2.839-2.032-3.744A4.78 4.78 0 0 1 19 13M5 13c.357 0 .703.04 1.032.113C4.96 14.018 4 15.322 4 16.857c0 .402.068.777.19 1.122c-.576-.032-1.13-.105-1.601-.247c-.345-.104-.723-.269-1.03-.55A1.677 1.677 0 0 1 1 15.93c0-.905.666-1.649 1.307-2.096A4.756 4.756 0 0 1 5 13m13.5-6a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5m-13 0a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5M12 3a4 4 0 1 1 0 8a4 4 0 0 1 0-8"/></svg>,
      onClick: () => openModal('teams'),
      variant: 'primary'
    },
    { 
      text: t('header.yourPlan'),
      onClick: () => console.log('Showing plan information...'),
      variant: 'primary'
    }
  ];

  const avatarMenuItems = [
    { label: t('avatar.myAccount') },
    { separator: true },
    { label: t('avatar.myProfile'), onClick: () => openModal('profile') },
    { label: t('avatar.textOnly') },
    { separator: true },
    { label: t('avatar.logout'), onClick: logout },
  ];

  const modalConfig = {
    profile: {
      buttons: [
        { label: t('modal.close'), onClick: closeModal, variant: "secondary" },
        { label: t('modal.edit'), onClick: () => console.log("Edit Profile"), variant: "primary" }
      ],
      content: (
        <>
          <h2 className="text-heading text-xl font-bold mb-4">{t('profile.title')}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-body">{t('profile.email')}</label>
              <p className="text-heading">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-body">{t('profile.status')}</label>
              <p className="success font-medium">{t('profile.active')}</p>
            </div>
          </div>
        </>
      )
    },
    company: {
      buttons: [
        { label: t('modal.close'), onClick: closeModal, variant: "secondary" },
        { label: t('modal.save'), onClick: handleSaveCompany, variant: "primary" }
      ],
      content: <EmpresaContent ref={empresaRef} />,
      size: "large"
    },
    teams: {
      buttons: [
        { label: t('modal.close'), onClick: closeModal, variant: "secondary" },
        { label: t('modal.addTeam'), onClick: () => console.log("Add team"), variant: "primary" }
      ],
      content: <EquiposContent />
    }
  };

  if (!user) return null;

  return (
    <header className="bg-header fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-2">
      <div className="flex items-center">
        <CompanyInfo />
        <Separator orientation="vertical" className="h-6 mx-4 bg-tertiary" />
        <ButtonGroup buttons={headerButtons} spacing="md" />
      </div>
      
      <div className="flex items-center text-sm text-body">
        <Separator orientation="vertical" className="h-6 mr-4 bg-tertiary" />
        <span className="mr-4">{user.email}</span> 
        <Avatar name={user.email} menuItems={avatarMenuItems} />
      </div>
      
      {activeModal && modalConfig[activeModal] && (
        <Modal 
          isOpen={true} 
          onClose={closeModal}
          buttons={modalConfig[activeModal].buttons}
          size={modalConfig[activeModal].size}
        >
          {modalConfig[activeModal].content}
        </Modal>
      )}
    </header>
  );
};

export default Header;