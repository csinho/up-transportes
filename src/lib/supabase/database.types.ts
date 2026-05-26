/** Gerado via Supabase MCP — projeto transpo-erp (tmjbzmjnqkgjwwkrxuxh) */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      motoristas: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      produtos: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          is_super_admin: boolean;
          nome: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          is_super_admin?: boolean;
          nome?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_super_admin?: boolean;
          nome?: string | null;
        };
        Relationships: [];
      };
      transportadoras: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          nome_fantasia: string;
          razao_social: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          nome_fantasia: string;
          razao_social: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          nome_fantasia?: string;
          razao_social?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_transportadoras: {
        Row: {
          created_at: string;
          role: string;
          transportadora_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: string;
          transportadora_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          transportadora_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      veiculos: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      viagem_eventos: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          viagem_id: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          viagem_id: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          viagem_id?: string;
        };
        Relationships: [];
      };
      viagem_localizacoes: {
        Row: {
          created_at: string;
          heading: number | null;
          id: string;
          latitude: number;
          longitude: number;
          motorista_id: string | null;
          precisao_metros: number | null;
          registrado_em: string;
          transportadora_id: string;
          velocidade_kmh: number | null;
          viagem_id: string;
        };
        Insert: {
          created_at?: string;
          heading?: number | null;
          id?: string;
          latitude: number;
          longitude: number;
          motorista_id?: string | null;
          precisao_metros?: number | null;
          registrado_em: string;
          transportadora_id: string;
          velocidade_kmh?: number | null;
          viagem_id: string;
        };
        Update: {
          created_at?: string;
          heading?: number | null;
          id?: string;
          latitude?: number;
          longitude?: number;
          motorista_id?: string | null;
          precisao_metros?: number | null;
          registrado_em?: string;
          transportadora_id?: string;
          velocidade_kmh?: number | null;
          viagem_id?: string;
        };
        Relationships: [];
      };
      viagem_ocorrencias: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          transportadora_id: string;
          updated_at: string;
          viagem_id: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id: string;
          updated_at?: string;
          viagem_id: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          transportadora_id?: string;
          updated_at?: string;
          viagem_id?: string;
        };
        Relationships: [];
      };
      viagens: {
        Row: {
          created_at: string;
          dados: Json;
          id: string;
          numero_viagem: number;
          status: string;
          transportadora_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dados?: Json;
          id?: string;
          numero_viagem: number;
          status: string;
          transportadora_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dados?: Json;
          id?: string;
          numero_viagem?: number;
          status?: string;
          transportadora_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback_anexos: {
        Row: {
          id: string;
          feedback_id: string;
          storage_path: string;
          nome_arquivo: string;
          mime_type: string | null;
          tamanho_bytes: number | null;
          tipo: string;
          duracao_segundos: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          storage_path: string;
          nome_arquivo: string;
          mime_type?: string | null;
          tamanho_bytes?: number | null;
          tipo: string;
          duracao_segundos?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          storage_path?: string;
          nome_arquivo?: string;
          mime_type?: string | null;
          tamanho_bytes?: number | null;
          tipo?: string;
          duracao_segundos?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback_reports: {
        Row: {
          id: string;
          transportadora_id: string;
          user_id: string;
          user_email: string | null;
          user_nome: string | null;
          titulo: string;
          descricao: string;
          impacto: string;
          status: string;
          pagina_url: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transportadora_id: string;
          user_id: string;
          user_email?: string | null;
          user_nome?: string | null;
          titulo: string;
          descricao: string;
          impacto: string;
          status?: string;
          pagina_url?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transportadora_id?: string;
          user_id?: string;
          user_email?: string | null;
          user_nome?: string | null;
          titulo?: string;
          descricao?: string;
          impacto?: string;
          status?: string;
          pagina_url?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_platform_feedback: { Args: { p_id: string }; Returns: Json };
      list_platform_feedback: {
        Args: { p_transportadora_id: string };
        Returns: {
          id: string;
          titulo: string;
          impacto: string;
          status: string;
          user_email: string | null;
          user_nome: string | null;
          total_anexos: number;
          created_at: string;
        }[];
      };
      update_platform_feedback_status: {
        Args: { p_id: string; p_status: string };
        Returns: undefined;
      };
      link_my_motorista: {
        Args: { p_cpf: string };
        Returns: { motorista_id: string; transportadora_id: string; nome: string }[];
      };
      link_my_transportadora: { Args: { p_role?: string; tid: string }; Returns: undefined };
      user_has_tenant: { Args: { tid: string }; Returns: boolean };
      user_transportadora_ids: { Args: Record<string, never>; Returns: string[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
