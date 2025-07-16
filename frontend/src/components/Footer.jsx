import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-3 px-6">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-gray-500">
        <div className="flex items-center mb-1 md:mb-0">
          <span>
            {t("footer.version", "TIA v2.1.0")}{" "}
            {t("footer.creation", "Tip is a Creation of")}
            <a
              href="https://sofita.ca"
              className="text-blue-600 hover:text-blue-800 ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sofita.ca
            </a>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span>© {currentYear} Sofita.ca</span>
          <span>•</span>
          <span>{t("footer.rights", "All rights reserved")}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
