CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"client_id" uuid,
	"dashboard_type_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "dashboards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "github_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_user_id" varchar(50) NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"avatar_url" varchar(500),
	"profile_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "github_users_github_user_id_unique" UNIQUE("github_user_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_github_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"github_user_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_github_users_dashboard_id_github_user_id_unique" UNIQUE("dashboard_id","github_user_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"github_repo_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_repositories_dashboard_id_github_repo_id_unique" UNIQUE("dashboard_id","github_repo_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"widget_type" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"is_visible" boolean DEFAULT true,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "activity_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dashboard_activity_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"activity_type_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true,
	"date_range_start" timestamp with time zone,
	"date_range_end" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "dac_dash_act_unique" UNIQUE("dashboard_id","activity_type_id")
);
--> statement-breakpoint
CREATE TABLE "tier_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tier_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tier_type_id" uuid NOT NULL,
	"icon_url" varchar(500),
	"logo_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dashboard_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"layout_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "features_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tier_type_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_type_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	CONSTRAINT "tier_type_features_tier_type_id_feature_id_unique" UNIQUE("tier_type_id","feature_id")
);
--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_dashboard_type_id_dashboard_types_id_fk" FOREIGN KEY ("dashboard_type_id") REFERENCES "public"."dashboard_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_github_users" ADD CONSTRAINT "dashboard_github_users_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_github_users" ADD CONSTRAINT "dashboard_github_users_github_user_id_github_users_id_fk" FOREIGN KEY ("github_user_id") REFERENCES "public"."github_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_repositories" ADD CONSTRAINT "dashboard_repositories_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_activity_configs" ADD CONSTRAINT "da_dashboard_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_activity_configs" ADD CONSTRAINT "dac_activity_type_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tier_type_id_tier_types_id_fk" FOREIGN KEY ("tier_type_id") REFERENCES "public"."tier_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_type_features" ADD CONSTRAINT "tier_type_features_tier_type_id_tier_types_id_fk" FOREIGN KEY ("tier_type_id") REFERENCES "public"."tier_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_type_features" ADD CONSTRAINT "tier_type_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;