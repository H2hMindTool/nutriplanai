import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="page-wrapper page-centered">
      
      {/* Floating food emojis background */}
      <div className="floating-bg">
        {['🥩', '🥑', '🥦', '🐟', '🥚', '🫐', '🥜', '🌿'].map((emoji, i) => (
          <span 
            key={i} 
            className={`floating-emoji emoji-${i + 1} animate-float-delay-${i % 5}`} 
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="hero-container">
        
        {/* Logo */}
        <div className="hero-logo-wrap">
          <div className="logo-icon hero-logo-icon">🥗</div>
          <span className="logo-text hero-logo-text">NutriPlan<span>AI</span></span>
        </div>

        {/* Badge */}
        <div className="hero-badge-wrap">
          <span className="badge badge-lime">✨ Powered by GPT-4o</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">
          Seu plano alimentar <span>low carb</span> com IA
        </h1>

        <p className="hero-desc">
          Em minutos, a IA cria um plano personalizado com base no seu perfil, objetivos e preferências alimentares. Sem achismos, só ciência.
        </p>

        {/* CTA */}
        <div className="hero-cta-group">
          <Link href="/login" className="btn btn-primary btn-lg btn-hero">
            Entrar no App →
          </Link>
          <Link href="/register" className="btn btn-nav-sm-outline btn-hero-secondary">
            🚀 Testar Grátis (Modo Demo)
          </Link>
        </div>

        {/* Features */}
        <div className="hero-features">
          {[
            { icon: '🎯', text: 'Personalizado para você' },
            { icon: '⚡', text: 'Pronto em 30 segundos' },
            { icon: '🔒', text: 'Dados protegidos' },
          ].map((item, i) => (
            <div key={i} className="hero-feature-item">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
