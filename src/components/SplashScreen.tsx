import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  progress?: number;
  currentStep?: string;
}

const SplashScreen = ({
  isVisible,
  progress = 0,
}: SplashScreenProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);


  useEffect(() => {
    if (displayProgress < progress) {
      const timer = setTimeout(() => {
        setDisplayProgress((prev) => Math.min(prev + 5, progress));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, progress]);

  if (!isVisible) return null;

  return <></>;
};

export default SplashScreen;
