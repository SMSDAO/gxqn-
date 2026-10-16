export interface PriceAlert {
  id: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
}

class AlertService {
  private alerts: PriceAlert[] = [];

  addAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): PriceAlert {
    const newAlert: PriceAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    this.alerts.push(newAlert);
    return newAlert;
  }

  removeAlert(alertId: string) {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
  }

  getAlerts(tokenSymbol?: string): PriceAlert[] {
    return tokenSymbol ? this.alerts.filter((a) => a.tokenSymbol === tokenSymbol) : this.alerts;
  }

  checkAlerts(tokenSymbol: string, currentPrice: number): PriceAlert[] {
    const triggered: PriceAlert[] = [];
    this.alerts = this.alerts.filter((alert) => {
      if (alert.tokenSymbol !== tokenSymbol) return true;
      
      let triggeredCondition = false;
      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) triggeredCondition = true;
      if (alert.condition === 'below' && currentPrice <= alert.targetPrice) triggeredCondition = true;
      
      if (triggeredCondition) {
        triggered.push(alert);
        return false; // Remove triggered alert
      }
      return true;
    });
    return triggered;
  }
}

export const alertService = new AlertService();
