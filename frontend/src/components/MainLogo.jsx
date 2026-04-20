/**
 * Ana logo (akylogo.png) — giriş ve site seçim sayfalarında kullanılır.
 * variant: "white" = koyu arka planda beyaz, "normal" = orijinal renk
 */
export default function MainLogo({ variant = 'white', className = '', animated = true }) {
  const path = '/logolar/akylogo.png'
  return (
    <div
      className={`main-logo ${variant === 'white' ? 'main-logo--white' : 'main-logo--normal'} ${animated ? 'main-logo--animated' : ''} ${className}`.trim()}
      role="img"
      aria-label="AKY Logo"
    >
      <img src={path} alt="" className="main-logo__img" />
    </div>
  )
}
