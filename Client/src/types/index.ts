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
