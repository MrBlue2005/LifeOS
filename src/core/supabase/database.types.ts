export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      buy_later_items: {
        Row: {
          created_at: string;
          currency: string | null;
          current_price: string | null;
          id: string;
          name: string;
          note: string | null;
          product_url: string | null;
          reconsider_at: string;
          resolved_at: string | null;
          status: "considering" | "purchased" | "dismissed";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string | null;
          current_price?: string | null;
          id?: string;
          name: string;
          note?: string | null;
          product_url?: string | null;
          reconsider_at: string;
          resolved_at?: string | null;
          status?: "considering" | "purchased" | "dismissed";
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          currency?: string | null;
          current_price?: string | null;
          id?: string;
          name?: string;
          note?: string | null;
          product_url?: string | null;
          reconsider_at?: string;
          resolved_at?: string | null;
          status?: "considering" | "purchased" | "dismissed";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      buy_later_notification_preferences: {
        Row: {
          created_at: string;
          include_item_name: boolean;
          push_enabled: boolean;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          include_item_name?: boolean;
          push_enabled?: boolean;
          timezone: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          include_item_name?: boolean;
          push_enabled?: boolean;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      buy_later_push_subscriptions: {
        Row: {
          active: boolean;
          auth: string;
          created_at: string;
          endpoint: string;
          expiration_time: string | null;
          id: string;
          p256dh: string;
          revoked_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          auth: string;
          created_at?: string;
          endpoint: string;
          expiration_time?: string | null;
          id?: string;
          p256dh: string;
          revoked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          active?: boolean;
          auth?: string;
          created_at?: string;
          endpoint?: string;
          expiration_time?: string | null;
          id?: string;
          p256dh?: string;
          revoked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      buy_later_reminder_deliveries: {
        Row: {
          attempted_at: string | null;
          channel: "web_push";
          created_at: string;
          failed_at: string | null;
          id: string;
          item_id: string;
          reconsider_at: string;
          revoked_at: string | null;
          sent_at: string | null;
          state: "claimed" | "sent" | "failed" | "revoked";
          subscription_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempted_at?: string | null;
          channel?: "web_push";
          created_at?: string;
          failed_at?: string | null;
          id?: string;
          item_id: string;
          reconsider_at: string;
          revoked_at?: string | null;
          sent_at?: string | null;
          state?: "claimed" | "sent" | "failed" | "revoked";
          subscription_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempted_at?: string | null;
          channel?: "web_push";
          created_at?: string;
          failed_at?: string | null;
          id?: string;
          item_id?: string;
          reconsider_at?: string;
          revoked_at?: string | null;
          sent_at?: string | null;
          state?: "claimed" | "sent" | "failed" | "revoked";
          subscription_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "buy_later_reminder_deliveries_user_item_fkey";
            columns: ["user_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "buy_later_items";
            referencedColumns: ["user_id", "id"];
          },
          {
            foreignKeyName: "buy_later_reminder_deliveries_user_subscription_fkey";
            columns: ["user_id", "subscription_id"];
            isOneToOne: false;
            referencedRelation: "buy_later_push_subscriptions";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      find_it_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          location_id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location_id: string;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location_id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "find_it_items_user_location_fkey";
            columns: ["user_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "find_it_locations";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      find_it_locations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "find_it_locations_user_parent_fkey";
            columns: ["user_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "find_it_locations";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      claim_buy_later_due_reminders: {
        Args: {
          run_at: string;
          rollout_date: string;
          max_users: number;
          max_items_per_user: number;
          max_pushes: number;
        };
        Returns: {
          delivery_id: string;
          user_id: string;
          item_id: string;
          item_name: string;
          reconsider_at: string;
          subscription_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          include_item_name: boolean;
        }[];
      };
      disable_buy_later_push_reminders: {
        Args: { subscription_endpoint?: string | null };
        Returns: undefined;
      };
      enable_buy_later_push_reminders: {
        Args: {
          preference_timezone: string;
          preference_include_item_name: boolean;
          subscription_endpoint: string;
          subscription_p256dh: string;
          subscription_auth: string;
          subscription_expiration_time?: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
