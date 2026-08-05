import { useEffect, useState, useRef } from "react"

interface Props {
  totalSeconds?: number          // e.g. 300 for 5 minutes
  durationSeconds?: number       // alias prop
  onExpire: () => void
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="w-full py-3 bg-[#081505]/80 border border-[#316817]/40 rounded-xl text-center shadow-inner">
        <span className="font-serif text-3xl font-bold text-[#FAF7F2] tracking-wider leading-none">
          {pad(value)}
        </span>
      </div>
      <span className="font-sans text-[10px] uppercase tracking-widest text-[#E2BC7E]/80 mt-1.5 font-medium">
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer({ totalSeconds, durationSeconds, onExpire }: Props) {
  const initialSeconds = totalSeconds ?? durationSeconds ?? 300
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpire()
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0
  const pct      = Math.min(100, Math.max(0, Math.round(progress * 100)))

  const milestone =
    secondsLeft <= 0   ? { icon: "✓", text: "Hết thời gian giữ chỗ", color: "#C4714A", bg: "rgba(196,113,74,0.15)" }
    : secondsLeft <= 60  ? { icon: "🔥", text: "Còn dưới 1 phút!", color: "#CDA85A", bg: "rgba(205,168,90,0.15)" }
    : null

  const barColor = secondsLeft > 120 ? "#316817" : secondsLeft > 60 ? "#B8965A" : "#C4714A"

  return (
    <div className="w-full bg-gradient-to-br from-[#081505] via-[#122B09] to-[#081505] border border-[#316817]/40 rounded-2xl p-4 shadow-xl text-white">
      {/* Label */}
      <div className="text-center mb-3">
        <p className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-[#E2BC7E]/90">
          Thời gian giữ chỗ còn lại
        </p>
      </div>

      {/* Time Boxes */}
      <div className="flex items-center justify-center gap-2 mb-4 px-2">
        <TimeBox value={minutes} label="Phút" />
        <span className="font-serif text-xl text-[#E2BC7E] font-bold pb-4">:</span>
        <TimeBox value={seconds} label="Giây" />
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-sans text-white/60">
          <span className="uppercase tracking-wider">Tiến trình giữ chỗ</span>
          <span className="font-semibold text-white/90">{pct}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {milestone && (
        <div className="mt-3 py-1.5 px-3 rounded-lg flex items-center gap-2 text-xs font-sans" style={{ background: milestone.bg, color: milestone.color }}>
          <span>{milestone.icon}</span>
          <span className="font-medium">{milestone.text}</span>
        </div>
      )}
    </div>
  )
}
