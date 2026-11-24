export type Role = 'customer' | 'seller' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type AccountType = 'customer' | 'bulk';
export type BulkStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'renewal_pending';
export type OrderType = 'retail' | 'bulk';
export type PaymentMethod = 'upi' | 'bank_transfer';
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
  account_type: AccountType;
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
  order_type: OrderType;
  payment_method: PaymentMethod;
  buyer_gstin: string | null;
  buyer_shop_name: string | null;
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
  order_type: OrderType;
  buyer_gstin: string | null;
  buyer_shop_name: string | null;
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

export interface BulkApplication {
  id: string;
  application_no: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  licence_number: string;
  licence_expiry: string;
  document_paths: string[];
  status: BulkStatus;
  admin_note: string | null;
  user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
