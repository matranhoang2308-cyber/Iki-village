import { useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import CustomerLookup from "@/components/CustomerLookup"
import ApartmentList from "@/components/ApartmentList"
import CalendarPicker from "@/components/CalendarPicker"
import BookingConfirmation from "@/components/BookingConfirmation"
import BookingSuccess from "@/components/BookingSuccess"
import ExistingBooking from "@/components/ExistingBooking"
import AdminBookingManagement from "@/components/AdminBookingManagement"
import {
  Customer, BookingDay, TimeSlot,
  generateCalendarDays, generateMonthDays,
} from "@/data/mockData"
import { cn } from "@/lib/utils"

export type AppStep = "lookup" | "existing" | "apartments" | "calendar" | "confirmation" | "success" | "admin"
export type SubmitStatus = "idle" | "checking" | "conflict" | "done"

export interface SlotRef {
  date: string
  slotIndex: number
}

export interface BookingRecord {
  id: string
  customer: Customer
  date: string
  /** Index of the chain's first slot — needed to release the slots on cancel. */
  startIdx: number
  startTime: string
  endTime: string
  chain: TimeSlot[]
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

export interface BookingState {
  customer: Customer | null
  selectedDate: string | null
  selectedStartIdx: number | null        // index into dayData.slots
  selectedStartTime: string | null
  selectedEndTime: string | null
  chain: TimeSlot[]                      // the N consecutive slots reserved
  bookingId: string | null
  submitStatus: SubmitStatus
  conflictMessage: string | null
}

const EMPTY_BOOKING: BookingState = {
  customer: null,
  selectedDate: null,
  selectedStartIdx: null,
  selectedStartTime: null,
  selectedEndTime: null,
  chain: [],
  bookingId: null,
  submitStatus: "idle",
  conflictMessage: null,
}

const STEPS: { key: AppStep; label: string }[] = [
  { key: "lookup",       label: "Tra cứu" },
  { key: "apartments",   label: "Căn hộ" },
  { key: "calendar",     label: "Lịch hẹn" },
  { key: "confirmation", label: "Xác nhận" },
  { key: "success",      label: "Hoàn tất" },
]

export default function App() {
  const [step, setStep]                 = useState<AppStep>("lookup")
  const [booking, setBooking]           = useState<BookingState>(EMPTY_BOOKING)
  const [calendarDays, setCalendarDays] = useState<BookingDay[]>(generateCalendarDays)
  
  // Storage of confirmed booking records for Admin management
  const [bookingRecords, setBookingRecords] = useState<BookingRecord[]>([])

  const currentIndex = STEPS.findIndex((s) => s.key === step)

  // ── Step handlers ──────────────────────────────────────────────────────────

  /** A customer's live booking is any record not yet rejected. */
  const findActiveRecord = (customer: Customer) =>
    bookingRecords.find((r) => r.customer.phone === customer.phone && r.status !== "REJECTED")

  const handleCustomerFound = (customer: Customer) => {
    const existing = findActiveRecord(customer)

    if (existing) {
      // Already booked — show that booking instead of starting a new one.
      setBooking({
        ...EMPTY_BOOKING,
        customer,
        selectedDate: existing.date,
        selectedStartIdx: existing.startIdx,
        selectedStartTime: existing.startTime,
        selectedEndTime: existing.endTime,
        chain: existing.chain,
        bookingId: existing.id,
      })
      setStep("existing")
      return
    }

    setBooking((b) => ({ ...b, customer }))
    setStep("apartments")
  }

  const handleProceedToCalendar = () => setStep("calendar")

  const handleTimeSelected = (
    date: string,
    startIdx: number,
    startTime: string,
    endTime: string,
    chain: TimeSlot[],
  ) => {
    setBooking((b) => ({
      ...b,
      selectedDate: date,
      selectedStartIdx: startIdx,
      selectedStartTime: startTime,
      selectedEndTime: endTime,
      chain,
      submitStatus: "idle",
      conflictMessage: null,
    }))
    setStep("confirmation")
  }

  /**
   * Concurrency-safe submit:
   * 1. Re-check all N slots still have available > 0
   * 2. If any slot is now full → conflict
   * 3. Otherwise decrement available on each slot atomically
   */
  const handleConfirm = useCallback(() => {
    const { customer, selectedDate, selectedStartIdx, chain, selectedStartTime, selectedEndTime } = booking
    if (!customer || !selectedDate || selectedStartIdx === null || chain.length === 0 || !selectedStartTime || !selectedEndTime) return

    setBooking((b) => ({ ...b, submitStatus: "checking" }))

    // Simulate async network latency (300 ms)
    setTimeout(() => {
      setCalendarDays((days) => {
        const dayIdx = days.findIndex((d) => d.date === selectedDate)
        if (dayIdx === -1) {
          setBooking((b) => ({
            ...b,
            submitStatus: "conflict",
            conflictMessage: "Không tìm thấy ngày đã chọn. Vui lòng thử lại.",
          }))
          return days
        }

        const day   = days[dayIdx]
        const n     = customer.apartments.length
        const slots = day.slots

        // ── Concurrency check: verify all N slots still available ──────────
        for (let i = selectedStartIdx; i < selectedStartIdx + n; i++) {
          if (!slots[i] || slots[i].available <= 0) {
            const conflictTime = slots[i]?.startTime ?? "?"
            setBooking((b) => ({
              ...b,
              submitStatus: "conflict",
              conflictMessage: `Khung ${conflictTime} vừa bị đặt hết. Vui lòng chọn lịch khác.`,
            }))
            return days  // no mutation
          }
        }

        // ── All clear: decrement 1 slot from each block in the chain ────────
        const newSlots = slots.map((s, i) =>
          i >= selectedStartIdx && i < selectedStartIdx + n
            ? { ...s, available: s.available - 1 }
            : s
        )

        const newDays = days.map((d, i) =>
          i === dayIdx ? { ...d, slots: newSlots } : d
        )

        const generatedId = `IKI-${Date.now().toString(36).toUpperCase()}`

        // Save booking record into admin storage
        const newRecord: BookingRecord = {
          id: generatedId,
          customer,
          date: selectedDate,
          startIdx: selectedStartIdx,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          chain,
          status: "PENDING",
          createdAt: new Date().toLocaleString("vi-VN"),
        }
        setBookingRecords((records) => [newRecord, ...records])

        // Mark booking done
        setBooking((b) => ({
          ...b,
          submitStatus: "done",
          bookingId: generatedId,
        }))

        return newDays
      })
    }, 350)
  }, [booking])

  // Called when the 5-minute hold expires → release the slots back
  const handleHoldExpired = useCallback(() => {
    const { selectedDate, selectedStartIdx, customer, chain } = booking
    if (!selectedDate || selectedStartIdx === null || !customer || chain.length === 0) return

    setCalendarDays((days) => {
      const dayIdx = days.findIndex((d) => d.date === selectedDate)
      if (dayIdx === -1) return days

      const n      = customer.apartments.length
      const newSlots = days[dayIdx].slots.map((s, i) =>
        i >= selectedStartIdx && i < selectedStartIdx + n
          ? { ...s, available: Math.min(3, s.available + 1) }
          : s
      )
      return days.map((d, i) => (i === dayIdx ? { ...d, slots: newSlots } : d))
    })
  }, [booking])

  // Merge newly requested month days into calendarDays (idempotent)
  const handleNeedDays = useCallback((year: number, month: number) => {
    setCalendarDays((days) => {
      const newDays = generateMonthDays(year, month)
      const existing = new Set(days.map((d) => d.date))
      const toAdd = newDays.filter((d) => !existing.has(d.date))
      if (toAdd.length === 0) return days
      return [...days, ...toAdd].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [])

  const handleReset = () => {
    setBooking(EMPTY_BOOKING)
    setStep("lookup")
  }

  /**
   * Reschedule: cancel the confirmed booking and send the customer back to the
   * calendar. The old record is dropped and its N slots returned, so the
   * customer never holds two bookings and no slot stays reserved for a booking
   * that no longer exists.
   */
  const handleReschedule = useCallback(() => {
    const { selectedDate, selectedStartIdx, customer, chain, bookingId } = booking
    if (!selectedDate || selectedStartIdx === null || !customer || chain.length === 0 || !bookingId) return

    const n = customer.apartments.length

    // Release the slots the cancelled booking was holding.
    setCalendarDays((days) => {
      const dayIdx = days.findIndex((d) => d.date === selectedDate)
      if (dayIdx === -1) return days
      const newSlots = days[dayIdx].slots.map((s, i) =>
        i >= selectedStartIdx && i < selectedStartIdx + n
          ? { ...s, available: Math.min(s.capacity, s.available + 1) }
          : s
      )
      return days.map((d, i) => (i === dayIdx ? { ...d, slots: newSlots } : d))
    })

    // Drop the old record so admin does not see a stale PENDING row.
    setBookingRecords((records) => records.filter((r) => r.id !== bookingId))

    // Keep the customer, clear the time selection, return to the calendar.
    setBooking((b) => ({
      ...EMPTY_BOOKING,
      customer: b.customer,
    }))
    setStep("calendar")
  }, [booking])

  // Admin status update handler
  const handleUpdateRecordStatus = (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setBookingRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: newStatus } : rec))
    )
  }

  const isFullBleed = step === "lookup"
  // "existing" and "admin" sit outside the 5-step booking flow, so the stepper
  // and progress bar do not apply to them.
  const showStepper = step !== "lookup" && step !== "admin" && step !== "existing"

  // Auto-advance to success when submit completes
  if (step === "confirmation" && booking.submitStatus === "done" && booking.bookingId) {
    setStep("success")
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F0E8" }}>
      {/* ── Header ── */}
      <header
        className="absolute top-0 left-0 right-0 z-50 border-b border-white/20"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3 sm:gap-4">
          <button onClick={handleReset} className="flex items-center gap-3 focus-visible:outline-none group text-left">
            <img
              src="/iki-logo.png"
              alt="IKI Village Logo"
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>

          {showStepper && (
            <nav className="hidden sm:flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center font-sans font-medium transition-all duration-300 text-[9px]",
                      i < currentIndex  ? "bg-[#316817] text-[#FAF7F2]"
                      : i === currentIndex ? "bg-[#275413] text-[#FAF7F2] ring-2 ring-[#AACF97]/50"
                                          : "border border-[#D0C8BC] text-[#A89C8E]"
                    )}>
                      {i < currentIndex ? "✓" : i + 1}
                    </div>
                    <span className={cn("font-sans text-[10px] tracking-wide hidden md:block",
                      i === currentIndex ? "text-[#2C2820] font-medium" : "text-[#A89C8E]")}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("mx-1.5 h-px w-5", i < currentIndex ? "bg-[#529838]" : "bg-[#E0D8CC]")} />
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile: compact step pill so progress is visible on phones too */}
            {showStepper && (
              <span className="sm:hidden font-sans text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#F0F7EC] text-[#316817] border border-[#AACF97] whitespace-nowrap">
                Bước {currentIndex + 1}/{STEPS.length}
              </span>
            )}
            <a
              href="tel:19001234"
              aria-label="Gọi hotline 1900 1234"
              className="font-sans text-xs font-semibold h-10 w-10 justify-center sm:h-auto sm:w-auto sm:justify-start px-0 sm:px-4 sm:py-2 rounded-xl border border-[#E2BC7E]/60 bg-[#1D400E] text-[#F0D9AC] hover:bg-[#316817] hover:text-white hover:border-[#E2BC7E] active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-md flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="hidden sm:inline">Hotline: 1900 1234</span>
            </a>
          </div>
        </div>

        {showStepper && (
          <div className="h-0.5 bg-[#F0EBE0]">
            <div className="h-full bg-gradient-to-r from-[#316817] to-[#529838] transition-all duration-500"
              style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }} />
          </div>
        )}
      </header>

      {/* ── Main ── */}
      {/* px-4 (16px) is the single source of the page gutter on mobile — child
          screens must not add their own, or it compounds to 32px. */}
      <main className={cn("flex-1 flex flex-col", isFullBleed ? "" : "max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-14 pt-20")}>
        {step === "lookup" && (
          <div className="flex-1 animate-[fadeIn_0.5s_ease]">
            <CustomerLookup onCustomerFound={handleCustomerFound} />
          </div>
        )}

        {step === "existing" && booking.customer && booking.bookingId && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <ExistingBooking
              booking={booking}
              status={bookingRecords.find((r) => r.id === booking.bookingId)?.status ?? "PENDING"}
              onReschedule={handleReschedule}
              onBack={handleReset}
            />
          </div>
        )}

        {step === "apartments" && booking.customer && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <ApartmentList
              customer={booking.customer}
              onProceed={handleProceedToCalendar}
              onBack={handleReset}
            />
          </div>
        )}

        {step === "calendar" && booking.customer && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <CalendarPicker
              customer={booking.customer}
              calendarDays={calendarDays}
              onTimeSelected={handleTimeSelected}
              onNeedDays={handleNeedDays}
              onBack={() => setStep("apartments")}
            />
          </div>
        )}

        {step === "confirmation" && booking.customer && booking.selectedDate && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <BookingConfirmation
              booking={booking}
              onConfirm={handleConfirm}
              onBack={() => {
                setBooking((b) => ({ ...b, submitStatus: "idle", conflictMessage: null }))
                setStep("calendar")
              }}
            />
          </div>
        )}

        {step === "success" && booking.customer && booking.bookingId && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <BookingSuccess
              booking={booking}
              onHoldExpired={handleHoldExpired}
              onNewBooking={handleReset}
              onReschedule={handleReschedule}
            />
          </div>
        )}

        {step === "admin" && (
          <div className="animate-[fadeIn_0.4s_ease]">
            <AdminBookingManagement
              records={bookingRecords}
              onUpdateStatus={handleUpdateRecordStatus}
              onBack={() => setStep("lookup")}
            />
          </div>
        )}
      </main>

      {step !== "lookup" && (
        <footer className="border-t border-[#E0D8CC] py-4 px-5 mt-8 hidden sm:block">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="font-sans text-[10px] text-[#B8B0A5] tracking-wide">© 2025 IKI Village. All rights reserved.</p>
            <Separator orientation="vertical" className="h-3 mx-3" />
            <p className="font-sans text-[10px] text-[#B8B0A5]">Hệ thống đặt lịch bàn giao căn hộ</p>
          </div>
        </footer>
      )}
    </div>
  )
}
