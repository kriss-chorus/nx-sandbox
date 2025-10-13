// Legacy hook - maintained for backward compatibility
// New code should use the individual hooks from the index file

import { useDashboardData } from './useDashboardData';
import { DashboardData } from '../types/dashboard';

export function useDashboardDataPostGraphile(slug?: string, clientId?: string): DashboardData & { refetch: () => void } {
  // Use the new focused hook for data fetching
  return useDashboardData(slug, clientId);
}

// Re-export the CRUD hook for backward compatibility
export { useDashboardCRUD } from './useDashboardCRUD';