"use client"

import React from 'react'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  isLoading?: boolean
}

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  itemName,
  isLoading = false 
}: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          {/* Icon Area */}
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse">
              <AlertTriangle size={32} />
            </div>
          </div>

          {/* Text Area */}
          <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-gray-500 font-medium leading-relaxed">
            คุณแน่ใจหรือไม่ที่จะลบรายการ <br />
            <span className="text-red-600 font-black px-2 py-1 bg-red-50 rounded-lg inline-block mt-2">
               "{itemName}"
            </span>
            <br />
            ข้อมูลนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-10">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-red-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  ยืนยันการลบ
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close Button (Top Right) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  )
}