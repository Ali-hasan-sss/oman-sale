'use client';

import { Check } from 'lucide-react';

export type RegisterFlowStep = 'info' | 'email-code' | 'phone' | 'phone-code' | 'password';

type RegisterStepperProps = {
  currentStep?: RegisterFlowStep;
  activeStepIndex?: number;
  steps: Array<{ label: string }>;
  ariaLabel: string;
};

function getActiveStepIndex(step: RegisterFlowStep): number {
  switch (step) {
    case 'info':
      return 0;
    case 'email-code':
      return 1;
    case 'phone':
    case 'phone-code':
      return 2;
    case 'password':
      return 3;
    default:
      return 0;
  }
}

export function RegisterStepper({ currentStep, activeStepIndex, steps, ariaLabel }: RegisterStepperProps) {
  const activeIndex = activeStepIndex ?? (currentStep ? getActiveStepIndex(currentStep) : 0);

  return (
    <nav aria-label={ariaLabel} className="mb-8 min-w-0">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className={`flex min-w-0 ${isLast ? 'shrink-0' : 'flex-1'}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className={`flex w-full items-center ${isLast ? 'justify-center' : ''}`}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition sm:h-10 sm:w-10 sm:text-sm ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-green-600 text-white ring-4 ring-green-100'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check aria-hidden className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} /> : index + 1}
                  </div>

                  {!isLast ? (
                    <div
                      aria-hidden
                      className={`mx-1 h-0.5 min-w-[0.5rem] flex-1 rounded-full sm:mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  ) : null}
                </div>

                <span
                  className={`mt-1.5 max-w-[4.25rem] text-center text-[10px] leading-tight sm:mt-2 sm:max-w-[5.5rem] sm:text-xs ${
                    isActive ? 'font-bold text-green-700' : isCompleted ? 'font-medium text-gray-700' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
