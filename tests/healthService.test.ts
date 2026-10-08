import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getJson } from '../src/services/api'
import { getHealth } from '../src/services/healthService'

beforeEach(() => vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api'))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('Backend health API contract', () => {
  it('calls the exact URL and accepts the backend response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"UP"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getHealth()).resolves.toEqual({ status: 'UP' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/health',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }))
  })

  it.each([400, 500])('reports HTTP %s without accepting the response', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
    await expect(getHealth()).rejects.toMatchObject({ status })
  })

  it('reports network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(getHealth()).rejects.toThrow('Không kết nối được Backend')
  })

  it('rejects a different health contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"status":"DOWN"}')))
    await expect(getHealth()).rejects.toThrow('API contract')
  })

  it('rejects invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>error</html>')))
    await expect(getHealth()).rejects.toThrow('JSON không hợp lệ')
  })

  it('reports missing environment configuration', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    await expect(getHealth()).rejects.toThrow('VITE_API_BASE_URL')
  })

  it('aborts a request when the timeout expires', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const result = expect(getJson('/health', 100)).rejects.toThrow('quá thời gian chờ')
    await vi.advanceTimersByTimeAsync(100)
    await result
  })

  it('normalizes trailing slashes in the configured URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/')
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"UP"}'))
    vi.stubGlobal('fetch', fetchMock)
    await getHealth()
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/health')
  })

  it('does not append the API version twice when it is already configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1/')
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"UP"}'))
    vi.stubGlobal('fetch', fetchMock)
    await getHealth()
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/health')
  })
})
