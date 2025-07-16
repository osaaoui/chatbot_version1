import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

const TermsAndConditions = () => {
  const { t } = useTranslation();

    const termsPdfUrl = "/pdfjs/TermsAndConditions/TIA_Terms_and_conditions.pdf";
    const privacyPdfUrl = "/pdfjs/TermsAndConditions/TIA_privacy_policies.pdf";

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-heading mb-4">
            {t("legal.title")}
          </h2>
          <p className="text-body mb-6">{t("legal.description")}</p>
        </div>

        <div className="space-y-4">
          <div className="border border-border-light rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-heading">
                {t("legal.termsOfUse")}
              </h3>
              <p className="text-body text-sm">{t("legal.termsDescription")}</p>
            </div>
            <a
              href={termsPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {t("legal.view")}
            </a>
          </div>

          <div className="border border-border-light rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-heading">
                {t("legal.privacyPolicy")}
              </h3>
              <p className="text-body text-sm">
                {t("legal.privacyDescription")}
              </p>
            </div>
            <a
              href={privacyPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {t("legal.view")}
            </a>
          </div>

          <div className="border border-border-light rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-heading">
                {t("legal.dataHandling")}
              </h3>
              <p className="text-body text-sm">
                {t("legal.dataHandlingDescription")}
              </p>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {t("legal.view")}
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>{t("legal.note")}</strong> {t("legal.noteContent")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
