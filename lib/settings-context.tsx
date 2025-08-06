"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Settings {
  cafe_name: string;
  location: string;
  phone_number: string;
  operating_hours: { open: string; close: string };
  system_config: {
    auto_print: boolean;
    notifications: boolean;
    kitchen_auto_refresh: boolean;
    order_timeout_alerts: boolean;
  };
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings({
            cafe_name: data.cafe_name || '',
            location: data.location || '',
            phone_number: data.phone_number || '',
            operating_hours: data.operating_hours || { open: '06:00', close: '22:00' },
            system_config: data.system_config || {
              auto_print: true,
              notifications: true,
              kitchen_auto_refresh: true,
              order_timeout_alerts: true,
            },
          });
        }
      });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
} 