// types/index.ts

export interface Order {
    id?: string
    order_name: string
    order_date: string
    order_end: string | null
    status: string | null
}

export interface OrderItem {
    id?: string
    id_order: string      // ตัวเชื่อมไปยังตาราง order
    name_type: string | null
    frame_color: string | null
    mesh_color: string | null
    width: number | null
    height: number | null
    handle: number | null
    frame: number | null
    topbutton: number | null
    short: number | null
    netsize: number | null
    cutnet: number | null
    phasedrill: number | null
    rope: number | null
    number_rope: number | null
}