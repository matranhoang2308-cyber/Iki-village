import { CalendarCheck, ArrowLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookingState, BookingRecord } from "@/App"

const VI_DAYS   = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]
const VI_MONTHS = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"]

const STATUS_LABEL: Record<BookingRecord["status"], string> = {
  PENDING:  "PENDING — Chờ xác duyệt",
  APPROVED: "APPROVED — Đã xác duyệt",
  REJECTED: "REJECTED — Đã từ chối",
}

interface Props {
  booking: BookingState
  /** Status of the record found for this customer. */
  status: BookingRecord["status"]
  /** Cancels the booking, releases its slots, and opens the calendar. */
  onReschedule: () => void
  onBack: () => void
}

export default function ExistingBooking({ booking, status, onReschedule, onBack }: Props) {
  const { customer, selectedDate, selectedStartTime, selectedEndTime, bookingId } = booking
  if (!customer || !selectedDate || !selectedStartTime || !selectedEndTime || !bookingId) return null

  const d         = new Date(selectedDate + "T00:00:00")
  const dateLabel = `${VI_DAYS[d.getDay()]}, ${d.getDate()} ${VI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  const n         = customer.apartments.length

  // An approved booking has been confirmed by staff — self-service changes to it
  // would silently invalidate that approval, so route the customer to hotline.
  const canReschedule = status === "PENDING"

  return (
    <div className="max-w-xl mx-auto py-8 pb-28 sm:pb-8">
      <div className="text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#316817] flex items-center justify-center text-white shadow-lg">
            <CalendarCheck size={30} />
          </div>
        </div>

        <Badge variant={status === "APPROVED" ? "success" : "pending"} className="mb-3 px-3 py-1 text-xs">
          {STATUS_LABEL[status]}
        </Badge>

        <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] mb-3 leading-snug py-1">
          Quý khách đã đặt lịch
        </h2>
        <p className="font-sans text-xs sm:text-base text-[#7A6E60] mb-6 leading-relaxed">
          Hệ thống ghi nhận quý khách đã có lịch bàn giao. Vui lòng kiểm tra thông tin bên dưới.
        </p>
      </div>

      <Card className="text-left mb-6 rounded-2xl border-[#E0D8CC] overflow-hidden shadow-sm">
        <div className="p-4 bg-gradient-to-r from-[#1D400E] to-[#316817] text-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-xs text-white/85 uppercase tracking-widest">Mã đặt lịch</p>
            <p className="font-sans text-xl font-bold truncate">{bookingId}</p>
          </div>
          <Badge variant="gold" className="flex-shrink-0">{status}</Badge>
        </div>
        <CardContent className="p-5 space-y-3">
          <div className="flex justify-between items-baseline gap-3 text-sm font-sans">
            <span className="text-[#7A6E60] flex-shrink-0">Khách hàng:</span>
            <span className="font-semibold text-[#2C2820] text-right">{customer.name}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-baseline gap-3 text-sm font-sans">
            <span className="text-[#7A6E60] flex-shrink-0">Ngày đặt lịch:</span>
            <span className="font-medium text-[#2C2820] text-right">{dateLabel}</span>
          </div>
          <div className="flex justify-between items-baseline gap-3 text-sm font-sans">
            <span className="text-[#7A6E60] flex-shrink-0">Khung giờ:</span>
            <span className="font-semibold text-[#316817] text-right">
              {selectedStartTime} – {selectedEndTime} ({n * 45} phút)
            </span>
          </div>
          <Separator />
          <div>
            <p className="font-sans text-xs uppercase text-[#6B5F51] mb-1.5 font-semibold">Căn hộ</p>
            <div className="flex flex-wrap gap-1.5">
              {customer.apartments.map((apt) => (
                <Badge key={apt.id} variant="default" className="text-xs">{apt.code}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!canReschedule && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E8D9A8] bg-[#FDF8E8] mb-4">
          <Info size={16} className="text-[#9A7B24] mt-0.5 flex-shrink-0" />
          <p className="font-sans text-[13px] text-[#6B5F51] leading-relaxed">
            Lịch hẹn đã được xác duyệt nên không thể tự đổi trực tuyến. Vui lòng gọi{" "}
            <a href="tel:19001234" className="text-[#B8965A] font-semibold">1900 1234</a> để được hỗ trợ.
          </p>
        </div>
      )}

      {/* Desktop actions */}
      <div className="hidden sm:block space-y-3">
        {canReschedule && (
          <Button variant="default" onClick={onReschedule}
            className="w-full h-12 rounded-xl bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md flex items-center justify-center gap-2">
            <CalendarCheck size={16} className="shrink-0" />
            <span>Đổi lịch</span>
          </Button>
        )}
        <Button variant="outline" onClick={onBack} className="w-full h-12 rounded-xl font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
          <ArrowLeft size={16} className="shrink-0" />
          <span>Tra cứu số khác</span>
        </Button>
        {canReschedule && (
          <p className="font-sans text-[13px] text-[#6B5F51] leading-relaxed text-center">
            Đổi lịch sẽ huỷ lịch hẹn <strong className="text-[#2C2820]">{bookingId}</strong> và trả lại khung giờ đã giữ.
          </p>
        )}
      </div>

      {/* Mobile: sticky action bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E0D8CC] bg-[#F5F0E8]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2.5">
        <Button variant="outline" onClick={onBack} aria-label="Tra cứu số khác"
          className="rounded-xl h-12 w-12 flex-shrink-0 p-0 flex items-center justify-center">
          <ArrowLeft size={18} />
        </Button>
        {canReschedule ? (
          <Button variant="default" onClick={onReschedule}
            className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md flex items-center justify-center gap-2">
            <CalendarCheck size={16} className="shrink-0" />
            <span>Đổi lịch</span>
          </Button>
        ) : (
          <Button variant="outline" asChild className="flex-1 rounded-xl h-12 font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
            <a href="tel:19001234">Gọi 1900 1234</a>
          </Button>
        )}
      </div>
    </div>
  )
}
