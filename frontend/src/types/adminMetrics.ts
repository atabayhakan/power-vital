// Type definitions shared by useAdminMetrics and CartRecoveryView.

export interface CartRecoveryKpis {
  pending: number;
  notified: number;
  converted: number;
  expired: number;
  conversionRate: number;
  pendingValueKgs: number;
  recoveredValueKgs: number;
  activeSessions: number;
  recentOrdersLast10m: number;
  /**
   * Whether the backend SMTP transport is configured. When false the
   * email channel is log-only and the admin should see a banner on
   * the dashboard so they don't expect real delivery.
   */
  emailConfigured?: boolean;
  topProducts: Array<{
    productId: string;
    name: string;
    imageUrl: string;
    abandonedCount: number;
    totalValueKgs: number;
    lastSeenAt: string;
  }>;
  recent: Array<{
    id: string;
    userId: string | null;
    guestId: string | null;
    status: string;
    cartTotalKgs: number;
    lastActivityAt: string;
    productName?: string;
    productImage?: string;
  }>;
}
