"use client"

import React, { useEffect, useState } from 'react'
import { Plus, Search, FileText, Trash2, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Filter, Edit, X } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DeleteModal from '@/app/components/common/modalDelete'
import SubmitOrderModal from '@/app/components/common/modalSubmit'

// ปรับ Interface ให้รองรับข้อมูลจาก status_data (Foreign Key)
interface Order {
  id: string
  order_name: string
  order_date: string
  order_end: string | null
  status: number | string // ตอนนี้เป็น ID (int)
  status_data?: {
    status_name: string
  }
}

interface StatusOption {
  id: number
  status_name: string
}

export default function Summarytablepage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statuses, setStatuses] = useState<StatusOption[]>([]) // เก็บรายการสถานะทั้งหมด
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // State สำหรับ Modal แก้ไข
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentEditOrder, setCurrentEditOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({ name: '', status: 1 })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const confirmDelete = (id: string, name: string) => {
    setItemToDelete({ id, name })
    setIsDeleteModalOpen(true)
  }

  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      // 1. ดึงสถานะทั้งหมดมาเก็บไว้ก่อน
      const { data: statusData } = await supabase.from('status_data').select('*')
      setStatuses(statusData || [])

      // 2. ดึง Order พร้อม Join status_data
      const { data: orderData, error } = await supabase
        .from('order')
        .select(`
          *,
          status_data (
            status_name
          )
        `)
        .order('order_date', { ascending: true })

      if (error) throw error
      setOrders(orderData || [])
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleActualDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await supabase.from('order_item').delete().eq('id_order', itemToDelete.id)
      await supabase.from('order').delete().eq('id', itemToDelete.id)

      setOrders(orders.filter(o => o.id !== itemToDelete.id))
      setIsDeleteModalOpen(false) // ปิด Modal
    } catch (error) {
      alert("ลบไม่สำเร็จ")
    } finally {
      setIsDeleting(false)
    }
  }

  // ฟังก์ชันเปิด Modal แก้ไข
  const openEditModal = (order: Order) => {
    setCurrentEditOrder(order)
    setEditForm({
      name: order.order_name,
      status: Number(order.status)
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!currentEditOrder) return;

    try {
      setIsSaving(true); 
      const { error } = await supabase
        .from('order')
        .update({
          order_name: editForm.name,
          status: editForm.status
        })
        .eq('id', currentEditOrder.id);

      if (error) throw error;

      setIsSubmitModalOpen(false); 
      setIsEditModalOpen(false); 
      await fetchData();

    } catch (error: any) {
      console.error("Update error:", error);
      alert('แก้ไขไม่สำเร็จ: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // const handleSaveNewOrder = async (formData: any) => {
  //   setIsSaving(true)
  //   try {
  //     const { error } = await supabase
  //       .from('order')
  //       .insert([
  //         {
  //           order_name: formData.order_name,
  //           order_date: formData.order_date,
  //           status: formData.status
  //         }
  //       ])

  //     if (error) throw error

  //     setIsCreateModalOpen(false) // ปิด Modal
  //     fetchData() // รีโหลดข้อมูลในตาราง (เพื่อให้รายการใหม่ที่เพิ่งเพิ่มแสดงขึ้นมาบนสุด)
  //     alert("บันทึกข้อมูลสำเร็จ")
  //   } catch (error: any) {
  //     alert("เกิดข้อผิดพลาด: " + error.message)
  //   } finally {
  //     setIsSaving(false)
  //   }
  // }

  // Filter ข้อมูล (ค้นหาตามชื่อ และ ชื่อสถานะ)
  const filteredOrders = orders.filter(order => {
    const statusName = order.status_data?.status_name || ""
    const matchesSearch =
      (order.order_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      statusName.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  })

  // แสดง Badge ตาม ID สถานะ
  const getStatusBadge = (statusId: any) => {
    const id = Number(statusId);
    if (id === 2) return <span className="text-green-800 flex items-center gap-1 font-bold bg-green-100 py-2 pl-1 rounded-xl w-[140] border-2 border-green-500"><CheckCircle2 size={16} /> สำเร็จ</span>
    if (id === 3) return <span className="text-red-600 flex items-center gap-1 font-bold bg-red-100 py-2 pl-1 rounded-xl w-[140] border-2 border-red-500"><XCircle size={16} /> ยกเลิก</span>
    return <span className="text-amber-800 flex items-center gap-1 font-bold bg-amber-100 py-2 pl-1 rounded-xl w-[140] border-2 border-amber-500"><Clock size={16} /> รอดำเนินการ</span>
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">ตารางงานทั้งหมด</h1>
            <p className="text-gray-500 mt-1 font-medium">จัดการสถานะและข้อมูลใบสั่งทำ</p>
          </div>
          <button
            onClick={() => router.push("/admin/summarytable/create")}
            className="bg-blue-600 py-5 px-8 rounded-2xl border-white border-2 shadow-2xl
            hover:bg-blue-700
            hover:scale-110 transition-transform duration-300"
          >
            <p className="text-white text-[20px] font-bold">
              เพิ่มรายการ
            </p>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อหน้างาน หรือ สถานะ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 p-3.5 rounded-2xl border border-gray-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-gray-600"
            >
              <option value="all">ทุกสถานะ</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.status_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-600">
                  <th className="px-8 py-5 text-[18px] font-black text-white tracking-widest">ชื่อหน้างาน</th>
                  <th className="px-8 py-5 text-[18px] font-black text-white tracking-widest">วันที่</th>
                  <th className="px-8 py-5 text-[18px] font-black text-white tracking-widest">สถานะ</th>
                  <th className="px-8 pl-5 pr-18 text-[18px] font-black text-white tracking-widest text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-400">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-200 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-gray-800 text-lg uppercase">{order.order_name}</p>
                    </td>
                    <td className="px-8 py-6 font-bold text-gray-600">
                      {new Date(order.order_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(order)} className="p-3 bg-amber-50 border-2 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                          <Edit size={18} />
                        </button>
                        <Link href={`/admin/summarytable/preview/${order.id}`} className="p-3 bg-gray-50 border-2 text-gray-600 rounded-xl hover:bg-black hover:text-white transition-all">
                          <FileText size={18} />
                        </Link>
                        <button onClick={() => confirmDelete(order.id, order.order_name)} className="p-3 bg-red-50 border-2 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase italic">แก้ไขข้อมูลงาน</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-600"><X /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[15px] font-black uppercase text-gray-700 mb-2 tracking-widest">ชื่อหน้างาน</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-4 rounded-2xl border-2 border-gray-500 focus:border-blue-500 outline-none font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-black uppercase text-gray-700 mb-2 tracking-widest">สถานะปัจจุบัน</label>
                  <div className="grid grid-cols-1 gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setEditForm({ ...editForm, status: s.id })}
                        className={`p-4 rounded-2xl text-left font-bold transition-all border-2 ${editForm.status === s.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-500'
                          }`}
                      >
                        {s.id === 1 && "🟡 "}
                        {s.id === 2 && "🟢 "}
                        {s.id === 3 && "🔴 "}
                        {s.status_name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleActualDelete}
        title="ยืนยันการลบข้อมูล"
        itemName={itemToDelete?.name || ""}
        isLoading={isDeleting}
      />
      <SubmitOrderModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleUpdate} // เมื่อกดยืนยัน ให้เรียกฟังก์ชัน Update จริง
        isLoading={isSaving}
        title="ยืนยันการแก้ไข"
        message="คุณต้องการบันทึกการเปลี่ยนแปลงของข้อมูลงานนี้ใช่หรือไม่?"
      />
    </div>

  )
}