export interface Tenant {
  id: string
  name: string
  subdomain: string
  logo_url: string | null
  is_active: boolean
  settings: Record<string, any>
}

export interface User {
  id: string
  tenant_id: string
  name: string
  email: string
  role: 'admin' | 'sales'
  is_active: boolean
  last_login_at: string | null
  created_at: string
  tenant?: Tenant
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Customer {
  id: string
  tenant_id: string
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
  id: string
  tenant_id: string
  name: string
  price: number
  sku: string | null
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

export interface TransactionItem {
  id?: string
  product_id: string
  name: string
  qty: number
  price: number
  subtotal: number
}

export interface Transaction {
  id: string
  customer_id: string
  number: string
  total: number
  status: 'paid' | 'unpaid'
  notes: string | null
  items: TransactionItem[]
  created_at: string
  customer?: { id: string; name: string; phone: string }
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
  id: string
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
  id: string
  customer_id: string
  phone: string
  direction: 'inbound' | 'outbound'
  message: string
  status: 'pending' | 'sent' | 'failed'
  wa_message_id: string | null
  error_msg: string | null
  sent_at: string | null
  created_at: string
  customer?: { name: string; phone: string }
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  description: string
  created_at: string
  user?: { name: string }
}
