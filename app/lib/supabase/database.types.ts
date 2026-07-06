export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          display_name: string | null
          timezone: string | null
          language: string | null
          currency_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          display_name?: string | null
          timezone?: string | null
          language?: string | null
          currency_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          display_name?: string | null
          timezone?: string | null
          language?: string | null
          currency_preference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_users: {
        Row: {
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          created_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          billing_email: string | null
          phone: string | null
          website: string | null
          address: string | null
          tax_id: string | null
          brand_kit: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          billing_email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          tax_id?: string | null
          brand_kit?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          billing_email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          tax_id?: string | null
          brand_kit?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          display_name: string
          company_name: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          website: string | null
          billing_address: string | null
          tax_id: string | null
          currency: string
          payment_terms: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          display_name: string
          company_name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          billing_address?: string | null
          tax_id?: string | null
          currency?: string
          payment_terms?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          display_name?: string
          company_name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          billing_address?: string | null
          tax_id?: string | null
          currency?: string
          payment_terms?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          workspace_id: string
          client_id: string | null
          invoice_number: string
          date: string
          due_date: string
          amount: number
          currency: string
          status: 'Draft' | 'Pending' | 'Paid' | 'Overdue'
          tax_rate: number
          discount_rate: number
          notes: string | null
          client_snapshot: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          client_id?: string | null
          invoice_number: string
          date: string
          due_date: string
          amount?: number
          currency?: string
          status?: 'Draft' | 'Pending' | 'Paid' | 'Overdue'
          tax_rate?: number
          discount_rate?: number
          notes?: string | null
          client_snapshot?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          client_id?: string | null
          invoice_number?: string
          date?: string
          due_date?: string
          amount?: number
          currency?: string
          status?: 'Draft' | 'Pending' | 'Paid' | 'Overdue'
          tax_rate?: number
          discount_rate?: number
          notes?: string | null
          client_snapshot?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          qty: number
          rate: number
          sort_order: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          qty?: number
          rate?: number
          sort_order?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          qty?: number
          rate?: number
          sort_order?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
