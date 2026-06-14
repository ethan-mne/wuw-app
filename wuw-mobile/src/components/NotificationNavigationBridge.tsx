import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  competitionDetailPath,
  consumePendingCompetitionNavigation,
  registerNotificationNavigator,
} from '../lib/notificationNavigation';

/** Connects React Router to notification tap handlers (local + push). */
export function NotificationNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    registerNotificationNavigator(navigate);

    const pending = consumePendingCompetitionNavigation();
    if (pending) {
      navigate(competitionDetailPath(pending), { replace: true });
    }

    return () => {
      registerNotificationNavigator(null);
    };
  }, [navigate]);

  return null;
}
