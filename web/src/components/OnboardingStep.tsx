import React from 'react'

interface OnboardingStepProps {
  title: string
  description?: string
  options: { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  onNext: () => void
  onBack?: () => void
  isLastStep?: boolean
  loading?: boolean
}

export default function OnboardingStep({
  title,
  description,
  options,
  value,
  onChange,
  onNext,
  onBack,
  isLastStep = false,
  loading = false,
}: OnboardingStepProps) {
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>{title}</h2>
      {description && <p style={{ color: '#666' }}>{description}</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
        {options.map((opt) => (
          <label 
            key={opt.value} 
            style={{ 
              padding: '15px', 
              border: value === opt.value ? '2px solid #0056b3' : '1px solid #ccc', 
              borderRadius: '8px',
              cursor: 'pointer',
              background: value === opt.value ? '#e6f2ff' : 'transparent',
              fontWeight: value === opt.value ? 'bold' : 'normal'
            }}
          >
            <input
              type="radio"
              name="onboarding_option"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              style={{ display: 'none' }}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        {onBack ? (
          <button onClick={onBack} disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Back
          </button>
        ) : <div />}
        
        <button 
          onClick={onNext} 
          disabled={!value || loading}
          style={{ 
            padding: '10px 20px', 
            cursor: (!value || loading) ? 'not-allowed' : 'pointer',
            background: (!value || loading) ? '#ccc' : '#0056b3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? 'Processing...' : (isLastStep ? 'Complete' : 'Next')}
        </button>
      </div>
    </div>
  )
}
