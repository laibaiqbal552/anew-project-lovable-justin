import { useEffect, useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface SplashScreenProps {
  isVisible: boolean;
  progress?: number;
  currentStep?: string;
}

const SplashScreen = ({ isVisible, progress = 0, currentStep }: SplashScreenProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (displayProgress < progress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 5, progress));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, progress]);

  if (!isVisible) return null;

  const steps = [
    { id: 1, name: 'Initializing', duration: 15 },
    { id: 2, name: 'Loading Data', duration: 25 },
    { id: 3, name: 'Processing', duration: 35 },
    { id: 4, name: 'Finalizing', duration: 100 }
  ];

  const getCurrentStepIndex = () => {
    if (displayProgress < 15) return 0;
    if (displayProgress < 40) return 1;
    if (displayProgress < 75) return 2;
    return 3;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white bg-opacity-10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-md border border-white border-opacity-20">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <div className="absolute inset-0 w-10 h-10 animate-ping rounded-full bg-blue-300 opacity-20"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2 font-display">TopServ</h1>
        <p className="text-blue-100 text-lg mb-12">Digital Brand Equity Analyzer</p>

        {/* Progress Section */}
        <div className="bg-white bg-opacity-5 backdrop-blur-md rounded-2xl border border-white border-opacity-10 p-8">
          {/* Main Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-blue-100">Overall Progress</span>
              <span className="text-sm font-bold text-white">{displayProgress}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-10 rounded-full h-3 overflow-hidden border border-white border-opacity-20">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${displayProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-white bg-opacity-15 border border-white border-opacity-30'
                      : isCompleted
                      ? 'bg-green-400 bg-opacity-10'
                      : 'bg-white bg-opacity-5 border border-white border-opacity-10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-400 text-white'
                      : isActive
                      ? 'bg-blue-400 text-white'
                      : 'bg-white bg-opacity-10 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isCompleted || isActive
                        ? 'text-white'
                        : 'text-gray-300'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-100"></span>
                      <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse animation-delay-200"></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Status Message */}
          {currentStep && (
            <div className="mt-6 p-3 bg-blue-400 bg-opacity-10 border border-blue-400 border-opacity-30 rounded-lg">
              <p className="text-sm text-blue-100">{currentStep}</p>
            </div>
          )}
        </div>

        {/* Footer Message */}
        <p className="text-gray-300 text-xs mt-8 opacity-75">
          Analyzing your digital presence across all platforms...
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
