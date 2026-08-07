import { CheckCircle2, CalendarCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookingState } from "@/App"

const VI_DAYS   = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]
const VI_MONTHS = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"]

interface Props {
  booking: BookingState
  onHoldExpired?: () => void
  onNewBooking: () => void
  /** Cancels this booking, releases its slots, and returns to the calendar. */
  onReschedule: () => void
}

export default function BookingSuccess({ booking, onNewBooking, onReschedule }: Props) {
  const { customer, selectedDate, selectedStartTime, selectedEndTime, chain, bookingId } = booking
  if (!customer || !selectedDate || !selectedStartTime || !selectedEndTime || !bookingId) return null

  const d         = new Date(selectedDate + "T00:00:00")
  const dateLabel = `${VI_DAYS[d.getDay()]}, ${d.getDate()} ${VI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  const n         = customer.apartments.length

  return (
    <div className="max-w-xl mx-auto py-8 text-center">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-[#316817] flex items-center justify-center text-white shadow-lg">
          <CheckCircle2 size={32} />
        </div>
      </div>

      <Badge variant="success" className="mb-3 px-3 py-1 text-xs">Đã xác nhận</Badge>

      <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] mb-3 leading-snug py-1">Đặt lịch thành công!</h2>
      <p className="font-sans text-xs sm:text-base text-[#7A6E60] mb-6 leading-relaxed">
        Lịch hẹn của quý khách đã được xác nhận. Vui lòng đến đúng khung giờ đã đặt.
      </p>

      <Card className="text-left mb-6 rounded-2xl border-[#E0D8CC] overflow-hidden shadow-sm">
        <div className="p-4 bg-gradient-to-r from-[#1D400E] to-[#316817] text-white flex items-center justify-between">
          <div>
            <p className="font-sans text-xs text-white/85 uppercase tracking-widest">Mã đặt lịch</p>
            <p className="font-sans text-xl font-bold">{bookingId}</p>
          </div>
          <Badge variant="gold">ĐÃ XÁC NHẬN</Badge>
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
            <span className="font-semibold text-[#316817] text-right">{selectedStartTime} – {selectedEndTime} ({n * 45} phút)</span>
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

      <div className="space-y-3">
        <Button
          variant="default"
          className="w-full h-12 rounded-xl bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          onClick={onNewBooking}
        >
          <span>Hoàn tất & Tra cứu mới</span>
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-[#316817] text-[#316817] hover:bg-[#316817] hover:text-white font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={onReschedule}
        >
          <CalendarCheck size={16} className="shrink-0" />
          <span>Đổi lịch</span>
        </Button>

        <p className="font-sans text-[13px] text-[#6B5F51] leading-relaxed">
          Đổi lịch sẽ huỷ lịch hẹn <strong className="text-[#2C2820]">{bookingId}</strong> và trả lại khung giờ đã giữ.
        </p>
      </div>
    </div>
  )
}
