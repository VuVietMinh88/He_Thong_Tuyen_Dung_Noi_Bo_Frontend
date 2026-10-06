import { useState } from 'react'
import { getHealth } from './services/healthService'

function App() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Chưa kiểm tra kết nối Backend.')

  async function checkConnection() {
    setPending(true)
    setMessage('Đang kiểm tra kết nối...')
    try {
      const health = await getHealth()
      setMessage(`Kết nối Backend thành công: ${health.status}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không kiểm tra được kết nối.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main>
      <h1>Hệ thống tuyển dụng nội bộ</h1>
      <p>Frontend — K3S4_N3</p>
      <button type="button" disabled={pending} onClick={() => void checkConnection()}>
        {pending ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Backend'}
      </button>
      <p role="status" aria-live="polite">{message}</p>
    </main>
  )
}

export default App
