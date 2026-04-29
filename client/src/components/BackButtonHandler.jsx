import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/') {
        // On home page - don't exit the app, just stay on home
        canGoBack ? navigate(-1) : null;
      } else {
        // Not on home page - go back
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.remove();
    };
  }, [navigate, location.pathname]);

  return null;
}
