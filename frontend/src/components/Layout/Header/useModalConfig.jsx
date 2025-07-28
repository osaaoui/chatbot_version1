import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import EmpresaContent from "../../Enterprise/Enterprise";
import EquiposContent from "../../Teams/Teams";
import TermsAndConditions from "../../TermsAndConditions/TermsAndConditions";

export const useModalConfig = (closeModal) => {
  const { t } = useTranslation();
  const empresaRef = useRef(null);

  const handleSaveCompany = async () => {
    if (empresaRef.current?.saveCompanyData) {
      const result = await empresaRef.current.saveCompanyData();
      if (result.success) {
        alert(t("company.success.dataSaved"));
        closeModal();
      } else {
        alert(t("company.errors.savingData"));
      }
    }
  };

  return {
    company: {
      buttons: [
        { label: t("modal.close"), onClick: closeModal, variant: "secondary" },
        { label: t("modal.save"), onClick: handleSaveCompany, variant: "primary" },
      ],
      content: <EmpresaContent ref={empresaRef} />,
      size: "large",
    },
    teams: {
      buttons: [
        { label: t("modal.close"), onClick: closeModal, variant: "secondary" },
        { label: t("modal.addTeam"), onClick: () => console.log("Add team"), variant: "primary" },
      ],
      content: <EquiposContent />,
    },
    legal: {
      buttons: [
        { label: t("modal.close"), onClick: closeModal, variant: "secondary" },
      ],
      content: <TermsAndConditions />,
      size: "large",
    },
  };
};