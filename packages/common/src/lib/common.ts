export function common(): string {
  return 'common';
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function createResponse<T>(
  data: T,
  status: 'success' | 'error' = 'success',
  at?: Date
) {
  return {
    status,
    data,
    timestamp: formatTimestamp(at ?? new Date())
  };
}
