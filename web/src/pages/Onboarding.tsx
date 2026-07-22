import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import OnboardingStep from '../components/OnboardingStep'

export default function Onboarding() {
  const { session, refetchProfile } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  const [answers, setAnswers] = useState({
    career_goal: '',
    experience: '',
    learning_style: '',
    daily_minutes: ''
  })

  const steps = [
    {
      field: 'career_goal',
      title: 'What is your primary career goal?',
      options: [
        { label: 'Full-Stack Developer', value: 'full_stack' },
        { label: 'Data Scientist / AI Engineer', value: 'data_science_ai' },
      ]
    },
    {
      field: 'experience',
      title: 'What is your current experience level?',
      options: [
        { label: 'Beginner (Just starting out)', value: 'beginner' },
        { label: 'Intermediate (Some experience)', value: 'intermediate' },
        { label: 'Advanced (Looking to specialize)', value: 'advanced' },
      ]
    },
    {
      field: 'learning_style',
      title: 'How do you prefer to learn?',
      options: [
        { label: 'Video tutorials and courses', value: 'video' },
        { label: 'Reading docs and articles', value: 'reading' },
        { label: 'Building projects (hands-on)', value: 'projects' },
      ]
    },
    {
      field: 'daily_minutes',
      title: 'How much time can you commit daily?',
      options: [
        { label: '15-30 minutes', value: '30' },
        { label: '1 hour', value: '60' },
        { label: '2+ hours', value: '120' },
      ]
    }
  ]

  const currentStepData = steps[step]

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      await submitOnboarding()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const submitOnboarding = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/v1/onboarding/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...answers,
          daily_minutes: parseInt(answers.daily_minutes)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate profile')
      }

      const data = await response.json()
      setProfile(data.intent_profile)
      if (refetchProfile) {
        await refetchProfile()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (profile) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
        <h2>Your AI Learning Profile is Ready!</h2>
        <p><strong>Summary:</strong> {profile.summary}</p>
        
        <h3>Focus Areas</h3>
        <ul>
          {profile.focus_areas?.map((a: string) => <li key={a}>{a}</li>)}
        </ul>
        
        <h3>Inferred Skills</h3>
        <ul>
          {profile.inferred_skills?.map((s: string) => <li key={s}>{s}</li>)}
        </ul>

        <button 
          onClick={() => navigate('/')} 
          style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', background: '#0056b3', color: 'white', border: 'none' }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <OnboardingStep
        title={currentStepData.title}
        options={currentStepData.options}
        value={(answers as any)[currentStepData.field]}
        onChange={(val) => setAnswers({ ...answers, [currentStepData.field]: val })}
        onNext={handleNext}
        onBack={step > 0 ? handleBack : undefined}
        isLastStep={step === steps.length - 1}
        loading={loading}
      />
    </div>
  )
}
