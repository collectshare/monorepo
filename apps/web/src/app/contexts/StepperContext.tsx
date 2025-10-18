import React, { createContext, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

interface IStepperContextValue {
  previousStep: () => void;
  nextStep: () => void;
}

export const StepperContext = createContext({} as IStepperContextValue);

interface IStepperProps {
  initialStep?: number;
  showSteps?: boolean;
  steps: {
    label: string;
    content: React.ReactNode;
  }[];
}

export function StepperProvider({ steps, initialStep = 0, showSteps = true }: IStepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const previousStep = useCallback(() => {
    setCurrentStep(prevState => Math.max(0, prevState - 1));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prevState => (
      Math.min(steps.length - 1, prevState + 1)
    ));
  }, [steps]);

  return (
    <StepperContext.Provider value={{ previousStep, nextStep }}>
      <div>
        {showSteps && (
          <ul className="space-x-6">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={cn(
                  'inline-block text-xs px-2 py-1 rounded-md',
                  index === currentStep && 'bg-primary text-primary-foreground',
                )}
              >
                {String(index + 1).padStart(2, '0')}. {step.label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          {steps[currentStep].content}
        </div>
      </div>
    </StepperContext.Provider>
  );
}
