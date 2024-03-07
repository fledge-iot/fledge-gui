// interface for System Alert

export class SystemAlert {
    key: string;
    message: string;
    timestamp: Date;
    urgency: string;
}

export class SystemAlerts {
    alerts: SystemAlert[];
}
  