import React from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

export default function Landing() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="brand">
          <span style={{ fontSize: '1.8em' }}>🌸</span>
          <h1>Bloom</h1>
        </div>
        <div className="nav-links">
          <Link to="/login" className="btn-hero secondary" style={{ padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9em' }}>
            Log In
          </Link>
          <Link to="/register" className="btn-hero primary" style={{ padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9em' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span>⚡</span>
          <span>AI-Powered Career Learning</span>
        </div>
        <h2>
          Learn What Matters.<br />
          <span className="gradient-text">Skip What Doesn't.</span>
        </h2>
        <p className="hero-subtitle">
          Bloom uses AI to analyze your career goals, map your skill gaps, and recommend 
          the exact YouTube tutorials you need — in the right order, at the right time.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn-hero primary">
            🚀 Start Learning Free
          </Link>
          <Link to="/login" className="btn-hero secondary">
            Already have an account?
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h3>How Bloom Works</h3>
        <p className="section-subtitle">Three steps to your personalized learning path</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-icon">🎯</div>
            <div className="step-number">1</div>
            <h4>Tell Us Your Goal</h4>
            <p>Share your career aspirations, experience level, and learning style. Our AI builds your Learning Intent Profile in seconds.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">🗺️</div>
            <div className="step-number">2</div>
            <h4>Follow Your Roadmap</h4>
            <p>Get a personalized skill roadmap with prerequisite-aware ordering. Always know what to learn next and why it matters.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">📈</div>
            <div className="step-number">3</div>
            <h4>Watch, Learn, Grow</h4>
            <p>Watch curated YouTube tutorials with timestamped notes. Give feedback and watch your recommendations get smarter.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h3>Everything You Need to Level Up</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <div>
              <h4>AI Recommendations</h4>
              <p>Every suggestion explains why this resource, why now, and what it unlocks next in your career.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <div>
              <h4>Visual Roadmap</h4>
              <p>See your entire learning journey mapped out with skills, prerequisites, and mastery tracking.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <div>
              <h4>Smart Notes</h4>
              <p>Take timestamped notes while watching. Click any note to jump back to that exact moment.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <div>
              <h4>Adaptive Learning</h4>
              <p>Your feedback teaches Bloom. Rate sessions and watch your recommendations evolve with you.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div>
              <h4>Progress Tracking</h4>
              <p>Streaks, stats, skill mastery levels, and activity heatmaps keep you motivated.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <div>
              <h4>Career-Aligned</h4>
              <p>Every recommendation maps to real career tracks: Full-Stack, Data Science, AI Engineering, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">20+</div>
            <div className="stat-label">Curated Videos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">2</div>
            <div className="stat-label">Career Tracks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">19</div>
            <div className="stat-label">Skills Mapped</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">∞</div>
            <div className="stat-label">Learning Potential</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>🌸 Bloom — An AI-powered career learning platform</p>
        <p>Built with intent. Learn with purpose.</p>
      </footer>
    </div>
  )
}
