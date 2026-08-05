export interface User {
  id: number
  tenant_id: number
  name: string
  email: string
  role: 'admin' | 'sales'
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Customer {
  id: number
  tenant_id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  tag: string | null
  source: string
  notes: string | null
  last_contacted_at: string | null
  created_at: string
}

export interface Product {
  id: number
  tenant_id: number
  name: string
  price: number
  sku: string | null
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

export interface TransactionItem {
  id?: number
  name: string
  qty: number
  price: number
  subtotal: number
}

export interface Transaction {
  id: number
  customer_id: number
  number: string
  total: number
  status: 'paid' | 'unpaid'
  notes: string | null
  items: TransactionItem[]
  created_at: string
  customer?: { id: number; name: string; phone: string }
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: { field: string; message: string }[]
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    per_page: number
    total: number
  }
}

export interface DashboardSummary {
  total_customers: number
  total_transactions: number
  total_revenue: number
}

export interface DashboardData {
  summary: DashboardSummary
  recent_customers: Customer[]
  recent_transactions: Transaction[]
  revenue_chart: { date: string; total: number }[]
}

export interface WAConfig {
  phone_number_id: string
  token: string
  is_active: boolean
}

export interface WABroadcast {
  id: number
  title: string
  message: string
  target_tag: string | null
  target_all: boolean
  status: 'draft' | 'sending' | 'sent' | 'failed'
  total: number
  sent: number
  failed: number
  sent_at: string | null
  created_at: string
}

export interface WAMessage {
  id: number
  customer_id: number
  phone: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  wa_message_id: string | null
  error_msg: string | null
  sent_at: string | null
  created_at: string
  customer?: { name: string; phone: string }
}

export interface ActivityLog {
  id: number
  user_id: number | null
  action: string
  entity: string
  entity_id: number | null
  description: string
  created_at: string
  user?: { name: string }
}
