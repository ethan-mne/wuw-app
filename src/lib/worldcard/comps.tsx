/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client';
import { useEffect, useState, useCallback } from 'react';
import { cardBrands } from './config';
import { env } from '@/env';
import Script from 'next/script';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  VisaLogo,
  MastercardLogo,
  ApplePayLogo,
} from '@/components/payment-logos';

type LoadingState = 'idle' | 'loading' | 'ready' | 'error' | 'retrying';

declare global {
  interface Window {
    wpwlOptions?: {
      locale?: string;
      brands?: string[];
      showCVVHint?: boolean;
      brandDetection?: boolean;
      showLabels?: boolean;
      iframeStyles?: Record<string, Record<string, string>>;
      style?: 'card' | 'plain' | 'logos';
      maskCvv?: boolean;
      onReady?: () => void;
      onError?: (error: {
        message: string;
        code: string;
        type: string;
      }) => void;
      onChangeBrand?: () => void;
    };
  }
}

function useWorldCardCheckoutId(showPayment: boolean) {
  // const [ready, setReady] = useState(false);
  // const [dotsClicked, setDotsClicked] = useState(false);

  useEffect(() => {
    if (showPayment) {
      window.wpwlOptions = {
        style: 'plain',
        brandDetection: true,
        showLabels: true,
        maskCvv: true,
        iframeStyles: {},
        onReady: () => {
          // const emptySpace = document.querySelector('.wpwl-group-brand');
          // if (emptySpace instanceof HTMLElement) {
          //   emptySpace.remove();
          // }
          const ApplePay = document.querySelector('.wpwl-apple-pay-button');
          if (ApplePay instanceof HTMLElement) {
            ApplePay.style.width = '100%'; // Changed to 100% as per your requirements
            ApplePay.style.height = '50px';
            // ApplePay.style.borderRadius = '5px';
            ApplePay.style.fontSize = '18px';
            ApplePay.style.textAlign = 'center'; // Added to center the text
            console.log('style applied to Apple Pay');
          }

          const PayButton = document.querySelector('.wpwl-button-pay'); // Changed to .wpwl-button-pay to target the correct button
          if (PayButton instanceof HTMLElement) {
            PayButton.style.background = 'hsl(var(--primary))';
            PayButton.style.width = '100%';
            PayButton.style.height = '45px';
            // PayButton.style.borderRadius = '5px';
            PayButton.style.fontSize = '16px';
            PayButton.style.fontWeight = 'bold';
            PayButton.style.textAlign = 'center';
            PayButton.style.color = 'hsl(var(--primary-foreground))';
          }
        },
        onError: (error) => {
          console.error('Payment widget error:', error);
          toast.error(`Payment error: ${error.message}`);
        },
        // onChangeBrand: () => {
        //   if (!ready || dotsClicked) {
        //     return;
        //   }
        //   // Clears all previous dots-hidden logos, if any
        //   $('.wpwl-group-card-logos-horizontal > div').removeClass(
        //     'dots-hidden',
        //   );

        //   // Selects all non-hidden logos. They are detected brands which otherwise would be shown by default.
        //   const $logos = $(
        //     '.wpwl-group-card-logos-horizontal > div:not(.wpwl-hidden)',
        //   );
        //   if ($logos.length < 2) {
        //     return;
        //   }

        //   // Hides all except the first logo, and displays three dots (...)
        //   $logos.first().after($('<div>...</div>').addClass('dots'));
        //   $logos
        //     .filter(function (index) {
        //       return index > 0;
        //     })
        //     .addClass('dots-hidden');

        //   // If ... is clicked, un-hides the logos
        //   $('.dots').click(function () {
        //     setDotsClicked(true);
        //     $('.dots-hidden').removeClass('dots-hidden');
        //     $(this).remove();
        //   });
        // },
      };
    }
  }, [showPayment]);
}

interface LoadingIndicatorProps {
  state: LoadingState;
  retryCount: number;
  maxRetries: number;
}

function LoadingIndicator({
  state,
  retryCount,
  maxRetries,
}: LoadingIndicatorProps) {
  const getMessage = () => {
    switch (state) {
      case 'loading':
        return 'Initializing payment form...';
      case 'retrying':
        return `Retrying... (Attempt ${retryCount}/${maxRetries})`;
      case 'error':
        return 'Failed to load payment form';
      default:
        return 'Loading payment form...';
    }
  };

  if (state === 'ready') return null;

  return (
    <div className='flex flex-col gap-3 justify-center items-center min-h-[320px] bg-white/50 backdrop-blur-sm rounded-lg border border-border/50'>
      <div className='flex flex-col items-center gap-4'>
        {state === 'error' ? (
          <AlertCircle className='h-8 w-8 text-destructive animate-pulse' />
        ) : (
          <div className='relative'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            <div className='absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/10' />
          </div>
        )}
        <p
          className={`text-sm font-medium ${state === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {getMessage()}
        </p>
      </div>
      {state === 'retrying' && (
        <div className='w-48 h-1.5 bg-muted rounded-full overflow-hidden'>
          <div
            className='h-full bg-primary transition-all duration-300 ease-in-out'
            style={{ width: `${(retryCount / maxRetries) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function WorldCardForm({ worldCardId }: { worldCardId: string | null }) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const LogoArgs = {
    width: 60,
    height: 40,
  };
  useWorldCardCheckoutId(!!worldCardId);

  const handleScriptLoad = useCallback(() => {
    setLoadingState('ready');
    setRetryCount(0);
    console.log('Payment widget script loaded successfully');
  }, []);

  const handleScriptError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setLoadingState('retrying');
      console.log(`Retrying widget load (${retryCount + 1}/${MAX_RETRIES})...`);

      const retryDelay = Math.min(2000 * Math.pow(1.5, retryCount), 8000); // Exponential backoff

      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setLoadingState('loading');
      }, retryDelay);
    } else {
      setLoadingState('error');
      toast.error('Failed to load payment widget after multiple attempts', {
        description: 'Please refresh the page to try again',
      });
    }
  }, [retryCount]);

  const RenderContent = () => {
    if (!worldCardId) {
      return null;
    }

    return (
      <div className='relative'>
        <LoadingIndicator
          state={loadingState}
          retryCount={retryCount}
          maxRetries={MAX_RETRIES}
        />
        <div
          className={
            loadingState !== 'ready'
              ? 'opacity-0'
              : 'opacity-100 transition-opacity duration-300'
          }
        >
          <Script
            src={`${env.NEXT_PUBLIC_WORLD_CARD_URL}/v1/paymentWidgets.js?checkoutId=${worldCardId}`}
            onLoad={handleScriptLoad}
            onError={handleScriptError}
          />
          <div className='flex items-center justify-center gap-3 mb-4 p-3'>
            <div className='flex items-center gap-2'>
              <VisaLogo {...LogoArgs} />
              <MastercardLogo {...LogoArgs} />
              <ApplePayLogo {...LogoArgs} />
            </div>
            <span className='text-sm text-muted-foreground'>
              We currently only support Visa and Mastercard payments
            </span>
          </div>
          <form className='paymentWidgets' data-brands={cardBrands.join(' ')} />
        </div>
      </div>
    );
  };

  return (
    <div className='w-full max-w-[480px] mx-auto px-6 rounded-xl shadow-sm'>
      <RenderContent />
    </div>
  );
}
