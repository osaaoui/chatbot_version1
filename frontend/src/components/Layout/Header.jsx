import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useProfileImage } from "../../context/useProfileImage";

// UI Components
import Separator from "../ui/Separator";
import Avatar from "../ui/Avatar";
import Modal from "../ui/Modal";
import ButtonGroup from "../ui/ButtonGroup";
import CompanyInfo from "../ui/CompanyInfo";

// Header specific components
import PlanSelector from "./Header/PlanSelector"; // ← Agregar este import
import { useHeaderButtons, useAvatarMenuItems } from "./Header/headerConfig";
import { useModalConfig } from "./Header/useModalConfig";

// Specific modals
import ProfileModal from "../Profile/ProfileModal";
import SecurityModal from "../Security/SecurityModal";
import CurrentPlanModal from "../Plan/CurrentPlanModal";

const Header = () => {
  const { user, logout } = useAuth();
  const { profileImage } = useProfileImage();
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  // Custom hooks para configuración
  const headerButtons = useHeaderButtons(openModal);
  const avatarMenuItems = useAvatarMenuItems(openModal, logout);
  const modalConfig = useModalConfig(closeModal);

  // Effect para manejar el evento del plan actual
  React.useEffect(() => {
    const handleOpenCurrentPlanModal = () => {
      setActiveModal('currentPlan');
    };

    document.addEventListener('openCurrentPlanModal', handleOpenCurrentPlanModal);
    
    return () => {
      document.removeEventListener('openCurrentPlanModal', handleOpenCurrentPlanModal);
    };
  }, []);

  const handleSecuritySave = async (securityData) => {
    try {
      console.log("Saving security changes:", securityData);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  if (!user) return null;

  return (
    <header className="bg-header flex items-center justify-between px-6 py-2 border-b border-border-light relative z-10">
      <div className="flex items-center">
        <CompanyInfo />
        <Separator orientation="vertical" className="h-6 mx-4 bg-tertiary" />
        <ButtonGroup buttons={headerButtons} spacing="md" />
        <PlanSelector /> {/* ← Agregar este componente */}
      </div>

      <div className="flex items-center text-sm text-body">
        <Separator orientation="vertical" className="h-6 mr-4 bg-tertiary" />
        <span className="mr-4">{user.fullName}</span>
        <Avatar
          name={user.fullName}
          menuItems={avatarMenuItems}
          profileImage={profileImage}
        />
      </div>

      {/* Modales específicos */}
      <ProfileModal isOpen={activeModal === "profile"} onClose={closeModal} />
      <SecurityModal
        isOpen={activeModal === "security"}
        onClose={closeModal}
        onSave={handleSecuritySave}
      />
      <CurrentPlanModal 
        isOpen={activeModal === "currentPlan"} 
        onClose={closeModal} 
      />

      {/* Modales genéricos */}
      {activeModal &&
        !["profile", "security", "currentPlan"].includes(activeModal) &&
        modalConfig[activeModal] && (
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