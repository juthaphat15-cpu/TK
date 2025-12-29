"use client"

import React from 'react'
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface SubmitOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void // เปลี่ยนจาก onSave เป็น onConfirm เพื่อความชัดเจน
  isLoading?: boolean
  title?: string
  message?: string
}

export default function SubmitOrderModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = "ยืนยันการบันทึกข้อมูล",
  message = "คุณตรวจสอบข้อมูลครบถ้วนแล้ว และต้องการบันทึกรายการนี้ใช่หรือไม่?"
}: SubmitOrderModalProps) {
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop - เบลอพื้นหลังเล็กน้อยเพื่อให้ดูโฟกัส */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          
          {/* Icon Area - ใช้สีเขียวสื่อถึงการบันทึก/สำเร็จ */}
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={40} strokeWidth={2.5} className="animate-bounce" />
            </div>
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-gray-500 font-medium leading-relaxed px-2">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
            >
              ตรวจสอบอีกครั้ง
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยันบันทึก"
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}