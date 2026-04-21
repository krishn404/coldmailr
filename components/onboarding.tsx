'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Zap, Clock } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('coldmailr_onboarding_v1');
    if (hasSeenOnboarding) {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('coldmailr_onboarding_v1', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const steps = [
    {
      title: 'Welcome to coldmailr',
      description:
        'The fastest way to write personalized cold emails powered by AI.',
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
      highlight:
        'Write emails that convert. With AI-powered suggestions and streaming generation.',
    },
    {
      title: 'Generate with AI',
      description: 'Provide context about your recipient and let AI create a personalized email.',
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      highlight: 'Add the recipient email, describe them, and click "Generate with AI".',
    },
    {
      title: 'Quick Actions',
      description: 'Refine your email with tone, length, and style adjustments.',
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      highlight:
        'Use Shorten, Formalize, or switch tones without regenerating from scratch.',
    },
    {
      title: 'Version History',
      description: 'Track every iteration and easily revert to previous versions.',
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      highlight: 'Never lose your work. Every generation is saved automatically.',
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{currentStep.title}</h2>
            <p className="text-sm text-gray-400 mt-1">{currentStep.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors ml-2"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-4">
          {currentStep.icon}
          <div className="text-center">
            <p className="text-gray-300 text-sm">{currentStep.highlight}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-colors ${
                  idx === step ? 'bg-blue-500 w-8' : 'bg-gray-700 w-2'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="text-gray-300 hover:text-white"
              >
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setStep(step + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
