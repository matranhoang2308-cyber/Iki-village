import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Clock, CheckCircle2, AlertCircle, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Customer, BookingDay, TimeSlot,
  findValidStartIndices, getChain, calculateEndTime,
} from "@/data/mockData"

const VI_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const VI_MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"]
const DOW_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
const VI_DAYS_FULL = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]

function parseDate(s: string) {
  const d = new Date(s + "T00:00:00")
  return { day: d.getDate(), dow: VI_DAYS[d.getDay()], dowFull: VI_DAYS_FULL[d.getDay()], month: VI_MONTH_NAMES[d.getMonth()], year: d.getFullYear() }
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type SlotRole = "valid-start" | "in-chain" | "chain-start" | "full" | "normal" | "hovered-chain"

/** Why a slot cannot start a chain of n consecutive slots. */
type BlockedInfo = {
  /** "blocked" — a slot in the run is full; "too-late" — the day ends first. */
  reason: "too-late" | "blocked"
  /** The full slot that breaks the run. Only set when reason is "blocked". */
  blockedAt?: string
  /** Whether that full slot is the one the customer actually tapped. */
  blockedAtIsTapped?: boolean
}

function SlotRow({
  slot, role, chainIdx, totalN, canStart, onClick, onHover, onLeave,
}: {
  slot: TimeSlot; role: SlotRole; chainIdx: number; totalN: number
  /** True when this slot is a legal start for a full N-slot chain. */
  canStart: boolean
  onClick: () => void; onHover: () => void; onLeave: () => void
}) {
  const isSelected     = role === "chain-start"
  const isInChain      = role === "in-chain" || role === "chain-start" || role === "hovered-chain"
  // A slot is clickable only if it is itself a legal chain START. Being painted
  // as part of the selected/hovered chain does not make it a legal start.
  const isValidStart   = role === "valid-start" || isSelected || canStart
  // Only a slot with no seats of its own reads as "empty". A slot that still
  // has seats but cannot start a chain keeps normal contrast — greying it out
  // contradicts the "1/3 đã đặt" printed right next to it.
  const isSoldOut      = slot.available === 0

  return (
    <div className="relative">
      {isInChain && chainIdx > 0 && (
        <div className="absolute left-[1.15rem] -top-2 w-0.5 h-2 z-10"
          style={{ background: isSelected ? "#CDA85A" : "#529838" }} />
      )}

      <div
        // Always forwarded, including for disabled rows: the parent answers an
        // illegal pick with an explanation rather than silence.
        onClick={onClick}
        // Hover-preview is a pointer affordance. On touch it sticks after a tap
        // and paints non-start slots as if they were selectable.
        onPointerEnter={(e) => { if (e.pointerType === "mouse") onHover() }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") onLeave() }}
        aria-disabled={!isValidStart}
        className={cn(
          "flex items-center justify-between px-3.5 py-3.5 sm:py-2.5 min-h-[52px] sm:min-h-0 rounded-xl border transition-all duration-150 text-xs font-sans",
          // Colour says "part of your chain"; the cursor says whether this row
          // is a legal *start*. Those are two different facts and previously
          // shared one style, which is why a mid-chain slot looked clickable.
          isSelected || role === "in-chain" || role === "hovered-chain"
            ? "bg-[#F0F7EC] border-[#AACF97] text-[#275413] font-semibold shadow-sm"
            : isValidStart
              ? "bg-white border-[#E0D8CC] text-[#2C2820] hover:border-[#316817] hover:bg-[#F0F7EC]"
              : isSoldOut
                // The only greyed-out state: no seats left at all.
                ? "bg-[#FAF7F2] border-[#E8E0D4] text-[#8A7F72]"
                // Has seats — looks like any other row. It cannot start a chain
                // from here, but that is explained on tap rather than by a
                // badge the customer has to decode.
                : "bg-white border-[#E0D8CC] text-[#2C2820]",
          isValidStart ? "cursor-pointer" : "cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Clock size={14} className="text-[#316817]" />
          <span className="font-sans text-sm font-medium leading-normal">
            {slot.startTime} – {slot.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Counts seats TAKEN, not seats free. A full slot reads "3/3 hết
              chỗ" as one phrase rather than "3/3 đã đặt" plus a separate
              "Hết chỗ" badge saying the same thing twice. */}
          <span className={cn("text-sm font-sans tabular-nums font-medium whitespace-nowrap",
            isSoldOut ? "text-[#A3512B]" : "text-[#275413]")}>
            {slot.capacity - slot.available}/{slot.capacity} {isSoldOut ? "hết chỗ" : "đã đặt"}
          </span>
          {isInChain && (
            <span className="text-sm font-bold whitespace-nowrap text-[#316817]">
              Khung {chainIdx + 1}/{totalN}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const INTERIOR_IMGS = [
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1611094016919-36b65678f3d6?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1758448755778-90ebf4d0f1e7?w=400&h=300&fit=crop&auto=format",
]

/**
 * Context strip replacing the old "Căn hộ" step. Deliberately quiet: neutral
 * surface, thin border, one accent (the apartment count) — it must not compete
 * with the date/time pickers, which are the actual task on this screen. Full
 * per-apartment detail hides behind a disclosure, collapsed by default.
 */
function BookingSummaryBar({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false)
  const n = customer.apartments.length

  /* Only the mobile modal locks the page. The desktop accordion expands in
     flow, so freezing scroll there would strand anyone mid-page. `sm` is
     640px, matching the Tailwind breakpoint the markup below switches on. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)

    const mql = window.matchMedia("(max-width: 639px)")
    const isMobile = mql.matches
    const prev = document.body.style.overflow
    if (isMobile) document.body.style.overflow = "hidden"

    // Crossing the breakpoint swaps modal for accordion mid-flight; closing
    // keeps the scroll lock from outliving the modal that installed it.
    const onBreakpoint = () => setOpen(false)
    mql.addEventListener("change", onBreakpoint)

    return () => {
      if (isMobile) document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      mql.removeEventListener("change", onBreakpoint)
    }
  }, [open])

  // Same rows on both surfaces: inline under the bar on desktop, inside a
  // modal on mobile where an accordion would push the calendar off-screen.
  const apartmentRows = customer.apartments.map((apt, idx) => (
    <div key={apt.id} className="flex items-center gap-3 rounded-lg border border-[#E8E0D4] bg-[#FAF7F2] p-2.5">
      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-[#F0F7EC]">
        <img src={INTERIOR_IMGS[idx % INTERIOR_IMGS.length]} alt={`Căn ${apt.code}`} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-semibold text-[#2C2820] truncate">{apt.code}</p>
        <p className="font-sans text-xs text-[#7A6E60]">
          {apt.tower} · T{apt.floor} · {apt.area} m²
        </p>
      </div>
      <span className="font-sans text-xs text-[#4A4035] bg-white border border-[#E0D8CC] rounded-md px-2 py-0.5 shrink-0">
        {apt.type}
      </span>
    </div>
  ))

  return (
    <div className="mb-6 rounded-xl border border-[#E0D8CC] bg-white">
      {/* Desktop: one row. Mobile: customer line, then count + chips, then link. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <User size={16} className="text-[#9A8E80] shrink-0" />
          <div className="min-w-0">
            <p className="font-sans text-sm font-semibold text-[#2C2820] truncate">{customer.name}</p>
            {/* Phone and email on one line, separated by a middle dot. Kept as
                a single text node so the dot sits in the normal word flow
                rather than being spaced apart by flex gaps. */}
            <p className="font-sans text-xs text-[#7A6E60] truncate">
              {customer.phone} · {customer.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:justify-end">
          <span className="font-sans text-sm text-[#4A4035] whitespace-nowrap">
            <strong className="text-[#316817] font-semibold">{n}</strong> căn
          </span>
          <span className="hidden sm:inline text-[#D0C8BC]">·</span>
          {customer.apartments.map((apt) => (
            <span
              key={apt.id}
              className="font-sans text-xs text-[#4A4035] bg-[#FAF7F2] border border-[#E0D8CC] rounded-md px-2 py-0.5 whitespace-nowrap"
            >
              {apt.code}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="font-sans text-xs text-[#7A6E60]">
          Cần {n} khung 45 phút liên tiếp
        </p>
        {/* One control, two behaviours — so the affordance differs too: a
            rotating chevron reads as "expands in place" on desktop, while the
            mobile label stays "Xem chi tiết" because the modal has its own
            close button rather than collapsing from here. */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-sans text-xs text-[#7A6E60] underline underline-offset-2 hover:text-[#316817] bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
        >
          <span className="hidden sm:inline">{open ? "Ẩn chi tiết căn hộ" : "Xem chi tiết căn hộ"}</span>
          <span className="sm:hidden">Xem chi tiết căn hộ</span>
          <ChevronDown size={13} className={cn("hidden sm:block transition-transform duration-200", open && "rotate-180")} />
          <ChevronRight size={13} className="sm:hidden" />
        </button>
      </div>

      {/* Desktop: expands in place — there is room to spare beside the calendar. */}
      {open && (
        <div className="hidden sm:block border-t border-[#E8E0D4] px-4 py-3 space-y-2.5">
          {apartmentRows}
        </div>
      )}

      {/* Mobile: a modal instead, so the calendar underneath keeps its place
          rather than being pushed down by the expanded list. */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-[60] flex items-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apt-detail-title"
        >
          <div className="sheet-overlay absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div className="sheet-panel relative w-full max-h-[80vh] flex flex-col rounded-t-3xl bg-[#FAF7F2] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
            <div className="flex-shrink-0 pt-2.5 pb-3 px-4 border-b border-[#E0D8CC]">
              <div className="w-10 h-1 rounded-full bg-[#D0C8BC] mx-auto mb-3" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id="apt-detail-title" className="font-sans text-lg font-semibold text-[#2C2820] leading-tight">
                    Chi tiết căn hộ
                  </p>
                  <p className="font-sans text-[13px] text-[#6B5F51] mt-0.5">{n} căn hộ</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="w-9 h-9 -mt-1 flex items-center justify-center rounded-full text-[#7A6E60] active:bg-[#E8E0D4] flex-shrink-0 bg-transparent border-none cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Generous bottom padding: the last apartment row was ending flush
                against the sheet edge, which reads as clipped content. */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 space-y-2.5 pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
              {apartmentRows}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoChainNotice({ n }: { n: number }) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8D9A8] bg-[#FDF8E8]">
      <AlertCircle size={14} className="text-[#9A7B24] mt-0.5 shrink-0" />
      <p className="font-sans text-xs text-[#7A6E60] leading-relaxed">
        Ngày này không còn <strong className="text-[#2C2820]">{n} khung liên tiếp</strong> nào còn trống.
        Quý khách vui lòng chọn ngày khác.
      </p>
    </div>
  )
}

interface Props {
  customer: Customer
  calendarDays: BookingDay[]
  onTimeSelected: (date: string, startIdx: number, startTime: string, endTime: string, chain: TimeSlot[]) => void
  onNeedDays?: (year: number, month: number) => void
  onBack: () => void
}

export default function CalendarPicker({ customer, calendarDays, onTimeSelected, onNeedDays, onBack }: Props) {
  const n = customer.apartments.length
  const todayRef = new Date()
  todayRef.setHours(0, 0, 0, 0)
  const [viewMonth, setViewMonth] = useState({ year: todayRef.getFullYear(), month: todayRef.getMonth() })
  const [selectedDate, setSelectedDate]     = useState<string | null>(null)
  const [selectedStartIdx, setSelectedStartIdx] = useState<number | null>(null)
  const [hoveredStartIdx, setHoveredStartIdx]   = useState<number | null>(null)
  // Mobile only: the slot list lives in a bottom sheet so the page stays short.
  const [sheetOpen, setSheetOpen] = useState(false)
  // Set when the customer taps a slot that cannot start an n-slot chain.
  const [blockedInfo, setBlockedInfo] = useState<BlockedInfo | null>(null)

  useEffect(() => { onNeedDays?.(viewMonth.year, viewMonth.month) }, [viewMonth.year, viewMonth.month])

  // Esc closes the blocked-slot dialog. Registered ahead of the sheet's own
  // handler so Esc dismisses the topmost layer first.
  useEffect(() => {
    if (!blockedInfo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); setBlockedInfo(null) }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [blockedInfo])

  // While the sheet is up, freeze the page behind it and let Esc / Android back close it.
  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [sheetOpen])

  const firstOfMonth = new Date(viewMonth.year, viewMonth.month, 1)
  const daysInMonth  = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
  const startOffset  = (firstOfMonth.getDay() + 6) % 7
  const dayMap       = new Map(calendarDays.map((d) => [d.date, d]))

  function validChainsForDay(day: BookingDay) {
    return findValidStartIndices(day.slots, n).length
  }

  const isPrevMonthDisabled = viewMonth.year === todayRef.getFullYear() && viewMonth.month === todayRef.getMonth()

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return
    setViewMonth((v) => {
      const m = v.month - 1
      return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m }
    })
    setSelectedDate(null)
    setSelectedStartIdx(null)
  }

  const handleNextMonth = () => {
    setViewMonth((v) => {
      const m = v.month + 1
      return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m }
    })
    setSelectedDate(null)
    setSelectedStartIdx(null)
  }

  const dayData      = calendarDays.find((d) => d.date === selectedDate)
  const validIndices = dayData ? findValidStartIndices(dayData.slots, n) : []
  const validSet     = new Set(validIndices)

  function getRoleWithSelected(slotIdx: number): SlotRole {
    if (selectedStartIdx !== null) {
      const chainSet = new Set(Array.from({ length: n }, (_, i) => selectedStartIdx + i))
      if (chainSet.has(slotIdx)) return slotIdx === selectedStartIdx ? "chain-start" : "in-chain"
    }
    if (hoveredStartIdx !== null) {
      const hoverSet = new Set(Array.from({ length: n }, (_, i) => hoveredStartIdx + i))
      if (hoverSet.has(slotIdx)) return "hovered-chain"
    }
    if (validSet.has(slotIdx)) return "valid-start"
    if (dayData!.slots[slotIdx].available === 0) return "full"
    return "normal"
  }

  function getChainIdx(slotIdx: number): number {
    if (selectedStartIdx !== null && slotIdx >= selectedStartIdx && slotIdx < selectedStartIdx + n)
      return slotIdx - selectedStartIdx
    if (hoveredStartIdx !== null && slotIdx >= hoveredStartIdx && slotIdx < hoveredStartIdx + n)
      return slotIdx - hoveredStartIdx
    return 0
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedStartIdx(null)
    setHoveredStartIdx(null)
    setBlockedInfo(null)  // a message about the old day must not outlive it
    setSheetOpen(true)   // no-op on desktop, where the sheet never renders
  }

  /**
   * Why `idx` cannot start a chain of n slots. Returns null when it can.
   * The customer needs n back-to-back slots (one per apartment), so a start
   * fails either because the run reaches the end of the day or because some
   * slot inside it is full — and naming that slot is the whole point of the
   * message.
   */
  function explainInvalidStart(idx: number): BlockedInfo | null {
    if (!dayData || validSet.has(idx)) return null
    if (idx + n > dayData.slots.length) return { reason: "too-late" }
    const blocker = dayData.slots.slice(idx, idx + n).find((s) => s.available === 0)
    return blocker
      ? {
          reason: "blocked",
          blockedAt: blocker.startTime,
          // True when the customer tapped the full slot itself, rather than a
          // slot upstream of it. Drives which wording the dialog uses.
          blockedAtIsTapped: blocker.startTime === dayData.slots[idx].startTime,
        }
      : { reason: "too-late" }
  }

  const handleSelectStart = (idx: number) => {
    // Guard the rule at the source, not just in the UI: only a legal chain
    // start can ever become the selection.
    if (!validSet.has(idx)) {
      // Explain the refusal instead of swallowing the tap. Silently ignoring
      // it reads as a broken button.
      setBlockedInfo(explainInvalidStart(idx))
      return
    }
    setSelectedStartIdx(idx)
    setHoveredStartIdx(null)
    setSheetOpen(false)  // picking a time closes the sheet and returns to the calendar
  }

  const selectedChain = (selectedStartIdx !== null && dayData) ? getChain(dayData.slots, selectedStartIdx, n) : []

  // Built once, rendered either inline (desktop) or inside the sheet (mobile).
  const slotRows = dayData?.slots.map((slot, idx) => (
    <SlotRow key={slot.startTime} slot={slot} role={getRoleWithSelected(idx)} chainIdx={getChainIdx(idx)} totalN={n}
      canStart={validSet.has(idx)}
      onClick={() => handleSelectStart(idx)}
      onHover={() => { if (validSet.has(idx)) setHoveredStartIdx(idx) }}
      onLeave={() => setHoveredStartIdx(null)} />
  ))

  const handleConfirm = () => {
    if (!selectedDate || selectedStartIdx === null || !dayData) return
    const start = dayData.slots[selectedStartIdx].startTime
    const chain = getChain(dayData.slots, selectedStartIdx, n)
    onTimeSelected(selectedDate, selectedStartIdx, start, calculateEndTime(start, n), chain)
  }

  return (
    <div className="max-w-6xl mx-auto py-6 pb-28 sm:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-5 gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="font-sans text-xs tracking-[0.18em] uppercase text-[#316817] font-semibold leading-none">Bước 2 — Lịch hẹn</p>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] leading-snug">Chọn ngày &amp; giờ</h2>
        </div>
      </div>

      {/* Customer + apartment context, absorbed from the removed "Căn hộ" step.
          Carries the slot-count sentence that used to sit under the heading. */}
      <BookingSummaryBar customer={customer} />

      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Month calendar */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-[#316817]" />
            <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60] leading-none">1. Chọn ngày</p>
          </div>

          <div className="border border-[#E0D8CC] bg-[#FAF7F2] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0D8CC]"
              style={{ background: "linear-gradient(135deg,#1D400E 0%,#275413 100%)" }}>
              <button onClick={handlePrevMonth} disabled={isPrevMonthDisabled}
                className={cn("w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                  isPrevMonthDisabled ? "text-white/20 cursor-not-allowed" : "text-white/70 hover:text-[#E2BC7E] hover:bg-white/10")}>
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-sans text-base font-semibold text-[#E2BC7E] leading-none">{VI_MONTH_NAMES[viewMonth.month]}</p>
                <p className="font-sans text-[15px] text-white/70 mt-[5px] tracking-wider">{viewMonth.year}</p>
              </div>
              <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-[#E2BC7E] hover:bg-white/10 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[#E0D8CC]">
              {DOW_HEADERS.map((h) => (
                <div key={h} className="py-2 text-center font-sans text-xs font-semibold tracking-wider uppercase text-[#6B5F51]">
                  {h}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border-r border-b border-[#F0EAE0]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum  = i + 1
                const cellDate = new Date(viewMonth.year, viewMonth.month, dayNum)
                const dateStr  = toDateStr(cellDate)
                const isPast   = cellDate <= todayRef
                const isSun    = cellDate.getDay() === 0
                const dayData  = dayMap.get(dateStr)
                const chains   = dayData ? validChainsForDay(dayData) : 0
                const totalChains = dayData ? (dayData.slots.length - n + 1) : 12
                const hasSlots = !isPast && !isSun && chains > 0
                const isSelected = selectedDate === dateStr
                const isToday  = dateStr === toDateStr(todayRef)

                return (
                  <button key={dateStr} disabled={!hasSlots} onClick={() => hasSlots && handleSelectDate(dateStr)}
                    className={cn(
                      // Desktop cells grew to fit a legible 12px "N suất"
                      // under the date without cramping.
                      "relative flex flex-col items-center justify-center py-2 border-r border-b border-[#F0EAE0] transition-all duration-150 min-h-[52px] sm:min-h-[56px]",
                      isSelected ? "bg-[#316817] text-white" : hasSlots ? "hover:bg-[#F0F7EC] cursor-pointer text-[#2C2820]" : "bg-[#FAF7F2] text-[#8A7F72] cursor-not-allowed"
                    )}>
                    <span className={cn("font-sans text-base sm:text-sm leading-none font-medium", isSelected ? "text-[#E2BC7E]" : isToday ? "text-[#316817] font-bold" : "")}>{dayNum}</span>
                    {hasSlots && (
                      <>
                        {/* Mobile: a dot reads better than 9px text at this cell size */}
                        <span className={cn("sm:hidden w-1.5 h-1.5 rounded-full mt-1", isSelected ? "bg-[#E2BC7E]" : "bg-[#316817]")} />
                        <span className={cn("hidden sm:block text-[11px] font-sans mt-1 font-medium whitespace-nowrap", isSelected ? "text-[#E2BC7E]" : "text-[#275413]")}>Còn {chains}/{totalChains} suất</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Time slots: inline on desktop, bottom sheet on mobile ── */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#316817]" />
            <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60] leading-none">2. Chọn giờ bắt đầu</p>
          </div>

          {selectedDate && dayData ? (
            <div className="space-y-2">
              {validIndices.length === 0 && <NoChainNotice n={n} />}
              {/* pr-2.5 keeps the rows clear of the 8px bar instead of letting
                  it overlap their right edge. */}
              <div className="slot-scroll space-y-1.5 max-h-[470px] overflow-y-auto pr-2.5">
                {slotRows}
              </div>
            </div>
          ) : (
            <div className="h-[470px] border border-dashed border-[#E0D8CC] bg-[#FAF7F2] rounded-2xl flex items-center justify-center p-6 text-center">
              <p className="font-sans text-xs text-[#7A6E60]">Vui lòng chọn ngày có suất trống ở lịch bên trái</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: compact summary card replacing the long inline slot list ── */}
      <div className="lg:hidden mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-[#316817]" />
          <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60] leading-none">2. Chọn giờ bắt đầu</p>
        </div>

        {!selectedDate || !dayData ? (
          <div className="border border-dashed border-[#E0D8CC] bg-[#FAF7F2] rounded-2xl flex items-center justify-center px-5 py-7 text-center">
            <p className="font-sans text-xs text-[#7A6E60]">Chọn một ngày còn suất ở lịch phía trên</p>
          </div>
        ) : validIndices.length === 0 ? (
          <NoChainNotice n={n} />
        ) : selectedStartIdx !== null && selectedChain.length > 0 ? (
          <button onClick={() => setSheetOpen(true)}
            className="w-full text-left rounded-2xl border border-[#AACF97] bg-[#F0F7EC] px-4 py-3.5 flex items-center gap-3 active:bg-[#E4F0DC] transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#316817] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-lg font-semibold text-[#2C2820] leading-tight">
                {selectedChain[0].startTime} – {calculateEndTime(selectedChain[0].startTime, n)}
              </p>
              <p className="font-sans text-[13px] text-[#5A7A50] mt-0.5">{n} khung × 45 phút · Chạm để đổi giờ</p>
            </div>
            <ChevronRight size={18} className="text-[#316817] flex-shrink-0" />
          </button>
        ) : (
          <button onClick={() => setSheetOpen(true)}
            className="w-full text-left rounded-2xl border border-[#E0D8CC] bg-white px-4 py-3.5 flex items-center gap-3 active:bg-[#F0F7EC] transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#F0F7EC] border border-[#AACF97] flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-[#316817]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-[#2C2820]">Chọn giờ bắt đầu</p>
              <p className="font-sans text-[13px] text-[#6B5F51] mt-0.5">
                {validIndices.length} khung giờ còn trống
              </p>
            </div>
            <ChevronRight size={18} className="text-[#9A8E80] flex-shrink-0" />
          </button>
        )}
      </div>

      {selectedStartIdx !== null && selectedChain.length > 0 && (
        <div className="hidden lg:block mt-6 rounded-2xl border border-[#E0D8CC] bg-[#FAF7F2] px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-[#316817]">
                Khung giờ đã chọn
              </p>
              <p className="font-sans text-xl font-semibold text-[#2C2820] leading-snug">
                {selectedChain[0].startTime} – {calculateEndTime(selectedChain[0].startTime, n)}
              </p>
              <p className="font-sans text-xs text-[#7A6E60]">
                {parseDate(selectedDate!).dowFull}, {parseDate(selectedDate!).day} {parseDate(selectedDate!).month} {parseDate(selectedDate!).year}
                {" · "}
                <strong className="text-[#316817]">{n} khung × 45 phút</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedChain.map((s, i) => (
                <div
                  key={s.startTime}
                  className="rounded-xl px-3 py-1.5 text-center transition-all duration-150 border bg-[#316817] border-[#316817] text-white shadow-sm"
                >
                  <p className="font-sans text-[11px] uppercase tracking-wider font-bold text-[#E2BC7E]">
                    Khung {i + 1}
                  </p>
                  <p className="font-sans text-sm tabular-nums font-semibold text-white">
                    {s.startTime} – {s.endTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Separator className="my-8 hidden lg:block" />

      {/* Desktop actions — unchanged */}
      <div className="hidden lg:flex gap-3">
        <Button variant="outline" className="rounded-xl h-12 px-6" onClick={onBack}><ArrowLeft size={14} />Quay lại</Button>
        <Button variant="default" className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md"
          onClick={handleConfirm} disabled={selectedStartIdx === null || !selectedDate}>
          Xác nhận <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Mobile: sticky action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E0D8CC] bg-[#F5F0E8]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onBack} aria-label="Quay lại" className="rounded-xl h-12 w-12 flex-shrink-0 p-0">
            <ArrowLeft size={18} />
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={selectedStartIdx === null || !selectedDate}
            className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md">
            {selectedStartIdx === null ? "Chọn giờ bắt đầu" : "Xác nhận"}
            {selectedStartIdx !== null && <ArrowRight size={16} className="ml-1" />}
          </Button>
        </div>
      </div>

      {/* ── Mobile bottom sheet: the slot list, without the long scroll ── */}
      {sheetOpen && dayData && selectedDate && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Chọn giờ bắt đầu">
          <div className="sheet-overlay absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />

          <div className="sheet-panel absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-[#FAF7F2] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
            {/* Grabber + header */}
            <div className="flex-shrink-0 pt-2.5 pb-3 px-4 border-b border-[#E0D8CC]">
              <div className="w-10 h-1 rounded-full bg-[#D0C8BC] mx-auto mb-3" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans text-lg font-semibold text-[#2C2820] leading-tight">Chọn giờ bắt đầu</p>
                  <p className="font-sans text-[13px] text-[#6B5F51] mt-0.5 truncate">
                    {parseDate(selectedDate).dowFull}, {parseDate(selectedDate).day} {parseDate(selectedDate).month} · cần {n} khung liên tiếp
                  </p>
                </div>
                <button onClick={() => setSheetOpen(false)} aria-label="Đóng"
                  className="w-9 h-9 -mt-1 flex items-center justify-center rounded-full text-[#7A6E60] active:bg-[#E8E0D4] flex-shrink-0">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Slot list — the only scrolling region */}
            <div className="slot-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {validIndices.length === 0 && <NoChainNotice n={n} />}
              {slotRows}
            </div>
          </div>
        </div>
      )}

      {/* ── Why that slot cannot be picked ──
          Sits above the mobile sheet (z-60 vs z-50) so it is reachable from
          either surface. */}
      {blockedInfo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="blocked-title"
        >
          <div className="sheet-overlay absolute inset-0 bg-black/50" onClick={() => setBlockedInfo(null)} />

          <div className="relative w-full max-w-sm rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDF5F5] border border-[#C4714A]/40 flex items-center justify-center mx-auto mb-3.5">
              <AlertCircle size={22} className="text-[#C4714A]" />
            </div>

            <p id="blocked-title" className="font-sans text-base font-bold text-[#2C2820] mb-2">
              {/* "Khung thời gian này" only when the tapped slot is itself the
                  one that is full. When the blocker sits further along the
                  chain, that phrase would contradict the seat count the
                  customer just read, so name the real slot instead. */}
              {blockedInfo.reason !== "blocked"
                ? <>Không đủ {n} khung giờ liên tiếp.</>
                : blockedInfo.blockedAtIsTapped
                  ? <>Khung thời gian này đã hết chỗ.</>
                  : <>Khung <span className="text-[#A3512B]">{blockedInfo.blockedAt}</span> đã hết chỗ.</>}
            </p>

            <p className="font-sans text-sm text-[#6B5F51] leading-relaxed mb-4">
              Do có {n} căn hộ, vui lòng chọn {n} khung giờ liên tiếp
            </p>

            <Button
              variant="default"
              onClick={() => setBlockedInfo(null)}
              className="w-full h-11 rounded-xl bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider"
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
