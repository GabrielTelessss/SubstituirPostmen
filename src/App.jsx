import './App.scss'
import { useCallback, useState } from 'react'
import axios from 'axios'
import Header from './components/Header/Header.jsx'
import FormPanel from './components/FormPanel/FormPanel.jsx'
import ResponsePanel from './components/ResponsePanel/ResponsePanel.jsx'

export default function App() {
  const [requestState, setRequestState] = useState({
    loading: false,
    url: '',
    startedAt: null,
    durationMs: null,
    payload: null,
    responseData: null,
    httpStatus: null,
    error: null,
    corsLikely: false,
  })

  const handleSend = useCallback(async ({ url, authorization, payload }) => {
    const start = performance.now()
    setRequestState({
      loading: true,
      url,
      startedAt: new Date().toISOString(),
      durationMs: null,
      payload,
      responseData: null,
      httpStatus: null,
      error: null,
      corsLikely: false,
    })

    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: authorization || '',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      })
      const durationMs = Math.round(performance.now() - start)
      setRequestState((prev) => ({
        ...prev,
        loading: false,
        durationMs,
        responseData: res.data,
        httpStatus: res.status,
        error: null,
        corsLikely: false,
      }))
    } catch (err) {
      const durationMs = Math.round(performance.now() - start)
      const hasResponse = Boolean(err?.response)
      const message = hasResponse
        ? `HTTP ${err.response.status}`
        : err?.code === 'ECONNABORTED'
          ? 'Timeout'
          : err?.message || 'Erro de rede'
      const corsLikely = !hasResponse && String(err?.message || '').toLowerCase().includes('network error')

      setRequestState((prev) => ({
        ...prev,
        loading: false,
        durationMs,
        httpStatus: hasResponse ? err.response.status : null,
        responseData: hasResponse ? err.response.data : null,
        error: {
          message,
          detail: hasResponse ? err.response.data : null,
        },
        corsLikely,
      }))
    }
  }, [])

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <section className="app__panel app__panel--left">
          <FormPanel onSend={handleSend} sending={requestState.loading} />
        </section>
        <section className="app__panel app__panel--right">
          <ResponsePanel requestState={requestState} />
        </section>
      </main>
    </div>
  )
}
