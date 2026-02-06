import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client côté serveur avec Service Role pour opérations admin
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types TypeScript pour la base de données
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  transport_company?: string
  status?: 'owner' | 'employee' | 'renter'
  subscription_tier?: 'basic' | 'pro' | 'premium'
  created_at: string
}

export interface Revenue {
  id: string
  user_id: string
  date: string
  company: string
  type: 'regular' | 'extra' | 'bonus'
  amount: number
  hours_worked?: number
  description?: string
  status: 'pending' | 'paid'
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  date: string
  category: string
  subcategory?: string
  amount: number
  vendor?: string
  description?: string
  receipt_url?: string
  is_tax_deductible: boolean
  ai_confidence?: number
  created_at: string
  updated_at: string
}

export interface AIInsight {
  id: string
  user_id: string
  type: 'anomaly' | 'recommendation' | 'prediction'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  action_required: boolean
  dismissed: boolean
  created_at: string
}
