import Link from 'next/link'

export default function AcessoNegadoPage() {
  return (
    <div className="page-wrapper page-centered">
      <div className="page-centered-container animate-fade-in-up">

        {/* Logo */}
        <div className="logo-header">
          <div className="logo-icon">🥗</div>
          <span className="logo-text">LowCarb<span>AI</span></span>
        </div>

        {/* Ícone de bloqueio */}
        <div className="acesso-negado-icon">🔒</div>

        <h1 className="acesso-negado-title">
          Acesso <span>Inativo</span>
        </h1>

        <p className="acesso-negado-desc">
          Sua conta está inativa no momento. Isso pode acontecer por cancelamento ou reembolso da compra.
        </p>

        <div className="card card-mb">
          <p className="acesso-negado-info">
            💡 Para reativar seu acesso, adquira novamente o produto. Após a confirmação do pagamento, sua conta será ativada automaticamente em alguns minutos.
          </p>
        </div>

        <div className="btn-stack">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-full btn-lg"
          >
            🛒 Reativar Agora
          </a>
          <Link href="/login" className="btn btn-outline btn-full">
            ← Voltar ao login
          </Link>
        </div>

      </div>
    </div>
  )
}
