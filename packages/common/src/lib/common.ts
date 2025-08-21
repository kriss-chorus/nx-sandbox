export function common(): string {
  return 'common';
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function createResponse<T>(data: T, status: 'success' | 'error' = 'success') {
  return {
    status,
    data,
    timestamp: formatTimestamp(),
    version: '1.0.0'  // Add version for debugging
  };
}
