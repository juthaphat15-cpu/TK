"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Trash2, Edit } from 'lucide-react'
import { supabase } from "@/app/lib/supabase"
import DeleteModal from '@/app/components/common/modalDelete'

// --- [ส่วนที่เพิ่ม] Import ฟังก์ชันสร้าง PDF เข้ามา ---
import { generateOrderPDF } from '@/app/components/PDF/pdfOrder'

interface OrderItem {
  id: string
  type_id: number
  side: string
  width: number
  height: number
  frame_color: string
  mesh_color: string
  handle: number
  frame: number
  topbutton: number
  short: number
  netsize: number
  cutnet: number
  phasedrill: number
  rope: number
  number_rope: number
}

interface OrderHeader {
  order_name: string
  order_date: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id

  const [items, setItems] = useState<OrderItem[]>([])
  const [header, setHeader] = useState<OrderHeader | null>(null)
  const [loading, setLoading] = useState(true)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = (id: string) => {
    setItemToDelete({ id })
    setIsDeleteModalOpen(true)
  }

  // ฟังก์ชันดึงข้อมูลใหม่
  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: orderData } = await supabase
        .from('order')
        .select('order_name, order_date')
        .eq('id', orderId)
        .single()
      setHeader(orderData)

      const { data: itemsData, error } = await supabase
        .from('order_item')
        .select('*')
        .eq('id_order', orderId)
        .order('id', { ascending: true })

      if (error) throw error
      setItems(itemsData || [])
    } catch (error: any) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleActualDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await supabase.from('order_item').delete().eq('id', itemToDelete.id)

      setItems(items.filter(o => o.id !== itemToDelete.id))
      setIsDeleteModalOpen(false)
    } catch (error) {
      alert("ลบไม่สำเร็จ")
    } finally {
      setIsDeleting(false)
    }
  }

  // ฟังก์ชันไปหน้าแก้ไข
  const handleEdit = (id: string) => {
    router.push(`../edit/${id}`)
  }

  const getTypeName = (typeId: number) => {
    switch (typeId) {
      case 10: return { label: "ประตู", isDouble: false, color: "text-black" };
      case 11: return { label: "ประตู(คู่)", isDouble: true, color: "text-black" };
      case 20: return { label: "หน้าต่าง", isDouble: false, color: "text-black" };
      case 21: return { label: "หน้าต่าง(คู่)", isDouble: true, color: "text-black" };
      case 99: return { label: "บานอิสระ", isDouble: false, color: "text-black" };
      default: return { label: "ไม่ระบุประเภท", isDouble: false, color: "text-black" };
    }
  }

  useEffect(() => {
    if (orderId) fetchData()
  }, [orderId])

  if (loading) return <div className="p-20 text-center font-bold">กำลังโหลดข้อมูลรายการ...</div>

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <button 
            onClick={() => {router.push("/admin/summarytable")}} 
            className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-all mb-2">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-black text-gray-900 uppercase">รายละเอียดใบงาน: {header?.order_name}</h1>
            <p className="text-sm text-gray-500">วันที่ทำรายการ: {header ? new Date(header.order_date).toLocaleDateString('th-TH') : '-'}</p>
          </div>
          <button
            onClick={() => {
              router.push(`/admin/summarytable/createById/${orderId}`)
            }} className="bg-blue-600 py-5 px-8 rounded-2xl border-white border-2 shadow-2xl
            hover:bg-blue-700
            hover:scale-110 transition-transform duration-300"
          >
            <p className="text-white text-[20px] font-bold">
              เพิ่มรายการ
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-black">
            <p className="text-xs font-bold text-gray-700 uppercase">จำนวนทั้งหมด</p>
            <p className="text-2xl font-black">{items.length} รายการ</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-amber-500">
            <p className="text-xs font-bold text-gray-700 uppercase">ประตู</p>
            <p className="text-2xl font-black">{items.filter(i => i.type_id === 10 || i.type_id === 11).length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <p className="text-xs font-bold text-gray-700 uppercase">หน้าต่าง</p>
            <p className="text-2xl font-black">{items.filter(i => i.type_id === 20 || i.type_id === 21).length}</p>
          </div>
          
          <button 
            onClick={() => generateOrderPDF(items, header)} 
            className="bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition-all shadow-lg cursor-pointer active:scale-95"
          >
            <Printer size={20} /> พิมพ์ใบงาน (PDF)
          </button>

        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm shadow-black overflow-hidden border border-gray-100">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
            <table className="w-full text-left border-collapse min-w-[1600]">
              <thead>
                <tr className="bg-amber-500 text-white text-[15px] border-b-2 border-amber-600 font-black uppercase tracking-widest whitespace-nowrap text-center">
                  <th className="px-6 py-4 border-r-2 border-l-2 border-amber-600">บานที่</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">ประเภท</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">ขนาด (กว้างxสูง)</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">สีกรอบ/มุ้ง</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">มือจับ</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">รางข้าง</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">บน-ล่าง</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">รางเตี้ย</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">ขนาดผ้ามุ้ง</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">จำนวนจีบ</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">ระยะเจาะ</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">ความยาวเชือก</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600">จำนวนเชือก</th>
                  <th className="px-6 py-4 border-r-2 border-amber-600 bg-red-600">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {items.map((item, index) => {
                  const typeInfo = getTypeName(item.type_id);
                  return (
                    <tr key={item.id} className="hover:bg-gray-200 transition-colors font-medium whitespace-nowrap text-center border-t-2 border-gray-100">
                      <td className="px-6 py-4 text-gray-800 font-mono border-2 border-gray-400">#{index + 1}</td>
                      <td className="px-6 py-4 border-2 border-gray-400">
                        <span className={`px-2 py-1 rounded-lg text-[15px] font-bold uppercase ${typeInfo.color}`}>
                          {typeInfo.label} {item.side}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-bold border-2 border-gray-400">{item.width} x {item.height}</td>
                      <td className="px-6 py-4 text-[15px] text-gray-800 font-bold border-2 border-gray-400">
                        {item.frame_color} / {item.mesh_color}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">
                        {item.handle?.toFixed(1)}
                        {typeInfo.isDouble && (
                          <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1 rounded border border-red-200">x2</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">{item.frame?.toFixed(1)}</td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">{item.topbutton?.toFixed(1)}</td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">{item.short ? item.short.toFixed(1) : "-"}</td>

                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">
                        {item.netsize?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">
                        {item.cutnet?.toFixed(0)}
                        {typeInfo.isDouble && (
                          <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1 rounded border border-red-200">x2</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">{item.phasedrill?.toFixed(1)}</td>
                      <td className="px-6 py-4 font-mono font-bold border-2 border-gray-400">{item.rope ? Math.floor(item.rope) : "-"}</td>
                      <td className="px-6 py-4 font-mono font-bold text-[15px] border-2 border-gray-400">
                        {item.number_rope}
                      </td>
                      {/* ปุ่มจัดการ */}
                      <td className="px-6 py-4 border-2 border-gray-400">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete(item.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl mt-8 border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase italic">
            ไม่พบรายการย่อยในใบงานนี้
          </div>
        )}
      </div>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleActualDelete}
        title="ยืนยันการลบข้อมูล"
        itemName={"รายการนี้"}
        isLoading={isDeleting}
      />
    </div>
  )
}