'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseWebSocketOptions {
  url: string | null
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttemptRef = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const { toast } = useToast()

  const connect = useCallback(() => {
    // Don't connect if URL is null
    if (!url) {
      return
    }

    try {
      // Use the URL as-is (token can be in path or query param depending on endpoint)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttemptRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        onClose?.()

        // Attempt reconnection
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1
            connect()
          }, reconnectInterval)
        } else {
          toast({
            title: 'Connection lost',
            description: 'Unable to connect to real-time updates',
            variant: 'destructive',
          })
        }
      }

      ws.onerror = (error) => {
        // Suppress logging empty error objects (common when server is not available)
        if (error && Object.keys(error).length > 0) {
          console.error('WebSocket error:', error)
        }
        onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [url, onMessage, onOpen, onClose, onError, maxReconnectAttempts, reconnectInterval, toast])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Send periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' })
    }, 30000) // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval)
    }
  }, [isConnected, sendMessage])

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect,
  }
}
