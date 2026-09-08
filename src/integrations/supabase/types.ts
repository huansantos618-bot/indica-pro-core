export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          commission_value: number
          company_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          product: string | null
          rules: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string
        }
        Insert: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          commission_value?: number
          company_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          product?: string | null
          rules?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string
        }
        Update: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          commission_value?: number
          company_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          product?: string | null
          rules?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          campaign_id: string | null
          company_id: string
          created_at: string
          id: string
          indicator_id: string
          lead_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          campaign_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          indicator_id: string
          lead_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          indicator_id?: string
          lead_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          category_business: string | null
          city: string | null
          cnpj: string | null
          company_code: string | null
          contact_email: string | null
          country: string
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          id: string
          is_active: boolean
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          state: string | null
          subscription_expires_at: string | null
          updated_at: string
        }
        Insert: {
          category_business?: string | null
          city?: string | null
          cnpj?: string | null
          company_code?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          state?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          category_business?: string | null
          city?: string | null
          cnpj?: string | null
          company_code?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug?: string
          state?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cash_register: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_date: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_date?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_date?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_cash_register_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_curriculum: {
        Row: {
          about_us_text: string | null
          company_id: string
          created_at: string
          founded_year: number | null
          id: string
          mission_vision_values: string | null
          photo_urls: string[]
          sales_script: string | null
          support_material_links: string[]
          training_video_url: string | null
          updated_at: string
        }
        Insert: {
          about_us_text?: string | null
          company_id: string
          created_at?: string
          founded_year?: number | null
          id?: string
          mission_vision_values?: string | null
          photo_urls?: string[]
          sales_script?: string | null
          support_material_links?: string[]
          training_video_url?: string | null
          updated_at?: string
        }
        Update: {
          about_us_text?: string | null
          company_id?: string
          created_at?: string
          founded_year?: number | null
          id?: string
          mission_vision_values?: string | null
          photo_urls?: string[]
          sales_script?: string | null
          support_material_links?: string[]
          training_video_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_curriculum_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_custom_categories: {
        Row: {
          category_name: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          category_name: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          category_name?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_custom_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_plan_requests: {
        Row: {
          amount: number
          approved_at: string | null
          company_code: string | null
          company_id: string
          created_at: string
          id: string
          requested_plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["plan_request_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          company_code?: string | null
          company_id: string
          created_at?: string
          id?: string
          requested_plan: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["plan_request_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          company_code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          requested_plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["plan_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_plan_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      indica_pro_sales: {
        Row: {
          commission_amount: number
          company_id: string
          created_at: string
          discount_amount: number
          gross_amount: number
          id: string
          indicator_id: string | null
          lead_id: string | null
          product_id: string | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          sold_at: string
        }
        Insert: {
          commission_amount?: number
          company_id: string
          created_at?: string
          discount_amount?: number
          gross_amount?: number
          id?: string
          indicator_id?: string | null
          lead_id?: string | null
          product_id?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          sold_at?: string
        }
        Update: {
          commission_amount?: number
          company_id?: string
          created_at?: string
          discount_amount?: number
          gross_amount?: number
          id?: string
          indicator_id?: string | null
          lead_id?: string | null
          product_id?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          sold_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indica_pro_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indica_pro_sales_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indica_pro_sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indica_pro_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_photo_requests: {
        Row: {
          created_at: string
          deadline_at: string
          id: string
          indicator_id: string
          requested_by: string | null
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          deadline_at?: string
          id?: string
          indicator_id: string
          requested_by?: string | null
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          deadline_at?: string
          id?: string
          indicator_id?: string
          requested_by?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_photo_requests_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          code: string
          company_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code?: string
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          lead_id: string | null
          product_id: string
          quantity_delta: number
          reason: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          product_id: string
          quantity_delta: number
          reason?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          product_id?: string
          quantity_delta?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_by: string | null
          company_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["lead_status"] | null
          id: string
          lead_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          changed_by?: string | null
          company_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          lead_id: string
          note?: string | null
          to_status: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          changed_by?: string | null
          company_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          lead_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_id: string | null
          client_whatsapp: string | null
          commission_amount: number
          company_id: string
          created_at: string
          deal_value: number | null
          email: string | null
          id: string
          indicator_id: string | null
          name: string
          notes: string | null
          phone: string | null
          product_id: string | null
          reward_given: boolean
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          client_whatsapp?: string | null
          commission_amount?: number
          company_id: string
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          indicator_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          reward_given?: boolean
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          client_whatsapp?: string | null
          commission_amount?: number
          company_id?: string
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          indicator_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          reward_given?: boolean
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      products_campaigns: {
        Row: {
          commission_type: Database["public"]["Enums"]["reward_type"]
          commission_value: number
          company_id: string
          created_at: string
          description: string | null
          discount_percentage_per_sale: number
          gallery_urls: string[]
          id: string
          image_url: string | null
          is_active: boolean
          objections_text: string | null
          price: number
          product_condition: string
          reward_description: string | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          slug: string | null
          stock_quantity: number
          title: string
          training_video_url: string | null
          updated_at: string
        }
        Insert: {
          commission_type?: Database["public"]["Enums"]["reward_type"]
          commission_value?: number
          company_id: string
          created_at?: string
          description?: string | null
          discount_percentage_per_sale?: number
          gallery_urls?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          objections_text?: string | null
          price?: number
          product_condition?: string
          reward_description?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          slug?: string | null
          stock_quantity?: number
          title: string
          training_video_url?: string | null
          updated_at?: string
        }
        Update: {
          commission_type?: Database["public"]["Enums"]["reward_type"]
          commission_value?: number
          company_id?: string
          created_at?: string
          description?: string | null
          discount_percentage_per_sale?: number
          gallery_urls?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          objections_text?: string | null
          price?: number
          product_condition?: string
          reward_description?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          slug?: string | null
          stock_quantity?: number
          title?: string
          training_video_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      remarketing_leads: {
        Row: {
          client_name: string
          client_whatsapp: string
          company_id: string
          created_at: string
          id: string
          indicator_id: string | null
          lead_id: string | null
          product_id: string | null
        }
        Insert: {
          client_name: string
          client_whatsapp: string
          company_id: string
          created_at?: string
          id?: string
          indicator_id?: string | null
          lead_id?: string | null
          product_id?: string | null
        }
        Update: {
          client_name?: string
          client_whatsapp?: string
          company_id?: string
          created_at?: string
          id?: string
          indicator_id?: string | null
          lead_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remarketing_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarketing_leads_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarketing_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarketing_leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          admin_pix_key: string | null
          admin_whatsapp: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          admin_pix_key?: string | null
          admin_whatsapp?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          admin_pix_key?: string | null
          admin_whatsapp?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      generate_company_code: { Args: never; Returns: string }
      generate_indicator_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_my_indicator: { Args: { _indicator_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      slugify: { Args: { _value: string }; Returns: string }
      unaccent_fallback: { Args: { _value: string }; Returns: string }
      write_audit_log: {
        Args: {
          _action: string
          _company_id: string
          _details: string
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "indicator"
      campaign_status: "draft" | "active" | "paused" | "archived"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      commission_type: "fixed" | "percentage"
      document_type: "CPF" | "CNPJ"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "negotiation"
        | "won"
        | "lost"
      payment_method:
        | "dinheiro"
        | "cartao_credito"
        | "cartao_debito"
        | "app_delivery_ifood"
        | "outro"
      plan_request_status: "pending" | "approved" | "rejected"
      profile_status: "pending_approval" | "active" | "paused" | "banned"
      reward_type:
        | "cash"
        | "discount"
        | "free_product"
        | "gift"
        | "store_discount"
        | "product_discount"
      subscription_plan: "free" | "pro" | "enterprise" | "starter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "company_admin", "indicator"],
      campaign_status: ["draft", "active", "paused", "archived"],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      commission_type: ["fixed", "percentage"],
      document_type: ["CPF", "CNPJ"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "negotiation",
        "won",
        "lost",
      ],
      payment_method: [
        "dinheiro",
        "cartao_credito",
        "cartao_debito",
        "app_delivery_ifood",
        "outro",
      ],
      plan_request_status: ["pending", "approved", "rejected"],
      profile_status: ["pending_approval", "active", "paused", "banned"],
      reward_type: [
        "cash",
        "discount",
        "free_product",
        "gift",
        "store_discount",
        "product_discount",
      ],
      subscription_plan: ["free", "pro", "enterprise", "starter"],
    },
  },
} as const
