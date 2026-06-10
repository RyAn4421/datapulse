'use client';
import { useState, useEffect } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';
import { useStore } from '@/lib/store';

export default function Tour() {
  const { theme } = useStore();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const isCompleted = localStorage.getItem('datapulse-tour-completed');
    if (!isCompleted) {
      // Small delay to ensure UI elements are mounted
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to DataPulse! Let\'s take a quick tour of your new AI-powered analytics workspace.',
      placement: 'center',
    },
    {
      target: '#sample-datasets-section',
      content: 'Start instantly by loading one of our pre-built sample datasets. We have data for Sales, Marketing, HR, Finance, and more!',
      placement: 'top',
    },
    {
      target: '.upload-zone',
      content: 'Or upload your own CSV or Excel files here to begin analyzing your own data.',
      placement: 'top',
    },
    {
      target: '#notification-bell',
      content: 'Keep an eye on the notification center for insights, smart alerts, and completed background tasks.',
      placement: 'bottom',
    },
    {
      target: '#activity-nav',
      content: 'You can always review your recent actions and past activity in the Activity Log.',
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('datapulse-tour-completed', 'true');
    }
  };

  if (!run) return null;

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      options={{
        zIndex: 10000,
        primaryColor: '#6C63FF',
        backgroundColor: theme === 'dark' ? '#111113' : '#FFFFFF',
        textColor: theme === 'dark' ? '#FAFAFA' : '#111827',
        arrowColor: theme === 'dark' ? '#111113' : '#FFFFFF',
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  );
}
