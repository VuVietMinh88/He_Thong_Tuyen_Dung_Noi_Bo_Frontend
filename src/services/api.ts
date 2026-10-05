export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getJson(path: string, timeoutMs = 10000): Promise<unknown> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!baseUrl) throw new ApiError('Chưa cấu hình VITE_API_BASE_URL.')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`,
      { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal },
    )
    if (!response.ok) {
      throw new ApiError(`Backend trả về lỗi HTTP ${response.status}.`, response.status)
    }
    try {
      return await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiError('Backend trả về JSON không hợp lệ.')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(controller.signal.aborted
      ? 'Backend phản hồi quá thời gian chờ.'
      : 'Không kết nối được Backend. Kiểm tra server, mạng và cấu hình CORS.')
  } finally {
    clearTimeout(timeout)
  }
}
