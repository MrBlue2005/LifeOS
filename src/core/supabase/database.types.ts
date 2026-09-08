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
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
