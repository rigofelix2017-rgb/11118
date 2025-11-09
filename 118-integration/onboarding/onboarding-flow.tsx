import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wallet, Check, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: 'Welcome to the Void',
      description: 'Your embedded wallet has been created automatically',
      icon: Wallet,
      action: 'Continue',
    },
    {
      title: 'Explore the World',
      description: 'Move with WASD, chat with others, and discover the mysteries',
      icon: Sparkles,
      action: 'Start Playing',
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-black/95 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>

          <Card className="bg-background/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                Wallet Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Your secure embedded wallet is ready. No seed phrases to manage!
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
            data-testid="button-onboarding-next"
          >
            {currentStep.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
