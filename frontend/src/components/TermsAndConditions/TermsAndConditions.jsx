import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"

const TermsAndConditions = () => {
  const { t } = useTranslation()

  const termsPdfUrl = "/pdfjs/TermsAndConditions/TIA_Terms_and_conditions.pdf"
  const privacyPdfUrl = "/pdfjs/TermsAndConditions/TIA_privacy_policies.pdf"

  const linkStyle = {
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-medium)",
    color: "var(--text-primary)",
    borderRadius: "0.375rem",
    padding: "0.375rem 0.75rem",
    fontSize: "0.875rem",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    marginLeft: "1rem"
  }

  const handleLinkHover = (e, isEntering) => {
    if (isEntering) {
      e.target.style.backgroundColor = "var(--bg-tertiary)"
      e.target.style.borderColor = "var(--border-dark)"
    } else {
      e.target.style.backgroundColor = "var(--bg-primary)"
      e.target.style.borderColor = "var(--border-medium)"
    }
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {t("legal.title")}
          </h2>
          <p 
            className="mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("legal.description")}
          </p>
        </div>

        <div className="space-y-4">
          <div 
            className="rounded-lg p-4 flex items-center justify-between"
            style={{ 
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-primary)"
            }}
          >
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("legal.termsOfUse")}
              </h3>
              <p 
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("legal.termsDescription")}
              </p>
            </div>
            <a
              href={termsPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
            >
              <ExternalLink 
                className="w-4 h-4 mr-1"
                style={{ color: "var(--text-secondary)" }}
              />
              {t("legal.view")}
            </a>
          </div>

          <div 
            className="rounded-lg p-4 flex items-center justify-between"
            style={{ 
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-primary)"
            }}
          >
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("legal.privacyPolicy")}
              </h3>
              <p 
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("legal.privacyDescription")}
              </p>
            </div>
            <a
              href={privacyPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
            >
              <ExternalLink 
                className="w-4 h-4 mr-1"
                style={{ color: "var(--text-secondary)" }}
              />
              {t("legal.view")}
            </a>
          </div>

          <div 
            className="rounded-lg p-4 flex items-center justify-between"
            style={{ 
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-primary)"
            }}
          >
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("legal.dataHandling")}
              </h3>
              <p 
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("legal.dataHandlingDescription")}
              </p>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
            >
              <ExternalLink 
                className="w-4 h-4 mr-1"
                style={{ color: "var(--text-secondary)" }}
              />
              {t("legal.view")}
            </a>
          </div>
        </div>

        <div 
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid var(--color-info)",
          }}
        >
          <p 
            className="text-sm"
            style={{ color: "var(--color-info)" }}
          >
            <strong>{t("legal.note")}</strong> {t("legal.noteContent")}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions