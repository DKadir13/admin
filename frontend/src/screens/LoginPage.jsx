import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import MainLogo from '../components/MainLogo'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Şifre zorunludur.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { token } = await login(password)
      window.localStorage.setItem('admin_token', token)
      window.localStorage.setItem('admin_auth', 'true')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Şifre hatalı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <MainLogo variant="white" animated />
      <div className="auth-card">
        <h1>Admin Girişi</h1>
        <p>Şirket sitelerinizin yönetim paneline buradan erişin.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}</button>
        </form>
      </div>
    </div>
  )
}

