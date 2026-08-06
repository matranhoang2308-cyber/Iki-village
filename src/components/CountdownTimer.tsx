import { useEffect, useState, useRef } from "react"
import { Check } from "lucide-react"

interface Props {
  totalSeconds?: number          // e.g. 300 for 5 minutes
  durationSeconds?: number       // alias prop
  onExpire: () => void
  /* Strips the dark card, heading and progress bar, leaving only the digit
     tiles. Used on mobile, where the timer sits bare above the details. */
  bare?: boolean
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/* Flip tile, ported from the Framer Countdown component. The digit is keyed on
   its own value so a change remounts the node and replays the drop-in
   animation — the same trick Framer's AnimatePresence does, without pulling in
   framer-motion. */
function FlipUnit({ value, label, bare }: { value: number; label: string; bare?: boolean }) {
  const text = pad(value)
  return (
    <div className="flex flex-col items-center mx-1 sm:mx-1.5">
      <div
        className={
          bare
            ? "relative w-14 h-14 bg-[#316817] rounded-lg overflow-hidden shadow-sm"
            : "relative w-14 h-14 sm:w-16 sm:h-16 bg-[#081505] rounded-lg overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
        }
      >
        <span
          key={text}
          className="flip-digit absolute inset-0 flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold text-[#FAF7F2] leading-none [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
        >
          {text}
        </span>
      </div>
      <span
        className={
          bare
            ? "mt-1.5 font-sans text-xs font-medium uppercase tracking-widest text-[#6B5F51] leading-none"
            : "mt-2 font-sans text-xs font-medium uppercase tracking-widest text-[#E2BC7E] leading-none"
        }
      >
        {label}
      </span>
    </div>
  )
}

function Separator({ bare }: { bare?: boolean }) {
  return (
    <span
      className={
        bare
          ? "font-serif text-xl font-bold text-[#316817] mx-0.5 pb-5"
          : "font-serif text-xl sm:text-2xl font-bold text-[#E2BC7E] mx-0.5 pb-6"
      }
    >
      :
    </span>
  )
}

export default function CountdownTimer({ totalSeconds, durationSeconds, onExpire, bare }: Props) {
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

  const days    = Math.floor(secondsLeft / 86400)
  const hours   = Math.floor((secondsLeft % 86400) / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  /* A 5-minute hold would otherwise render two permanent "00" tiles. Show the
     larger units only once the duration actually reaches them. */
  const showDays  = initialSeconds >= 86400
  const showHours = initialSeconds >= 3600

  const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0
  const pct      = Math.min(100, Math.max(0, Math.round(progress * 100)))

  /* The expiry marker is an SVG: no bundled font carries U+2713, so a literal
     "✓" fell back to a system face and sat off the text baseline. The emoji is
     fine as-is — it always renders from the system emoji font. */
  const milestone =
    secondsLeft <= 0   ? { icon: <Check size={14} strokeWidth={3} className="shrink-0" />, text: "Hết thời gian giữ chỗ", color: "#C4714A", bg: "rgba(196,113,74,0.15)" }
    : secondsLeft <= 60  ? { icon: <span aria-hidden="true">🔥</span>, text: "Còn dưới 1 phút!", color: "#CDA85A", bg: "rgba(205,168,90,0.15)" }
    : null

  const barColor = secondsLeft > 120 ? "#316817" : secondsLeft > 60 ? "#B8965A" : "#C4714A"

  const units = (
    <>
      {showDays && (
        <>
          <FlipUnit value={days} label="Ngày" bare={bare} />
          <Separator bare={bare} />
        </>
      )}
      {showHours && (
        <>
          <FlipUnit value={hours} label="Giờ" bare={bare} />
          <Separator bare={bare} />
        </>
      )}
      <FlipUnit value={minutes} label="Phút" bare={bare} />
      <Separator bare={bare} />
      <FlipUnit value={seconds} label="Giây" bare={bare} />
    </>
  )

  /* Bare: digits only. No card, no heading, no progress bar — the caller
     supplies the surrounding context. */
  if (bare) {
    return (
      <div>
        <div className="flex items-center justify-center">{units}</div>
        {milestone && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-sans font-medium" style={{ color: milestone.color }}>
            {milestone.icon}
            <span>{milestone.text}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-[#081505] via-[#122B09] to-[#081505] border border-[#316817]/40 rounded-2xl p-4 shadow-xl text-white">
      {/* Label */}
      <div className="text-center mb-3">
        <p className="font-sans text-xs font-semibold tracking-[0.18em] uppercase text-[#E2BC7E]">
          Thời gian giữ chỗ còn lại
        </p>
      </div>

      {/* Flip units */}
      <div className="flex items-center justify-center mb-4">{units}</div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-sans text-white/80">
          <span className="uppercase tracking-wider">Tiến trình giữ chỗ</span>
          <span className="font-semibold text-white">{pct}%</span>
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
          {milestone.icon}
          <span className="font-medium">{milestone.text}</span>
        </div>
      )}
    </div>
  )
}
