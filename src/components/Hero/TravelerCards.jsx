// TravelerCards.jsx — Top 5 Routes + Active Travelers Widget
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopRoutes } from '../../services/api'
import { getToken, getUser } from '../../utils/helpers'

const FALLBACK = []

const TREND_ICON  = { up: '↑', down: '↓', same: '→' }
const TREND_COLOR = { up: '#4ade80', down: '#f87171', same: 'rgba(255,255,255,0.4)' }

function TravelerCards() {
  const navigate   = useNavigate()
  const token      = getToken()
  const user       = getUser()
  const isLoggedIn = !!token
  const role       = user?.role || ''

  const [routes,   setRoutes]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [visible,  setVisible]  = useState(false)
  const [animated, setAnimated] = useState(false)
  const [pulse,    setPulse]    = useState(false)
  const [toast,    setToast]    = useState(null)

  // ── Auto-close toast after 4s ──
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg, type = 'warning', actionLabel = null, actionPath = null) => {
    setToast({ msg, type, actionLabel, actionPath })
  }

  // ── Guard: Post a Route button ──
  const handlePostRoute = (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      showToast(
        '🔐 Please login first to post a travel route.',
        'warning', 'Login Now', '/login'
      )
      return
    }
    if (role === 'sender') {
      showToast(
        '✈️ Posting routes is for Travelers only. Update your role in Settings to unlock this.',
        'role', 'Update Role', '/settings'
      )
      return
    }
    navigate('/post-travel')
  }

  // ── Guard: View all button ──
  const handleViewAll = (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      showToast(
        '🔐 Please login first to view all travel routes.',
        'warning', 'Login Now', '/login'
      )
      return
    }
    navigate('/post-travel')
  }

  // ── Fetch from backend ──
  const fetchRoutes = async () => {
    try {
      const data = await getTopRoutes()
      setRoutes(data)
    } catch (err) {
      console.error('Routes fetch failed:', err)
      setRoutes(FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  // ── On mount ──
  useEffect(() => {
    fetchRoutes()
    const t1 = setTimeout(() => setVisible(true),  100)
    const t2 = setTimeout(() => setAnimated(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // ── Live refresh every 30s ──
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoutes()
      setPulse(true)
      setTimeout(() => setPulse(false), 2500)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const MAX            = routes.length > 0 ? Math.max(...routes.map(r => r.travelers)) : 1
  const totalTravelers = routes.reduce((s, r) => s + r.travelers, 0)
  const routeCount     = routes.length

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="tc-card tc-card--visible">
        <div className="tc-glow tc-glow-1" />
        <div className="tc-glow tc-glow-2" />
        <div className="tc-header">
          <div className="tc-header-left">
            <div className="tc-icon-wrap">✈️</div>
            <div>
              <p className="tc-title">Top Routes</p>
              <p className="tc-subtitle">Loading live data...</p>
            </div>
          </div>
          <div className="tc-live-badge">
            <span className="tc-live-dot" /> Fetching...
          </div>
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="tc-skeleton" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="tc-skeleton-rank" />
            <div className="tc-skeleton-body">
              <div className="tc-skeleton-text" />
              <div className="tc-skeleton-bar" />
            </div>
            <div className="tc-skeleton-count" />
          </div>
        ))}
      </div>
    )
  }

  // ── Empty state ──
  if (routeCount === 0) {
    return (
      <>
        <div className={`tc-card ${visible ? 'tc-card--visible' : ''}`}>
          <div className="tc-glow tc-glow-1" />
          <div className="tc-glow tc-glow-2" />
          <div className="tc-header">
            <div className="tc-header-left">
              <div className="tc-icon-wrap">✈️</div>
              <div>
                <p className="tc-title">Top Routes</p>
                <p className="tc-subtitle">Live traveler activity</p>
              </div>
            </div>
            <div className="tc-live-badge tc-live-badge--empty">
              <span className="tc-live-dot tc-live-dot--empty" />
              0 Active
            </div>
          </div>
          <div className="tc-empty">
            <span className="tc-empty-icon">🗺️</span>
            <p className="tc-empty-text">No active routes yet</p>
            <p className="tc-empty-sub">Be the first traveler to post a route!</p>
            {/* ✅ Guarded Post Route button */}
            <a
              href="/post-travel"
              onClick={handlePostRoute}
              className={`tc-empty-btn${isLoggedIn && role === 'sender' ? ' tc-btn-locked' : ''}`}
            >
              {isLoggedIn && role === 'sender' ? '🔒 Post a Route' : '✈️ Post a Route'}
            </a>
          </div>
        </div>

        {/* Toast */}
        {toast && <TcToast toast={toast} onClose={() => setToast(null)} onNavigate={navigate} />}
      </>
    )
  }

  // ── Normal state ──
  return (
    <>
      <div className={`tc-card ${visible ? 'tc-card--visible' : ''}`}>
        <div className="tc-glow tc-glow-1" />
        <div className="tc-glow tc-glow-2" />

        <div className="tc-header">
          <div className="tc-header-left">
            <div className="tc-icon-wrap">✈️</div>
            <div>
              <p className="tc-title">Top Routes</p>
              <p className="tc-subtitle">Live traveler activity</p>
            </div>
          </div>
          <div className={`tc-live-badge ${pulse ? 'tc-live-badge--pulse' : ''}`}>
            <span className="tc-live-dot" />
            {totalTravelers} Active
          </div>
        </div>

        {pulse && (
          <div className="tc-alert">
            <span className="tc-alert-icon">🔄</span>
            Route data just updated!
          </div>
        )}

        {routeCount === 1 && (
          <div className="tc-single-hint">
            📌 Only 1 route active — more coming soon!
          </div>
        )}

        <ul className="tc-list">
          {routes.map((route, i) => (
            <li key={i} className="tc-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`tc-rank tc-rank--${i + 1}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="tc-route-info">
                <div className="tc-route-path">
                  <span className="tc-city">{route.from}</span>
                  <span className="tc-arrow">→</span>
                  <span className="tc-city">{route.to}</span>
                </div>
                <div className="tc-bar-track">
                  <div
                    className="tc-bar-fill"
                    style={{
                      width: animated
                        ? routeCount === 1 ? '60%' : `${(route.travelers / MAX) * 100}%`
                        : '0%',
                      transitionDelay: `${0.5 + i * 0.12}s`,
                    }}
                  />
                </div>
              </div>
              <div className="tc-count-wrap">
                <span className="tc-count">{route.travelers}</span>
                <span className="tc-trend" style={{ color: TREND_COLOR[route.trend] }}>
                  {TREND_ICON[route.trend]}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="tc-footer">
          <span>
            👥 {totalTravelers} traveler{totalTravelers !== 1 ? 's' : ''} ·{' '}
            {routeCount} route{routeCount !== 1 ? 's' : ''}
          </span>
          {/* ✅ Guarded View all button */}
          <a
            href="/post-travel"
            onClick={handleViewAll}
            className="tc-footer-link"
          >
            View all →
          </a>
        </div>
      </div>

      {/* ✅ Toast Notification */}
      {toast && <TcToast toast={toast} onClose={() => setToast(null)} onNavigate={navigate} />}
    </>
  )
}

// ── Reusable Toast Component ──
function TcToast({ toast, onClose, onNavigate }) {
  return (
    <div className={`tc-toast tc-toast--${toast.type}`}>
      <div className="tc-toast-content">
        <p className="tc-toast-msg">{toast.msg}</p>
        <div className="tc-toast-actions">
          {toast.actionLabel && (
            <button
              className="tc-toast-action-btn"
              onClick={() => { onNavigate(toast.actionPath); onClose() }}
            >
              {toast.actionLabel} →
            </button>
          )}
          <button className="tc-toast-close" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="tc-toast-bar" />
    </div>
  )
}

export default TravelerCards