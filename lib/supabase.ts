import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string
          rating: number
          reviews_count: number
          show_in_kitchen: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category: string
          rating?: number
          reviews_count?: number
          show_in_kitchen?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string
          rating?: number
          reviews_count?: number
          show_in_kitchen?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          color: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          color?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          color?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          number: number
          zone: string
          capacity: number
          status: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: number
          zone?: string
          capacity?: number
          status?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: number
          zone?: string
          capacity?: number
          status?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_number: number
          items: any[]
          subtotal: number
          fees_total: number
          discount_amount: number
          discount_reason: string | null
          total: number
          status: string
          dining_type: string
          order_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: number
          items: any[]
          subtotal: number
          fees_total?: number
          discount_amount?: number
          discount_reason?: string | null
          total: number
          status?: string
          dining_type?: string
          order_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: number
          items?: any[]
          subtotal?: number
          fees_total?: number
          discount_amount?: number
          discount_reason?: string | null
          total?: number
          status?: string
          dining_type?: string
          order_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          table_number: number
          type: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: number
          type: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: number
          type?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      upsell_rules: {
        Row: {
          id: string
          trigger_product: string
          suggested_product: string
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trigger_product: string
          suggested_product: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trigger_product?: string
          suggested_product?: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          customer_name: string
          rating: number
          comment: string
          table_number: number
          status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          rating: number
          comment: string
          table_number: number
          status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          rating?: number
          comment?: string
          table_number?: number
          status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fees: {
        Row: {
          id: string
          name: string
          description: string | null
          amount: number
          type: string
          applies_to: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          amount: number
          type: string
          applies_to?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          amount?: number
          type?: string
          applies_to?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff_profiles: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          role: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password_hash: string
          role: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          role?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      settings: {
        Row: {
          id: string
          cafe_name: string
          location: string
          phone_number: string
          operating_hours: any // JSONB
          system_config: any // JSONB
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_name: string
          location: string
          phone_number: string
          operating_hours: any
          system_config: any
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_name?: string
          location?: string
          phone_number?: string
          operating_hours?: any
          system_config?: any
          updated_at?: string
        }
      },
      order_fees: {
        Row: {
          id: string
          order_id: string
          fee_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          fee_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          fee_id?: string
          amount?: number
          created_at?: string
        }
      }
      order_edit_history: {
        Row: {
          id: string
          order_id: string
          staff_id: string | null
          action: string
          old_data: any | null
          new_data: any | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          staff_id?: string | null
          action: string
          old_data?: any | null
          new_data?: any | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          staff_id?: string | null
          action?: string
          old_data?: any | null
          new_data?: any | null
          reason?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          image_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          number_of_guests: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          number_of_guests?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          number_of_guests?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
