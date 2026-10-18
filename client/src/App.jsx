import { useEffect, useState } from 'react'
import axios from 'axios'

export default function App() {
  const [status, setStatus] = useState('Checking server...')

  useEffect(() => {
    axios
      .get('/api/health')
      .then((res) => setStatus(res.data.message))
      .catch(() => setStatus('Server not reachable'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 text-slate-800">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">Campus Concierge</h1>
        <p className="mt-3 text-slate-500">{status}</p>
      </div>
    </div>
  )
}