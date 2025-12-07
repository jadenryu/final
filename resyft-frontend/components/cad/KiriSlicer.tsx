"use client"

import { useRef, useEffect, useCallback, useState } from 'react'

// Kiri:Moto hidden iframe slicer
// Uses the Frame API to slice STL to G-code

interface KiriSlicerProps {
  onReady?: () => void
  onProgress?: (progress: number, message: string) => void
  onGCode?: (gcode: string) => void
  onError?: (error: string) => void
}

interface KiriMessage {
  event?: string
  progress?: number
  message?: string
  gcode?: string
  error?: string
  loaded?: boolean
  done?: boolean
}

export function useKiriSlicer() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isSlicing, setIsSlicing] = useState(false)
  const resolveRef = useRef<((gcode: string) => void) | null>(null)
  const rejectRef = useRef<((error: Error) => void) | null>(null)
  const progressRef = useRef<((progress: number) => void) | null>(null)

  // Handle messages from Kiri iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from grid.space
      if (!event.origin.includes('grid.space')) return

      const data = event.data as KiriMessage
      console.log('Kiri message:', data)

      if (data.event === 'ready') {
        setIsReady(true)
      }

      if (data.event === 'progress' && data.progress !== undefined) {
        progressRef.current?.(data.progress * 100)
      }

      if (data.event === 'slice.done') {
        // After slicing, prepare the G-code
        postToKiri({ cmd: 'prepare' })
      }

      if (data.event === 'prepare.done') {
        // After preparing, export G-code
        postToKiri({ cmd: 'export' })
      }

      if (data.event === 'export' && data.gcode) {
        setIsSlicing(false)
        resolveRef.current?.(data.gcode)
        resolveRef.current = null
      }

      if (data.error) {
        setIsSlicing(false)
        rejectRef.current?.(new Error(data.error))
        rejectRef.current = null
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Post message to Kiri iframe
  const postToKiri = useCallback((data: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, 'https://grid.space')
    }
  }, [])

  // Slice STL data to G-code
  const slice = useCallback((
    stlData: ArrayBuffer,
    settings?: {
      layerHeight?: number
      infillDensity?: number
      printSpeed?: number
      bedWidth?: number
      bedDepth?: number
      bedHeight?: number
    },
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isReady) {
        reject(new Error('Kiri slicer not ready'))
        return
      }

      setIsSlicing(true)
      resolveRef.current = resolve
      rejectRef.current = reject
      progressRef.current = onProgress || null

      // Set FDM mode
      postToKiri({ cmd: 'mode', mode: 'FDM' })

      // Set device (printer) settings
      postToKiri({
        cmd: 'device',
        settings: {
          bedWidth: settings?.bedWidth || 220,
          bedDepth: settings?.bedDepth || 220,
          maxHeight: settings?.bedHeight || 250,
        }
      })

      // Set process (print) settings
      postToKiri({
        cmd: 'process',
        settings: {
          sliceHeight: settings?.layerHeight || 0.2,
          sliceFillSparse: (settings?.infillDensity || 20) / 100,
          outputFeedrate: settings?.printSpeed || 50,
        }
      })

      // Clear any existing models
      postToKiri({ cmd: 'clear' })

      // Parse the STL data
      // Convert ArrayBuffer to base64 for transfer
      const base64 = btoa(
        new Uint8Array(stlData).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      postToKiri({
        cmd: 'parse',
        data: base64,
        type: 'stl',
        encoding: 'base64'
      })

      // Start slicing after a short delay to let the model load
      setTimeout(() => {
        postToKiri({ cmd: 'slice' })
      }, 500)
    })
  }, [isReady, postToKiri])

  // Create the hidden iframe element
  const KiriFrame = useCallback(() => (
    <iframe
      ref={iframeRef}
      src="https://grid.space/kiri/?noshow=1"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        border: 'none',
      }}
      sandbox="allow-scripts allow-same-origin"
      title="Kiri:Moto Slicer"
    />
  ), [])

  return {
    KiriFrame,
    slice,
    isReady,
    isSlicing,
  }
}

export default function KiriSlicer({ onReady, onProgress, onGCode, onError }: KiriSlicerProps) {
  const { KiriFrame, isReady } = useKiriSlicer()

  useEffect(() => {
    if (isReady) {
      onReady?.()
    }
  }, [isReady, onReady])

  return <KiriFrame />
}
