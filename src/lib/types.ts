export type Role = 'customer' | 'seller' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type WholesaleStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type OrderStatus =
  | 'payment_pending'
  | 'payment_submitted'
  | 'confirmed'
  | 'completed'
  | 'rejected'
  | 'cancelled';
export type SubOrderStatus = 'awaiting_payment' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  wholesale: WholesaleStatus;
  wholesale_gstin: string | null;
  wholesale_shop_name: string | null;
}

export interface Seller {
  id: string;
  user_id: string;
  shop_id: string;
  company_name: string;
  gst_number: string;
  contact_phone: string;
  email: string;
  address: string;
  licence_number: string;
  licence_path: string | null;
  licence_expiry: string | null;
  upi_id: string | null;
  min_order: number;
  status: SellerStatus;
  admin_note: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  name_ta: string | null;
  sort: number;
}

export interface Product {
  id: string;
  seller_id: string;
  shop_id: string;
  category_id: number | null;
  name: string;
  description: string | null;
  pack_info: string | null;
  mrp: number;
  price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number;
  is_green: boolean;
  image_url: string | null;
  in_stock: boolean;
  active: boolean;
}

export interface Order {
  id: string;
  order_no: string;
  customer_id: string;
  ship_name: string;
  ship_phone: string;
  ship_address: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  is_wholesale: boolean;
  total: number;
  status: OrderStatus;
  utr: string | null;
  proof_path: string | null;
  admin_note: string | null;
  created_at: string;
  payment_submitted_at: string | null;
}

export interface SubOrder {
  id: string;
  order_id: string;
  seller_id: string;
  shop_id: string;
  subtotal: number;
  status: SubOrderStatus;
  ship_name: string;
  ship_city: string;
  ship_pincode: string;
  ship_phone_masked: string;
  transport_name: string | null;
  lr_number: string | null;
  lr_photo_url: string | null;
  cancel_reason: string | null;
  created_at: string;
  dispatched_at: string | null;
}

export interface OrderItem {
  id: number;
  sub_order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  qty: number;
}
