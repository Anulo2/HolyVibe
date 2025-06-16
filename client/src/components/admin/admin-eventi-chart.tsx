"use client"

import { useEffect, useRef } from "react"

export function AdminEventiChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    // Dati di esempio
    const labels = ["1 Giu", "5 Giu", "10 Giu", "15 Giu", "20 Giu", "25 Giu", "30 Giu"]
    const data = [12, 19, 15, 22, 25, 30, 28]

    // Dimensioni del canvas
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    const padding = 40

    // Pulisci il canvas
    ctx.clearRect(0, 0, width, height)

    // Disegna gli assi
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.strokeStyle = "#e2e8f0"
    ctx.stroke()

    // Calcola le scale
    const maxValue = Math.max(...data) * 1.2
    const xScale = (width - padding * 2) / (labels.length - 1)
    const yScale = (height - padding * 2) / maxValue

    // Disegna la griglia orizzontale
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i * (height - padding * 2)) / 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.strokeStyle = "#e2e8f0"
      ctx.stroke()

      // Etichette asse Y
      ctx.fillStyle = "#64748b"
      ctx.font = "10px Inter, sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(Math.round((i * maxValue) / 5).toString(), padding - 5, y + 3)
    }

    // Disegna le etichette dell'asse X
    labels.forEach((label, i) => {
      const x = padding + i * xScale
      ctx.fillStyle = "#64748b"
      ctx.font = "10px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(label, x, height - padding + 15)
    })

    // Disegna la linea del grafico
    ctx.beginPath()
    ctx.moveTo(padding, height - padding - data[0] * yScale)

    for (let i = 1; i < data.length; i++) {
      const x = padding + i * xScale
      const y = height - padding - data[i] * yScale
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.stroke()

    // Disegna l'area sotto la linea
    ctx.lineTo(padding + (data.length - 1) * xScale, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
    ctx.fill()

    // Disegna i punti
    data.forEach((value, i) => {
      const x = padding + i * xScale
      const y = height - padding - value * yScale

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "#3b82f6"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [])

  return (
    <div className="w-full h-[300px]">
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
    </div>
  )
}
