export interface User {
  id: string;
  phone: string;
  email?: string;
  phone_verified: boolean;
  email_verified: boolean;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  old_price?: number;
  discount: number;
  unit?: string;
  image_url?: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: number;
  user_id: string;
  address_id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: string;
  label?: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  city: string;
  district?: string;
  notes?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
