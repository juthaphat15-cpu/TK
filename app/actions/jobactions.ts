// actions/jobActions.ts
"use server"

import { supabase } from "@/app/lib/supabase"

export async function createFullOrder(headerData: any, items: any[]) {
    try {
        // 1. บันทึกลงตาราง "order" (ตารางแม่)
        const { data: order, error: orderError } = await supabase
            .from('order')
            .insert([{
                order_name: headerData.addressName,
                order_date: headerData.startDate,
                order_end: headerData.endDate,
                status: 'pending'
            }])
            .select()
            .single()

        if (orderError) throw new Error(orderError.message)

        // 2. เตรียมข้อมูลลงตาราง "order_item"
        // อ้างอิงลำดับ Array: [finalHeight(0), Siderails(1), topButton(2), MosquitoNetSize(3), cutNet(4), phaseDrill(5), rope(6), numberrope(7)]
        const itemsToInsert = items.map(item => {
            const val = item.calcValue; // Array ผลลัพธ์การคำนวณ
            const isDoor = item.category === "door";

            return {
                id_order: order.id,
                type_id: `${item.category} - ${item.type}`,
                frame_color: item.frameColor,
                mesh_color: item.meshColor,
                width: parseFloat(item.width),
                height: parseFloat(item.height),
                // กระจายค่าลงคอลัมน์ตามที่คุณออกแบบไว้ใน SQL
                frame: val[0],        // finalHeight
                handle: val[1],       // Siderails
                topbutton: val[2],    // topButton
                netsize: val[3],      // MosquitoNetSize
                cutnet: val[4],       // cutNet
                // เช็คตำแหน่งตามที่คุณต้องการ: ประตู index 5, หน้าต่าง index 4
                phasedrill: isDoor ? val[5] : val[4], 
                rope: isDoor ? val[6] : val[5], // ปรับตามลำดับหน้าต่างของคุณ
                number_rope: isDoor ? val[7] : val[6]
            }
        })

        // 3. บันทึกลูกทั้งหมด
        const { error: itemsError } = await supabase
            .from('order_item')
            .insert(itemsToInsert)

        if (itemsError) throw new Error(itemsError.message)

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}