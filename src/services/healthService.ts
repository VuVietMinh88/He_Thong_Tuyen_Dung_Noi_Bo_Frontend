import { ApiError, getJson } from './api'

export interface HealthResponse {
  status: 'UP'
}

export async function getHealth(): Promise<HealthResponse> {
  const data = await getJson('/health')
  if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'UP') {
    throw new ApiError('Response health không đúng API contract.')
  }
  return { status: 'UP' }
}
