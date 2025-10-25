import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

interface SplashScreenProps {
  isVisible: boolean;
  progress?: number;
  currentStep?: string;
}

const SplashScreen = ({
  isVisible,
  progress = 0,
  currentStep,
}: SplashScreenProps) => {
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
        setDisplayProgress((prev) => Math.min(prev + 5, progress));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, progress]);

  if (!isVisible) return null;

  const steps = [
    { id: 1, name: "Initializing", duration: 15 },
    { id: 2, name: "Loading Data", duration: 25 },
    { id: 3, name: "Processing", duration: 35 },
    { id: 4, name: "Finalizing", duration: 100 },
  ];

  const getCurrentStepIndex = () => {
    if (displayProgress < 15) return 0;
    if (displayProgress < 40) return 1;
    if (displayProgress < 75) return 2;
    return 3;
  };

  const currentStepIndex = getCurrentStepIndex();

  return <></>;
};

export default SplashScreen;
