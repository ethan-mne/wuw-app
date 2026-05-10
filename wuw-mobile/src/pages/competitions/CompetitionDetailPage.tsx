import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Card } from '../../components/ui';
import { MobileFooter } from '../../components/MobileFooter';
import { formatDrawDateDdMmYyyy } from '../../lib/formatDrawDate';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { defaultLocale, isLocale, withLocale } from '../../routes/locales';
import { mobileDataService } from '../../services/mobileDataService';
import type { Competition } from '../../types';
import { type CheckoutFlowState } from './checkoutFlow';

type CountdownParts = {
  day: string;
  hour: string;
  min: string;
  sec: string;
};

function toTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function getCountdownParts(endDate: string, nowMs: number): CountdownParts {
  const endMs = new Date(endDate).getTime();
  const remainingMs = Math.max(endMs - nowMs, 0);
  const totalSeconds = Math.floor(remainingMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    day: toTwoDigits(days),
    hour: toTwoDigits(hours),
    min: toTwoDigits(minutes),
    sec: toTwoDigits(seconds),
  };
}

function formatCurrencyCompact(value: number) {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: 'compact',
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('K', 'k');
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getVipPackDiscount(size: number) {
  if (size >= 50) return 25;
  if (size >= 25) return 20;
  if (size >= 20) return 15;
  return 10;
}

function getDiscountPercent(quantity: number) {
  if (quantity === 15 || quantity === 20 || quantity === 25 || quantity === 50) {
    return getVipPackDiscount(quantity);
  }
  return 0;
}

function formatUpperOrDash(value: string): string {
  const t = value.trim();
  if (t === '') return '—';
  return t.toUpperCase();
}

function formatYearDisplay(year: number): string {
  if (year === 0) return '—';
  return String(year);
}

function formatNaturalOrDash(value: string): string {
  const t = value.trim();
  return t === '' ? '—' : t;
}

function getPapersCopy(hasBox: boolean, hasCertificate: boolean): string {
  if (hasBox && hasCertificate) {
    return 'THIS PRODUCT COMES WITH FULL PAPERWORK, A NEW DIGITAL WARRANTY CARD AND IS FULLY BOXED';
  }
  if (hasCertificate) {
    return 'THIS PRODUCT COMES WITH FULL PAPERWORK AND A NEW DIGITAL WARRANTY CARD';
  }
  if (hasBox) {
    return 'THIS PRODUCT IS FULLY BOXED';
  }
  return 'SEE LISTING FOR BOX, PAPERS AND WARRANTY DETAILS';
}

export function CompetitionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const [competition, setCompetition] = useState<Competition | undefined>();
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const ticketPrice = competition?.ticketPrice ?? 0;
  const discountPercent = useMemo(() => getDiscountPercent(quantity), [quantity]);
  const discountedTicketPrice = useMemo(
    () => ticketPrice * (1 - discountPercent / 100),
    [ticketPrice, discountPercent],
  );
  const totalPrice = useMemo(
    () => (discountedTicketPrice * quantity).toFixed(2),
    [discountedTicketPrice, quantity],
  );

  useEffect(() => {
    void mobileDataService
      .getCompetition(params.id)
      .then((data) => {
        setCompetition(data);
        setLoading(false);
      })
      .catch(() => {
        setCompetition(undefined);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!competition && loading) {
    return (
      <div className="home-competitions-loading" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading competition...</span>
      </div>
    );
  }

  if (!competition && !loading) {
    return (
      <Card>
        <h2>Competition not found</h2>
        <button
          type="button"
          className="checkout-flow-button"
          onClick={() => navigate(withLocale(locale, 'competitions'))}
        >
          Back to competitions
        </button>
      </Card>
    );
  }
  if (!competition) {
    return null;
  }

  const watchName = `${competition.watch.brand} ${competition.watch.model}`.trim();
  const images =
    competition.watch.images.length > 0
      ? competition.watch.images
      : [{ url: '', alt: watchName || 'Competition watch' }];
  const selectedImage = images[selectedImageIndex] ?? images[0];
  const selectedImageSrc = resolveMediaUrl(selectedImage?.url);
  const countdown = getCountdownParts(competition.endDate, nowMs);
  const ticketOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const vipPackSizes = [15, 20, 25, 50];
  const chanceDenominator = (size: number) => Math.max(1, Math.ceil(competition.totalTickets / size));
  const onContinue = () => {
    navigate(withLocale(locale, `competitions/${competition.id}/question`), {
      state: {
        quantity,
        answer: null,
        discountPercent,
        timedOut: false,
      } satisfies CheckoutFlowState,
    });
  };

  return (
    <section className="competition-detail-page">
      <div className="competition-detail-countdown-banner">
        <div className="competition-detail-countdown" role="timer" aria-live="off">
          <div>
            <strong>{countdown.day}</strong>
            <span>DAY</span>
          </div>
          <div>
            <strong>{countdown.hour}</strong>
            <span>HOUR</span>
          </div>
          <div>
            <strong>{countdown.min}</strong>
            <span>MIN</span>
          </div>
          <div>
            <strong>{countdown.sec}</strong>
            <span>SEC</span>
          </div>
        </div>
        <p className="competition-detail-countdown-note">
          or until all tickets are sold out. But never after the draw date
        </p>
      </div>

      <div className="competition-detail-steps" aria-hidden>
        <div className="competition-detail-steps-labels">
          <div className="active">
            1. <span>Select your ticket</span>
          </div>
          <div>2.</div>
          <div>3.</div>
        </div>
        <div className="competition-detail-steps-track">
          <span className="active" />
          <span />
          <span />
        </div>
      </div>

      <div className="competition-detail-gallery">
        {selectedImageSrc ? (
          <img src={selectedImageSrc} alt={selectedImage.alt || watchName} className="competition-detail-main-image" />
        ) : (
          <div className="competition-detail-main-image competition-detail-main-image--placeholder">
            {competition.watch.model}
          </div>
        )}
        <div className="competition-detail-thumbs" role="list">
          {images.slice(0, 4).map((image, index) => {
            const thumbSrc = resolveMediaUrl(image.url);
            return (
              <button
                key={`${image.url || 'img'}-${index}`}
                type="button"
                className={index === selectedImageIndex ? 'active' : ''}
                onClick={() => setSelectedImageIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                {thumbSrc ? <img src={thumbSrc} alt={image.alt || watchName} /> : <span>{index + 1}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="competition-detail-content">
        <p className="competition-detail-eyebrow">Win the</p>
        <h1 className="competition-detail-title">{competition.name.toUpperCase()}</h1>

        <div className="competition-detail-meta">
          <div>
            <strong>{formatCurrencyCompact(competition.price)}</strong>
            <span>Watch Value</span>
          </div>
          <div>
            <strong>{formatCurrencyCompact(competition.ticketPrice)}</strong>
            <span>Entry Price</span>
          </div>
        </div>
        <div className="competition-detail-draw">
          <strong>{formatDrawDateDdMmYyyy(competition.endDate)}</strong>
          <span>Draw Date</span>
          <p>or until all tickets are sold out. But never after the draw date</p>
        </div>

        <div className="competition-detail-select">
          <h2>How many Tickets would you like ?</h2>
          <div className="competition-detail-ticket-grid" role="group" aria-label="Ticket quantity">
            {ticketOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={quantity === option ? 'active' : ''}
                onClick={() => setQuantity(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="competition-detail-vip">
          <h3>VIP Pack</h3>
          <div className="competition-detail-vip-grid">
            {vipPackSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setQuantity(size)}
                className={quantity === size ? 'active' : ''}
              >
                <strong>{size}</strong>
                <span>{getVipPackDiscount(size)} % off</span>
                <small>1/{chanceDenominator(size)} chance to win</small>
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="checkout-flow-button" onClick={onContinue}>
          Continue · GBP {totalPrice}
        </button>

        <div className="competition-detail-good-to-know" aria-labelledby="competition-good-to-know-title">
          <h2 id="competition-good-to-know-title" className="competition-detail-good-to-know-heading">
            <span className="competition-detail-good-to-know-heading-accent">Good</span>
            <span className="competition-detail-good-to-know-heading-rest"> to know</span>
          </h2>
          <div className="competition-detail-info-card">
            <h3>Watch &amp; competition informations</h3>
            <div className="competition-detail-info-stack">
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label">Maximum entries</p>
                <p className="competition-detail-info-value">{competition.totalTickets}</p>
              </section>
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label competition-detail-info-label--colon">
                  Maximum watch winners
                </p>
                <p className="competition-detail-info-value">{competition.maxWinners}</p>
              </section>
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label">Brand</p>
                <p className="competition-detail-info-value competition-detail-info-value--natural">
                  {formatNaturalOrDash(competition.watch.brand)}
                </p>
              </section>
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label">Model</p>
                <p className="competition-detail-info-value competition-detail-info-value--natural">
                  {formatNaturalOrDash(competition.watch.model)}
                </p>
              </section>
              <section className="competition-detail-info-block competition-detail-info-block--split">
                <div className="competition-detail-info-split-cell">
                  <p className="competition-detail-info-label">Reference number</p>
                  <p className="competition-detail-info-value">
                    {formatUpperOrDash(competition.watch.referenceNumber)}
                  </p>
                </div>
                <div className="competition-detail-info-split-rule" aria-hidden />
                <div className="competition-detail-info-split-cell">
                  <p className="competition-detail-info-label">Year</p>
                  <p className="competition-detail-info-value">{formatYearDisplay(competition.watch.yearOfManufacture)}</p>
                </div>
              </section>
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label">Movement</p>
                <p className="competition-detail-info-value">{formatUpperOrDash(competition.watch.movement)}</p>
              </section>
              <section className="competition-detail-info-block competition-detail-info-block--split">
                <div className="competition-detail-info-split-cell">
                  <p className="competition-detail-info-label">Glass</p>
                  <p className="competition-detail-info-value">{formatUpperOrDash(competition.watch.glass)}</p>
                </div>
                <div className="competition-detail-info-split-rule" aria-hidden />
                <div className="competition-detail-info-split-cell">
                  <p className="competition-detail-info-label">Bezel material</p>
                  <p className="competition-detail-info-value">{formatUpperOrDash(competition.watch.bezelMaterial)}</p>
                </div>
              </section>
              <section className="competition-detail-info-block">
                <p className="competition-detail-info-label">Papers</p>
                <p className="competition-detail-info-value competition-detail-info-value--multiline">
                  {getPapersCopy(competition.watch.hasBox, competition.watch.hasCertificate)}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <MobileFooter />
    </section>
  );
}
