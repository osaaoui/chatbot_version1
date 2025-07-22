import { useTranslation } from "react-i18next"

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="py-3 px-6 transition-colors"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-light)'
      }}
    >
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center text-xs">
        <div className="flex items-center mb-1 md:mb-0">
          <span style={{ color: 'var(--text-secondary)' }}>
            {t("footer.version", "TIA v2.1.0")}{" "}
            {t("footer.creation", "Tip is a Creation of")}
            <a
              href="https://sofita.ca"
              className="ml-1 transition-colors hover:underline"
              style={{ 
                color: 'var(--color-primary-dark)',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--color-primary-light)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--color-primary-dark)'
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sofita.ca
            </a>
          </span>
        </div>

        <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
          <span>© {currentYear} Sofita.ca</span>
          <span>•</span>
          <span>{t("footer.rights", "All rights reserved")}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer