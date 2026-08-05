export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bakeries: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      bakery_invitations: {
        Row: {
          accepted_at: string | null
          bakery_id: string
          created_at: string
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          normalized_email: string
          revoked_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          bakery_id: string
          created_at?: string
          declined_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          normalized_email: string
          revoked_at?: string | null
          role: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          bakery_id?: string
          created_at?: string
          declined_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          normalized_email?: string
          revoked_at?: string | null
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_invitations_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      bakery_memberships: {
        Row: {
          bakery_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bakery_id: string
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bakery_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_memberships_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      bakery_payment_methods: {
        Row: {
          account_details_json: Json
          bakery_id: string
          created_at: string
          id: string
          instructions: string | null
          is_enabled: boolean
          method_type: string
          updated_at: string
        }
        Insert: {
          account_details_json?: Json
          bakery_id: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          method_type: string
          updated_at?: string
        }
        Update: {
          account_details_json?: Json
          bakery_id?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          method_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_payment_methods_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          bakery_id: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bakery_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bakery_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          bakery_id: string
          cost_per_unit: number
          created_at: string
          id: string
          kind: string
          min_level: number
          name: string
          on_hand: number
          package_price: number
          package_quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          bakery_id: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          kind?: string
          min_level?: number
          name: string
          on_hand?: number
          package_price: number
          package_quantity: number
          unit?: string
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          kind?: string
          min_level?: number
          name?: string
          on_hand?: number
          package_price?: number
          package_quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          bakery_id: string
          created_at: string
          id: string
          ingredient_id: string
          notes: string | null
          quantity_change: number
          reason: string
        }
        Insert: {
          bakery_id: string
          created_at?: string
          id?: string
          ingredient_id: string
          notes?: string | null
          quantity_change: number
          reason: string
        }
        Update: {
          bakery_id?: string
          created_at?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          quantity_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_requirements: {
        Row: {
          bakery_id: string
          created_at: string
          id: string
          ingredient_id: string | null
          order_id: string
          quantity_required: number
          status: string
        }
        Insert: {
          bakery_id: string
          created_at?: string
          id?: string
          ingredient_id?: string | null
          order_id: string
          quantity_required: number
          status?: string
        }
        Update: {
          bakery_id?: string
          created_at?: string
          id?: string
          ingredient_id?: string | null
          order_id?: string
          quantity_required?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_requirements_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_requirements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_requirements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          bakery_id: string
          created_at: string
          id: string
          invoice_reference: string | null
          item_id: string | null
          notes: string | null
          quantity_change: number
          source_key: string | null
          transaction_type: string | null
          unit_cost_cents: number | null
        }
        Insert: {
          bakery_id: string
          created_at?: string
          id?: string
          invoice_reference?: string | null
          item_id?: string | null
          notes?: string | null
          quantity_change: number
          source_key?: string | null
          transaction_type?: string | null
          unit_cost_cents?: number | null
        }
        Update: {
          bakery_id?: string
          created_at?: string
          id?: string
          invoice_reference?: string | null
          item_id?: string | null
          notes?: string | null
          quantity_change?: number
          source_key?: string | null
          transaction_type?: string | null
          unit_cost_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          invoice_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          invoice_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity: number
          total_price_cents: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_methods: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          payment_method_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          payment_method_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_methods_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payment_methods_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "bakery_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          bakery_id: string
          bakery_snapshot_json: Json
          balance_cents: number
          created_at: string
          customer_id: string | null
          customer_snapshot_json: Json
          discount_cents: number
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          order_id: string | null
          public_token: string
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          bakery_id: string
          bakery_snapshot_json?: Json
          balance_cents?: number
          created_at?: string
          customer_id?: string | null
          customer_snapshot_json?: Json
          discount_cents?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          order_id?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          bakery_id?: string
          bakery_snapshot_json?: Json
          balance_cents?: number
          created_at?: string
          customer_id?: string | null
          customer_snapshot_json?: Json
          discount_cents?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          order_id?: string | null
          public_token?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_attempts: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          order_id: string | null
          payload_json: Json
          status: string
          storefront_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          order_id?: string | null
          payload_json?: Json
          status?: string
          storefront_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          order_id?: string | null
          payload_json?: Json
          status?: string
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_order_attempts_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          recipe_id: string | null
          total_price_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          quantity: number
          recipe_id?: string | null
          total_price_cents?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          recipe_id?: string | null
          total_price_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid_cents: number
          bakery_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          payment_status: string
          pickup_date: string
          pickup_time: string | null
          source: string
          status: string
          storefront_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          bakery_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          pickup_date: string
          pickup_time?: string | null
          source?: string
          status?: string
          storefront_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          bakery_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          pickup_date?: string
          pickup_time?: string | null
          source?: string
          status?: string
          storefront_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          bakery_id: string
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          order_id: string | null
          payment_method: string
          reference_number: string | null
        }
        Insert: {
          amount_cents: number
          bakery_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          payment_method: string
          reference_number?: string | null
        }
        Update: {
          amount_cents?: number
          bakery_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string | null
          payment_method?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      production_tasks: {
        Row: {
          bakery_id: string
          category: string
          created_at: string
          delay_minutes: number | null
          duration_minutes: number
          flow_id: string | null
          flow_step_id: string | null
          id: string
          order_id: string
          quantity: number
          recipe_id: string | null
          scheduled_at: string
          skip_reason: string | null
          status: string
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          bakery_id: string
          category: string
          created_at?: string
          delay_minutes?: number | null
          duration_minutes?: number
          flow_id?: string | null
          flow_step_id?: string | null
          id?: string
          order_id: string
          quantity?: number
          recipe_id?: string | null
          scheduled_at: string
          skip_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          bakery_id?: string
          category?: string
          created_at?: string
          delay_minutes?: number | null
          duration_minutes?: number
          flow_id?: string | null
          flow_step_id?: string | null
          id?: string
          order_id?: string
          quantity?: number
          recipe_id?: string | null
          scheduled_at?: string
          skip_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_tasks_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_bakery_id: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_bakery_id?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_bakery_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_bakery_id_fkey"
            columns: ["default_bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          bakery_id: string
          batch_cost_cents: number | null
          created_at: string
          flow_id: string | null
          id: string
          name: string
          selling_price_cents: number | null
          updated_at: string
          yield: string | null
        }
        Insert: {
          bakery_id: string
          batch_cost_cents?: number | null
          created_at?: string
          flow_id?: string | null
          id?: string
          name: string
          selling_price_cents?: number | null
          updated_at?: string
          yield?: string | null
        }
        Update: {
          bakery_id?: string
          batch_cost_cents?: number | null
          created_at?: string
          flow_id?: string | null
          id?: string
          name?: string
          selling_price_cents?: number | null
          updated_at?: string
          yield?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      starter_builds: {
        Row: {
          bakery_id: string
          created_at: string
          flour_amount_g: number
          id: string
          profile_id: string | null
          retained_starter_g: number
          seed_amount_g: number
          target_date: string
          total_build_g: number
          usable_amount_g: number
          water_amount_g: number
        }
        Insert: {
          bakery_id: string
          created_at?: string
          flour_amount_g: number
          id?: string
          profile_id?: string | null
          retained_starter_g: number
          seed_amount_g: number
          target_date: string
          total_build_g: number
          usable_amount_g: number
          water_amount_g: number
        }
        Update: {
          bakery_id?: string
          created_at?: string
          flour_amount_g?: number
          id?: string
          profile_id?: string | null
          retained_starter_g?: number
          seed_amount_g?: number
          target_date?: string
          total_build_g?: number
          usable_amount_g?: number
          water_amount_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "starter_builds_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_builds_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "starter_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      starter_profiles: {
        Row: {
          bakery_id: string
          build_duration_hours: number
          created_at: string
          flour_ratio: number
          id: string
          is_default: boolean
          name: string
          seed_ratio: number
          updated_at: string
          water_ratio: number
        }
        Insert: {
          bakery_id: string
          build_duration_hours?: number
          created_at?: string
          flour_ratio: number
          id?: string
          is_default?: boolean
          name: string
          seed_ratio: number
          updated_at?: string
          water_ratio: number
        }
        Update: {
          bakery_id?: string
          build_duration_hours?: number
          created_at?: string
          flour_ratio?: number
          id?: string
          is_default?: boolean
          name?: string
          seed_ratio?: number
          updated_at?: string
          water_ratio?: number
        }
        Relationships: [
          {
            foreignKeyName: "starter_profiles_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_capacity_rules: {
        Row: {
          id: string
          is_active: boolean
          max_limit: number
          rule_type: string
          storefront_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          max_limit: number
          rule_type: string
          storefront_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          max_limit?: number
          rule_type?: string
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_capacity_rules_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_closed_dates: {
        Row: {
          closed_date: string
          id: string
          reason: string | null
          storefront_id: string
        }
        Insert: {
          closed_date: string
          id?: string
          reason?: string | null
          storefront_id: string
        }
        Update: {
          closed_date?: string
          id?: string
          reason?: string | null
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_closed_dates_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_pickup_windows: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_enabled: boolean
          max_orders_per_window: number | null
          start_time: string
          storefront_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_enabled?: boolean
          max_orders_per_window?: number | null
          start_time: string
          storefront_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          max_orders_per_window?: number | null
          start_time?: string
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_pickup_windows_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_path: string | null
          is_published: boolean
          is_sold_out: boolean
          online_price_cents: number
          public_description: string | null
          public_name: string
          recipe_id: string | null
          storefront_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          is_published?: boolean
          is_sold_out?: boolean
          online_price_cents: number
          public_description?: string | null
          public_name: string
          recipe_id?: string | null
          storefront_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          is_published?: boolean
          is_sold_out?: boolean
          online_price_cents?: number
          public_description?: string | null
          public_name?: string
          recipe_id?: string | null
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_products_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_products_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefronts: {
        Row: {
          bakery_id: string
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          logo_path: string | null
          maximum_daily_orders: number | null
          minimum_lead_time_hours: number
          name: string
          order_cutoff_time: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          bakery_id: string
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          logo_path?: string | null
          maximum_daily_orders?: number | null
          minimum_lead_time_hours?: number
          name: string
          order_cutoff_time?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          logo_path?: string | null
          maximum_daily_orders?: number | null
          minimum_lead_time_hours?: number
          name?: string
          order_cutoff_time?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: true
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      task_execution_logs: {
        Row: {
          action: string | null
          bakery_id: string
          created_at: string
          delay_minutes: number | null
          elapsed_seconds: number | null
          id: string
          reason: string | null
          task_id: string
        }
        Insert: {
          action?: string | null
          bakery_id: string
          created_at?: string
          delay_minutes?: number | null
          elapsed_seconds?: number | null
          id?: string
          reason?: string | null
          task_id: string
        }
        Update: {
          action?: string | null
          bakery_id?: string
          created_at?: string
          delay_minutes?: number | null
          elapsed_seconds?: number | null
          id?: string
          reason?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_execution_logs_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_bakery_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      create_additional_bakery: {
        Args: { bakery_name?: string }
        Returns: string
      }
      create_bakery_invitation: {
        Args: {
          invitation_expires_at: string
          invite_email: string
          invite_role: string
          invite_token_hash: string
          inviter_user_id: string
          target_bakery_id: string
        }
        Returns: {
          accepted_at: string | null
          bakery_id: string
          created_at: string
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          normalized_email: string
          revoked_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bakery_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_default_bakery: { Args: { bakery_name?: string }; Returns: string }
      create_manual_order: {
        Args: {
          p_amount_paid_cents?: number
          p_bakery_id: string
          p_customer_id: string
          p_items_json?: Json
          p_notes?: string
          p_order_id: string
          p_pickup_date: string
          p_pickup_time: string
        }
        Returns: Json
      }
      create_online_order: {
        Args: {
          p_customer_info: Json
          p_fulfillment_info: Json
          p_idempotency_key: string
          p_items_json: Json
          p_slug: string
        }
        Returns: Json
      }
      decline_bakery_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      generate_order_production_tasks: {
        Args: {
          p_bakery_id: string
          p_fulfillment_date: string
          p_order_id: string
        }
        Returns: {
          bakery_id: string
          category: string
          created_at: string
          delay_minutes: number | null
          duration_minutes: number
          flow_id: string | null
          flow_step_id: string | null
          id: string
          order_id: string
          quantity: number
          recipe_id: string | null
          scheduled_at: string
          skip_reason: string | null
          status: string
          title: string
          updated_at: string
          urgency: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "production_tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_order_paid: {
        Args: { p_bakery_id: string; p_order_id: string }
        Returns: Json
      }
      remove_bakery_member: {
        Args: { membership_id: string }
        Returns: undefined
      }
      revoke_bakery_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      set_default_bakery: {
        Args: { target_bakery_id: string }
        Returns: undefined
      }
      transfer_bakery_ownership: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      update_bakery_member_role: {
        Args: { membership_id: string; new_role: string }
        Returns: undefined
      }
      validate_storefront_checkout: {
        Args: { p_cart_json?: Json; p_slug: string; p_target_date: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
