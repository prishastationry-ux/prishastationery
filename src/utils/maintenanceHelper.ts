import { StoreSettings } from '../types';

export interface MaintenanceStatus {
  isMaintenance: boolean;
  reason: string;
  reopenTime: string;
  type: 'manual' | 'afternoon' | 'night' | 'none';
}

export function checkStoreMaintenance(settings: StoreSettings, now = new Date()): MaintenanceStatus {
  // 1. Manual Emergency Maintenance Mode (Admin Switch ON)
  if (settings.maintenanceEnabled) {
    return {
      isMaintenance: true,
      reason: settings.maintenanceMessage || '🛠️ પ્રિષા સ્ટેશનરી & ઓનલાઇન પોર્ટલ હાલ મેન્ટેનન્સ અર્થે બંધ છે.',
      reopenTime: settings.maintenanceReopenTime || 'ટૂંક સમયમાં શરૂ થશે',
      type: 'manual'
    };
  }

  // 2. Automatic Schedule Check (if autoMaintenanceEnabled is not false)
  if (settings.autoMaintenanceEnabled !== false) {
    const hours = now.getHours(); // 0 - 23
    const minutes = now.getMinutes(); // 0 - 59

    // Afternoon Recess: 2:00 PM to 2:30 PM (14:00 to 14:30)
    if (hours === 14 && minutes >= 0 && minutes < 30) {
      return {
        isMaintenance: true,
        reason: '🍱 બપોરના વિરામ (Break) અને સ્ટોક મેન્ટેનન્સ અર્થે ઓનલાઇન પોર્ટલ બંધ છે.',
        reopenTime: settings.maintenanceReopenTime || 'બપોરે ૨:૩૦ વાગ્યે',
        type: 'afternoon'
      };
    }

    // Night Rest: 11:00 PM to 6:00 AM (23:00 to 06:00)
    if (hours >= 23 || hours < 6) {
      return {
        isMaintenance: true,
        reason: '🌙 રાત્રિના સમયે ઓનલાઇન પોર્ટલ અને ઓર્ડર સિસ્ટમ બંધ રહે છે.',
        reopenTime: settings.maintenanceReopenTime || 'સવારે ૬:૦૦ વાગ્યે',
        type: 'night'
      };
    }
  }

  return {
    isMaintenance: false,
    reason: '',
    reopenTime: '',
    type: 'none'
  };
}
