import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, AlertCircle, X } from "lucide-react"
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

  return (
    <div className="relative">
      {isInChain && chainIdx > 0 && (
        <div className="absolute left-[1.15rem] -top-2 w-0.5 h-2 z-10"
          style={{ background: isSelected ? "#CDA85A" : "#529838" }} />
      )}

      <div
        onClick={() => isValidStart && onClick()}
        // Hover-preview is a pointer affordance. On touch it sticks after a tap
        // and paints non-start slots as if they were selectable.
        onPointerEnter={(e) => { if (e.pointerType === "mouse") onHover() }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") onLeave() }}
        aria-disabled={!isValidStart}
        className={cn(
          "flex items-center justify-between px-3.5 py-3.5 sm:py-2.5 min-h-[52px] sm:min-h-0 rounded-xl border transition-all duration-150 text-xs font-sans",
          isSelected
            ? "bg-[#316817] border-[#316817] text-white shadow-md font-semibold cursor-pointer"
            : role === "in-chain"
              ? "bg-[#275413] border-[#275413] text-white cursor-pointer"
              : role === "hovered-chain"
                ? "bg-[#F0F7EC] border-[#AACF97] text-[#275413] cursor-pointer"
                : isValidStart
                  ? "bg-white border-[#E0D8CC] text-[#2C2820] hover:border-[#316817] hover:bg-[#F0F7EC] cursor-pointer"
                  // Not a legal start — disabled, whether it is full itself or
                  // merely part of a chain that is blocked elsewhere.
                  : "bg-[#FAF7F2] border-[#E8E0D4] text-[#C4BDBA] cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Clock size={14} className={isSelected || role === "in-chain" ? "text-[#E2BC7E]" : "text-[#316817]"} />
          <span className="font-serif text-sm font-medium">
            {slot.startTime} – {slot.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn("text-[10px] font-sans tabular-nums",
            isSelected || role === "in-chain" ? "text-white/70" : slot.available === 0 ? "text-[#C4BDBA]" : "text-[#9A8E80]")}>
            {slot.available}/{slot.capacity} trống
          </span>
          {isInChain
            ? <span className={cn("text-[10px] font-bold whitespace-nowrap",
                isSelected ? "text-[#E2BC7E]" : role === "in-chain" ? "text-[#E2BC7E]" : "text-[#316817]")}>
                Khung {chainIdx + 1}/{totalN}
              </span>
            : slot.available === 0
              ? <span className="text-[10px] font-sans text-[#C4BDBA] whitespace-nowrap">Hết slot</span>
              : !canStart
                ? <span className="text-[10px] font-sans text-[#9A8E80] whitespace-nowrap">Không đủ {totalN} khung</span>
                : null}
        </div>
      </div>
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

  useEffect(() => { onNeedDays?.(viewMonth.year, viewMonth.month) }, [viewMonth.year, viewMonth.month])

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
    setSheetOpen(true)   // no-op on desktop, where the sheet never renders
  }

  const handleSelectStart = (idx: number) => {
    // Guard the rule at the source, not just in the UI: only a legal chain
    // start can ever become the selection.
    if (!validSet.has(idx)) return
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
    <div className="max-w-5xl mx-auto py-6 pb-28 sm:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div className="space-y-2 sm:space-y-3">
          <p className="font-sans text-xs tracking-[0.18em] uppercase text-[#316817] font-semibold">Bước 3 — Lịch hẹn</p>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] leading-snug py-1">Chọn ngày &amp; giờ bàn giao</h2>
          <p className="font-sans text-sm sm:text-base text-[#7A6E60] leading-relaxed pt-1">
            Quý khách có <strong className="text-[#316817]">{n} căn</strong> — cần{" "}
            <strong className="text-[#316817]">{n} khung 45 phút liên tiếp</strong>.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hidden sm:inline-flex"><ArrowLeft size={14} />Quay lại</Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Month calendar */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-[#316817]" />
            <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60]">1. Chọn ngày</p>
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
                <p className="font-serif text-base font-semibold text-[#E2BC7E] leading-none">{VI_MONTH_NAMES[viewMonth.month]}</p>
                <p className="font-sans text-[10px] text-white/60 mt-0.5 tracking-wider">{viewMonth.year}</p>
              </div>
              <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-[#E2BC7E] hover:bg-white/10 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[#E0D8CC]">
              {DOW_HEADERS.map((h) => (
                <div key={h} className="py-2 text-center font-sans text-[10px] font-semibold tracking-wider uppercase text-[#9A8E80]">
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
                const hasSlots = !isPast && !isSun && chains > 0
                const isSelected = selectedDate === dateStr
                const isToday  = dateStr === toDateStr(todayRef)

                return (
                  <button key={dateStr} disabled={!hasSlots} onClick={() => hasSlots && handleSelectDate(dateStr)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2 border-r border-b border-[#F0EAE0] transition-all duration-150 min-h-[52px] sm:min-h-[48px]",
                      isSelected ? "bg-[#316817] text-white" : hasSlots ? "hover:bg-[#F0F7EC] cursor-pointer text-[#2C2820]" : "bg-[#FAF7F2] text-[#C4BDBA] cursor-not-allowed"
                    )}>
                    <span className={cn("font-serif text-base sm:text-sm leading-none font-medium", isSelected ? "text-[#E2BC7E]" : isToday ? "text-[#316817] font-bold" : "")}>{dayNum}</span>
                    {hasSlots && (
                      <>
                        {/* Mobile: a dot reads better than 9px text at this cell size */}
                        <span className={cn("sm:hidden w-1.5 h-1.5 rounded-full mt-1", isSelected ? "bg-[#E2BC7E]" : "bg-[#316817]")} />
                        <span className={cn("hidden sm:block text-[9px] font-sans mt-0.5", isSelected ? "text-[#E2BC7E]" : "text-[#316817] font-medium")}>{chains} suất</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Time slots: inline on desktop, bottom sheet on mobile ── */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#316817]" />
            <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60]">2. Chọn giờ bắt đầu</p>
          </div>

          {selectedDate && dayData ? (
            <div className="space-y-2">
              {validIndices.length === 0 && <NoChainNotice n={n} />}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {slotRows}
              </div>
            </div>
          ) : (
            <div className="h-64 border border-dashed border-[#E0D8CC] bg-[#FAF7F2] rounded-2xl flex items-center justify-center p-6 text-center">
              <p className="font-sans text-xs text-[#7A6E60]">Vui lòng chọn ngày có suất trống ở lịch bên trái</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: compact summary card replacing the long inline slot list ── */}
      <div className="lg:hidden mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-[#316817]" />
          <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-[#7A6E60]">2. Chọn giờ bắt đầu</p>
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
              <p className="font-serif text-lg font-semibold text-[#2C2820] leading-tight">
                {selectedChain[0].startTime} – {calculateEndTime(selectedChain[0].startTime, n)}
              </p>
              <p className="font-sans text-[11px] text-[#7A8E70] mt-0.5">{n} khung × 45 phút · Chạm để đổi giờ</p>
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
              <p className="font-sans text-[11px] text-[#7A6E60] mt-0.5">
                {validIndices.length} khung giờ còn trống
              </p>
            </div>
            <ChevronRight size={18} className="text-[#9A8E80] flex-shrink-0" />
          </button>
        )}
      </div>

      {selectedStartIdx !== null && selectedChain.length > 0 && (
        <div className="hidden lg:block mt-6 rounded-2xl border border-[#AACF97] bg-[#F0F7EC] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-[#316817]">
                Khung giờ đã chọn
              </p>
              <p className="font-serif text-xl font-medium text-[#2C2820] leading-snug">
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
                <div key={s.startTime} className="rounded-lg border border-[#AACF97] bg-white px-2.5 py-1.5 text-center">
                  <p className="font-sans text-[9px] uppercase tracking-wider text-[#9A8E80]">Khung {i + 1}</p>
                  <p className="font-serif text-xs font-medium text-[#2C2820] tabular-nums">{s.startTime}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Separator className="my-8 hidden lg:block" />

      {/* Desktop actions — unchanged */}
      <div className="hidden lg:flex gap-3">
        <Button variant="outline" className="rounded-xl" onClick={onBack}><ArrowLeft size={14} />Quay lại</Button>
        <Button variant="default" className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md"
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
            className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md">
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
                  <p className="font-serif text-lg font-semibold text-[#2C2820] leading-tight">Chọn giờ bắt đầu</p>
                  <p className="font-sans text-[11px] text-[#7A6E60] mt-0.5 truncate">
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
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {validIndices.length === 0 && <NoChainNotice n={n} />}
              {slotRows}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
