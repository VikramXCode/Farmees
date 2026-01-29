import React from 'react';
import { Check } from 'lucide-react';

/**
 * StepProgress - Visual step indicator for wizard flows
 * 
 * Design principles:
 * - Clear visual progress
 * - Numbered steps for farmers
 * - Green checkmarks for completed
 * - Large, accessible touch targets
 */

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  variant?: 'horizontal' | 'vertical';
}

export default function StepProgress({
  steps,
  currentStep,
  onStepClick,
  variant = 'horizontal',
}: StepProgressProps) {
  if (variant === 'vertical') {
    return (
      <div className="flex flex-col gap-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div
              key={step.id}
              className="flex items-start gap-4"
              onClick={() => isClickable && onStepClick?.(step.id)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    text-lg font-bold transition-all duration-300
                    ${isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-green-600 text-white ring-4 ring-green-200'
                        : 'bg-gray-200 text-gray-500'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-1 h-12 mt-2 rounded-full transition-colors duration-300
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="pt-2 flex-1">
                <p
                  className={`
                    font-semibold transition-colors
                    ${isCurrent ? 'text-green-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div
                className="flex flex-col items-center"
                onClick={() => isClickable && onStepClick?.(step.id)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    text-sm sm:text-base font-bold transition-all duration-300
                    ${isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-green-600 text-white ring-4 ring-green-200'
                        : 'bg-gray-200 text-gray-500'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`
                    text-xs sm:text-sm font-medium mt-2 text-center max-w-[80px] sm:max-w-[100px]
                    ${isCurrent ? 'text-green-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-300
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * StepProgressBar - Simple progress bar for compact displays
 */
interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  showLabel = true,
}: StepProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-bold text-green-600">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
