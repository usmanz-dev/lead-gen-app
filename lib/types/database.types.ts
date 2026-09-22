/**
 * Hand-maintained to match supabase/migrations/*.sql exactly, in the same
 * shape `supabase gen types typescript` produces — so it's a drop-in
 * replacement once you run `supabase gen types typescript --linked > lib/types/database.types.ts`
 * against the live project.
 *
 * Check-constrained text columns (role, status, plan, etc.) are typed as
 * literal unions here rather than plain `string` — stronger than what the
 * CLI generator infers (it can't see CHECK constraints), but still exactly
 * true to the schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TeamMemberRole = "admin" | "member";
export type SubscriptionPlan = "starter" | "growth" | "pro" | "agency";
export type SubscriptionStatus =
  "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type SenderProvider = "gmail" | "smtp";
export type WarmupStatus = "not_started" | "warming_up" | "completed";
export type SearchStatus = "pending" | "running" | "completed" | "failed";
export type EmailValidationStatus = "valid" | "risky" | "invalid" | "unknown";
export type LeadStatus = "new" | "contacted" | "interested" | "closed";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type CampaignLeadEmailStatus =
  | "queued"
  | "sent"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "unsubscribed";
export type RankTrackerSchedule = "daily" | "weekly" | "biweekly" | "monthly";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: TeamMemberRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: TeamMemberRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: TeamMemberRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          leads_limit: number;
          emails_limit: number;
          leads_used_this_cycle: number;
          emails_used_this_cycle: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          leads_limit?: number;
          emails_limit?: number;
          leads_used_this_cycle?: number;
          emails_used_this_cycle?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          leads_limit?: number;
          emails_limit?: number;
          leads_used_this_cycle?: number;
          emails_used_this_cycle?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sender_accounts: {
        Row: {
          id: string;
          organization_id: string;
          email_address: string;
          provider: SenderProvider;
          encrypted_credentials: string | null;
          warmup_status: WarmupStatus;
          daily_send_count: number;
          daily_send_limit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email_address: string;
          provider?: SenderProvider;
          encrypted_credentials?: string | null;
          warmup_status?: WarmupStatus;
          daily_send_count?: number;
          daily_send_limit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email_address?: string;
          provider?: SenderProvider;
          encrypted_credentials?: string | null;
          warmup_status?: WarmupStatus;
          daily_send_count?: number;
          daily_send_limit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sender_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      searches: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          keyword: string;
          location: string;
          filters: Json;
          status: SearchStatus;
          error_message: string | null;
          leads_found: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          keyword: string;
          location: string;
          filters?: Json;
          status?: SearchStatus;
          error_message?: string | null;
          leads_found?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by?: string | null;
          keyword?: string;
          location?: string;
          filters?: Json;
          status?: SearchStatus;
          error_message?: string | null;
          leads_found?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "searches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "searches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          search_id: string | null;
          name: string;
          category: string | null;
          phone: string | null;
          address: string | null;
          rating: number | null;
          review_count: number;
          website_url: string | null;
          google_maps_url: string | null;
          business_hours: Json | null;
          email: string | null;
          email_validation_status: EmailValidationStatus;
          social_links: Json;
          opportunity_score: number | null;
          opportunity_score_breakdown: Json;
          status: LeadStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          search_id?: string | null;
          name: string;
          category?: string | null;
          phone?: string | null;
          address?: string | null;
          rating?: number | null;
          review_count?: number;
          website_url?: string | null;
          google_maps_url?: string | null;
          business_hours?: Json | null;
          email?: string | null;
          email_validation_status?: EmailValidationStatus;
          social_links?: Json;
          opportunity_score?: number | null;
          opportunity_score_breakdown?: Json;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          search_id?: string | null;
          name?: string;
          category?: string | null;
          phone?: string | null;
          address?: string | null;
          rating?: number | null;
          review_count?: number;
          website_url?: string | null;
          google_maps_url?: string | null;
          business_hours?: Json | null;
          email?: string | null;
          email_validation_status?: EmailValidationStatus;
          social_links?: Json;
          opportunity_score?: number | null;
          opportunity_score_breakdown?: Json;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_search_id_fkey";
            columns: ["search_id"];
            isOneToOne: false;
            referencedRelation: "searches";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          sender_account_id: string | null;
          name: string;
          status: CampaignStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          sender_account_id?: string | null;
          name: string;
          status?: CampaignStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by?: string | null;
          sender_account_id?: string | null;
          name?: string;
          status?: CampaignStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_sender_account_id_fkey";
            columns: ["sender_account_id"];
            isOneToOne: false;
            referencedRelation: "sender_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_leads: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          email_status: CampaignLeadEmailStatus;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          replied_at: string | null;
          bounced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          email_status?: CampaignLeadEmailStatus;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          lead_id?: string;
          email_status?: CampaignLeadEmailStatus;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_emails: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          subject: string;
          body: string;
          ai_generated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          subject: string;
          body: string;
          ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          lead_id?: string;
          subject?: string;
          body?: string;
          ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_emails_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_emails_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      rank_tracker_jobs: {
        Row: {
          id: string;
          organization_id: string;
          business_name: string;
          google_maps_url: string | null;
          keyword: string;
          grid_points: Json;
          schedule: RankTrackerSchedule;
          results_history: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          business_name: string;
          google_maps_url?: string | null;
          keyword: string;
          grid_points?: Json;
          schedule?: RankTrackerSchedule;
          results_history?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          business_name?: string;
          google_maps_url?: string | null;
          keyword?: string;
          grid_points?: Json;
          schedule?: RankTrackerSchedule;
          results_history?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rank_tracker_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          created_by: string | null;
          pdf_url: string;
          branding_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          created_by?: string | null;
          pdf_url: string;
          branding_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          created_by?: string | null;
          pdf_url?: string;
          branding_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      unsubscribes: {
        Row: {
          id: string;
          organization_id: string;
          campaign_id: string | null;
          email: string;
          unsubscribed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          campaign_id?: string | null;
          email: string;
          unsubscribed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          campaign_id?: string | null;
          email?: string;
          unsubscribed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unsubscribes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "unsubscribes_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          feature: string;
          period_month: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          feature: string;
          period_month: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          feature?: string;
          period_month?: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      is_org_admin: {
        Args: { org_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
