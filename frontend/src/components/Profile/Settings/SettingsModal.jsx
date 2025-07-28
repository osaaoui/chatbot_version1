import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, ChevronDown, Check, Sun, Moon } from "lucide-react";
import { useFontSize } from "../../../context/FontSizeContext";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import ButtonModal from "../../ui/ButtonModal";

const SettingsTrigger = ({ variant = "icon", t }) => {
  return (
    <button
      className={`button-modal-trigger rounded-md transition-colors cursor-pointer ${
        variant === "icon"
          ? "w-8 h-8 flex items-center justify-center"
          : "px-3 py-2 flex items-center gap-1"
      }`}
      title={t("buttonModal.settings")}
    >
      {variant === "icon" ? (
        <Settings
          className="w-4 h-4"
          style={{ color: "var(--text-secondary)" }}
        />
      ) : (
        <>
          <Settings
            className="w-3 h-3"
            style={{ color: "var(--text-secondary)" }}
          />
          <span
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("buttonModal.settings")}
          </span>
          <ChevronDown
            className="w-3 h-3"
            style={{ color: "var(--text-tertiary)" }}
          />
        </>
      )}
    </button>
  );
};

const SettingsContent = ({ closeModal }) => {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const { fontSize, setFontSize } = useFontSize();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const languages = [
    { code: "es", name: t("languages.spanish") },
    { code: "en", name: t("languages.english") },
    { code: "fr", name: t("languages.french") },
  ];

  const appearances = [
    {
      value: "light",
      name: t("buttonModal.light"),
      icon: Sun,
    },
    {
      value: "dark",
      name: t("buttonModal.dark"),
      icon: Moon,
    },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];
  const currentAppearance =
    appearances.find((app) => app.value === theme) || appearances[0];

  const changeLanguage = async (languageCode) => {
    await setLanguage(languageCode);
    setIsLanguageOpen(false);
  };

  const changeAppearance = (value) => {
    setTheme(value);
    setIsAppearanceOpen(false);
  };

  const getSliderBackground = () => {
    const percentage = ((fontSize - 12) / (24 - 12)) * 100;
    return `linear-gradient(to right, var(--text-primary) 0%, var(--text-primary) ${percentage}%, var(--border-medium) ${percentage}%, var(--border-medium) 100%)`;
  };

  const ThemeIcon = currentAppearance.icon;

  return (
    <div
      className={`button-modal-dropdown ${
        isAppearanceOpen ? "pb-20" : ""
      }`}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "var(--border-medium)" }}
      >
        <h3
          className="text-sm font-semibold m-0"
          style={{ color: "var(--text-primary)" }}
        >
          {t("buttonModal.settings")}
        </h3>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex flex-col">
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t("buttonModal.language")}
          </label>
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="button-modal-select w-full px-3 py-2.5 pr-10 text-sm rounded-lg outline-none cursor-pointer flex items-center justify-between text-left"
            >
              <span style={{ color: "var(--text-primary)" }}>
                {currentLanguage.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isLanguageOpen ? "rotate-180" : ""
                }`}
                style={{ color: "var(--text-tertiary)" }}
              />
            </button>

            {isLanguageOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-medium)",
                }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-3 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between`}
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "var(--bg-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <Check
                        className="w-4 h-4"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t("buttonModal.fontSize")}: {fontSize}px
          </label>
          <div className="relative px-1">
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="button-modal-slider w-full h-2 rounded-md appearance-none cursor-pointer outline-none"
              style={{ background: getSliderBackground() }}
            />
            <div
              className="flex justify-between text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span>12px</span>
              <span>18px</span>
              <span>24px</span>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="flex flex-col">
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t("buttonModal.appearance")}
          </label>

          <div className="relative">
            <button
              onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
              className="button-modal-select w-full px-3 py-2.5 pr-10 text-sm rounded-lg outline-none cursor-pointer flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <ThemeIcon
                  className="w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  {currentAppearance.name}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isAppearanceOpen ? "rotate-0" : "rotate-180"
                }`}
                style={{ color: "var(--text-tertiary)" }}
              />
            </button>

            {isAppearanceOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-medium)",
                }}
              >
                {appearances.map((app) => {
                  const AppIcon = app.icon;
                  return (
                    <button
                      key={app.value}
                      onClick={() => changeAppearance(app.value)}
                      className={`w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between`}
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "var(--bg-tertiary)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "transparent")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <AppIcon
                          className="w-4 h-4"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span>{app.name}</span>
                      </div>
                      {theme === app.value && (
                        <Check
                          className="w-4 h-4"
                          style={{ color: "var(--text-tertiary)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ className = "", variant = "icon" }) => {
  const { t } = useTranslation();

  return (
    <ButtonModal
      className={className}
      trigger={<SettingsTrigger variant={variant} t={t} />}
    >
      <SettingsContent />
    </ButtonModal>
  );
};

export default SettingsModal;