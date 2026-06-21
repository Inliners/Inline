// Auto-generated types matching schema.sql
// Re-generate with: npx supabase gen types typescript --project-id <your-project-id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          color: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      notes: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          page_url: string
          domain: string
          page_title: string | null
          content: string
          type: 'text' | 'canvas' | 'ai-summary'
          color: string
          pos_x: number
          pos_y: number
          width: number
          height: number
          tags: string[]
          risk_score: number
          is_pinned: boolean
          page_context: string | null
          embedding: number[] | null
          lat: number | null
          lng: number | null
          anchor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      anchors: {
        Row: {
          id: string
          note_id: string
          user_id: string
          fingerprint: Json
          page_url: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['anchors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['anchors']['Insert']>
      }
      drawings: {
        Row: {
          id: string
          user_id: string
          note_id: string | null
          page_url: string
          domain: string
          paths: Json
          canvas_meta: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['drawings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['drawings']['Insert']>
      }
      extractions: {
        Row: {
          id: string
          user_id: string
          note_id: string | null
          page_url: string
          domain: string
          source_text: string
          schema_type: string
          data: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['extractions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['extractions']['Insert']>
      }
      workspace_embeddings: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          source_type: 'note' | 'document' | 'page' | 'recap' | 'annotation'
          source_id: string
          page_url: string | null
          page_title: string | null
          domain: string | null
          chunk_text: string
          chunk_index: number
          metadata: Json
          embedding: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspace_embeddings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspace_embeddings']['Insert']>
      }
      spatial_entities: {
        Row: {
          id: string
          user_id: string
          note_id: string | null
          extraction_id: string | null
          raw_address: string
          display_name: string | null
          lat: number
          lng: number
          source_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['spatial_entities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['spatial_entities']['Insert']>
      }
    }
    Functions: {
      match_workspace_embeddings: {
        Args: {
          query_embedding: string
          p_workspace_id?: string | null
          match_count?: number
          match_threshold?: number
        }
        Returns: {
          id: string
          source_type: string
          source_id: string
          page_url: string | null
          page_title: string | null
          domain: string | null
          chunk_text: string
          chunk_index: number
          metadata: Json
          similarity: number
        }[]
      }
      match_notes: {
        Args: { query_embedding: number[]; match_count?: number; match_threshold?: number }
        Returns: { id: string; content: string; page_url: string; domain: string; similarity: number }[]
      }
      notes_within_radius: {
        Args: { center_lat: number; center_lng: number; radius_m?: number }
        Returns: { id: string; note_id: string; raw_address: string; lat: number; lng: number; distance_m: number }[]
      }
    }
  }
}
