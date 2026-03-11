import { useAuth } from '../contexts/useAuth'

export function ConsentModal() {
  const { setHealthConsent } = useAuth()

  return (
    <div className="consent-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-modal">
        <div className="consent-modal__icon" aria-hidden="true">🔒</div>
        <h2 id="consent-title" className="consent-modal__title">Uso dos seus dados de saúde</h2>
        <p className="consent-modal__body">
          A Alma gostaria de acessar seus dados de saúde (Apple Health, Garmin e similares) para
          oferecer insights personalizados de sono, estresse e bem-estar.
        </p>
        <p className="consent-modal__body">
          Seus dados são tratados com segurança, nunca são vendidos e podem ser revogados a
          qualquer momento, em conformidade com a <strong>LGPD</strong> e o <strong>GDPR</strong>.
        </p>
        <div className="consent-modal__actions">
          <button
            className="btn btn--primary btn--lg consent-modal__btn"
            onClick={() => setHealthConsent('granted')}
          >
            ✅ Aceitar e continuar
          </button>
          <button
            className="btn btn--ghost btn--lg consent-modal__btn"
            onClick={() => setHealthConsent('denied')}
          >
            Não, obrigado
          </button>
        </div>
        <p className="consent-modal__note">
          Você pode alterar essa preferência a qualquer momento em Configurações → Privacidade.
        </p>
      </div>
    </div>
  )
}
