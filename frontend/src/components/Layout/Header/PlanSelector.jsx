import React from "react";
import { useTranslation } from "react-i18next";
import ButtonModal from "../../ui/ButtonModal";
import Separator from "../../ui/Separator";

const PlanSelectorContent = ({ closeModal }) => {
  const { t } = useTranslation();

  const planOptions = [
    {
      id: "current",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22L12 18.77L5.82 22L7 14.14l-5-4.87l6.91-1.01L12 2" />
        </svg>
      ),
      label: t("plan.currentPlan"),
      description: t("plan.viewCurrentPlan"),
      onClick: () => {
        closeModal();
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('openCurrentPlanModal'));
        }, 100);
      },
    },
    {
      id: "packages",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22L12 18.77L5.82 22L7 14.14l-5-4.87l6.91-1.01L12 2m0 4.68L10.36 10l-3.56.51l2.58 2.51l-.61 3.55L12 14.85l3.23 1.72l-.61-3.55L17.2 10.51L13.64 10L12 6.68Z" />
        </svg>
      ),
      label: t("plan.availablePackages"),
      description: t("plan.viewAvailablePackages"),
      onClick: () => {
        console.log("View available packages");
        closeModal();
      },
    },
    {
      id: "bills",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6m4 18H6V4h7v5h5v11M8 12v1h8v-1H8m0 3v1h8v-1H8m0-6v1h5v-1H8" />
        </svg>
      ),
      label: t("plan.viewBills"),
      description: t("plan.billingHistory"),
      onClick: () => {
        console.log("View bills");
        closeModal();
      },
    },
  ];

  return (
    <div
      className="shadow-lg border rounded-lg"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-light)",
      }}
    >
      <div className="px-4 py-3">
        <h3
          className="font-semibold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          {t("plan.management")}
        </h3>
      </div>
      
      <Separator orientation="horizontal" className="bg-border-light" />
      
      <div className="py-1">
        {planOptions.map((option) => (
          <button
            key={option.id}
            onClick={option.onClick}
            className="w-full text-left px-4 py-3 transition-colors flex items-start gap-3 hover:bg-opacity-60"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <span
              className="mt-0.5 flex-shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            >
              {option.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-medium text-sm mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {option.label}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PlanSelector = () => {
  const { t } = useTranslation();

  return (
    <div className="ml-4">
      <ButtonModal
        trigger={
          <button className="btn-header flex items-center gap-2">
            <span>{t("header.yourPlan")}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6l1.41-1.41z" />
            </svg>
          </button>
        }
        position="left"
        width="w-80"
        dropdownClassName="mt-1"
        zIndex="z-[9999]"
      >
        <PlanSelectorContent />
      </ButtonModal>
    </div>
  );
};

export default PlanSelector;