import { useState } from "react"
import { CheckCircle2, XCircle, Clock, Search, ArrowLeft, Building2, User, Phone, Mail, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookingRecord } from "@/App"

interface Props {
  records: BookingRecord[]
  onUpdateStatus: (id: string, newStatus: "APPROVED" | "REJECTED") => void
  onBack: () => void
}

export default function AdminBookingManagement({ records, onUpdateStatus, onBack }: Props) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRecords = records.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      r.id.toLowerCase().includes(term) ||
      r.customer.name.toLowerCase().includes(term) ||
      r.customer.phone.includes(term) ||
      r.customer.apartments.some((a) => a.code.toLowerCase().includes(term))

    return matchesStatus && matchesSearch
  })

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-[#316817] mb-1">
            Bảng điều khiển Quản trị viên
          </p>
          <h2 className="font-serif text-3xl font-medium text-[#2C2820]">
            Quản lý yêu cầu đặt lịch bàn giao
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl">
          <ArrowLeft size={14} /> Về trang cư dân
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#FAF7F2] border-[#E0D8CC] rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-sans text-[10px] text-[#9A8E80] uppercase tracking-wider">Tổng lịch</p>
              <p className="font-serif text-2xl font-bold text-[#2C2820]">{records.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="rounded-xl border-[#E0D8CC] shadow-sm">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-serif font-bold text-base text-[#2C2820]">{record.customer.name}</p>
                <p className="font-sans text-xs text-[#7A6E60]">{record.date} ({record.startTime} – {record.endTime})</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={record.status === "APPROVED" ? "default" : record.status === "REJECTED" ? "destructive" : "pending"}>
                  {record.status}
                </Badge>
                {record.status === "PENDING" && (
                  <Button variant="default" size="sm" onClick={() => onUpdateStatus(record.id, "APPROVED")} className="bg-[#316817] hover:bg-[#224A10] rounded-lg">
                    Duyệt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
