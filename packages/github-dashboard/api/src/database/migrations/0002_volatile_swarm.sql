--> statement-breakpoint
DROP TABLE "dashboards" CASCADE;--> statement-breakpoint
DROP TABLE "github_users" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_github_users" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_repositories" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_widgets" CASCADE;--> statement-breakpoint
DROP TABLE "activity_types" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_activity_configs" CASCADE;--> statement-breakpoint
DROP TABLE "tier_types" CASCADE;--> statement-breakpoint
DROP TABLE "clients" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_types" CASCADE;--> statement-breakpoint
DROP TABLE "features" CASCADE;--> statement-breakpoint
DROP TABLE "tier_type_features" CASCADE;--> statement-breakpoint

CREATE TABLE "tier_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tier_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "feature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "feature_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tier_type_feature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_type_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	CONSTRAINT "tier_type_feature_tier_type_id_feature_id_unique" UNIQUE("tier_type_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"client_id" uuid,
	"dashboard_type_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "dashboard_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dashboard_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dashboard_activity_config" (
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
CREATE TABLE "dashboard_github_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"github_user_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_github_user_dashboard_id_github_user_id_unique" UNIQUE("dashboard_id","github_user_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_repository" (
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
CREATE TABLE "github_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_user_id" varchar(50) NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"avatar_url" varchar(500),
	"profile_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "github_user_github_user_id_unique" UNIQUE("github_user_id")
);
--> statement-breakpoint
CREATE TABLE "activity_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "activity_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tier_type_id" uuid NOT NULL,
	"logo_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- SEED DATA
-- Tiers
INSERT INTO public.tier_type (id, code, name, created_at, updated_at) VALUES
    ('f2932a37-d4a4-4047-9b0f-c22ba27a2b4e', 'basic', 'Basic', '2025-10-08 16:14:17.291921', '2025-10-08 16:14:17.291921')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tier_type (id, code, name, created_at, updated_at) VALUES
    ('f2a19665-9ead-4147-96e0-7230802df0bc', 'premium', 'Premium', '2025-10-08 16:14:17.291921', '2025-10-08 16:14:17.291921')
ON CONFLICT (id) DO NOTHING;

-- Features
INSERT INTO public.feature (id, code, name, created_at, updated_at) VALUES
    ('57b5d989-19cc-4915-b043-4f9b3216f384', 'export', 'Export', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.feature (id, code, name, created_at, updated_at) VALUES
    ('645cfad3-c420-4ce7-a50b-262ab302ae44', 'summary', 'Summary Statistics Bar', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.feature (id, code, name, created_at, updated_at) VALUES
    ('9c0837c9-8d73-43b2-aeb1-505308c87535', 'type_chips', 'Dashboard Type Selection Chips', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;

-- Dashboard Types
INSERT INTO public.dashboard_type (id, code, name, created_at, updated_at) VALUES
    ('48bfc042-81aa-4814-9d56-4d0f841bcb92', 'user_activity', 'User Activity', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.dashboard_type (id, code, name, created_at, updated_at) VALUES
    ('79e67172-ff4b-4237-906f-14e7a6c7deb0', 'team_overview', 'Team Overview', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.dashboard_type (id, code, name, created_at, updated_at) VALUES
    ('91fc99b6-05d0-4dad-bba2-2f82ff912f1d', 'project_focus', 'Project Focus', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;

-- Clients
INSERT INTO public.client (id, name, tier_type_id, logo_url, created_at, updated_at)
VALUES ('2667d6c1-89e6-4848-8e12-03cefeeec0c8', 'Candy Corn Labs', 'f2932a37-d4a4-4047-9b0f-c22ba27a2b4e', 'https://cdn-icons-png.flaticon.com/512/3277/3277218.png', '2025-10-08 17:38:18.491243', '2025-10-08 17:38:18.491243')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.client (id, name, tier_type_id, logo_url, created_at, updated_at)
VALUES ('0da1c95b-ac37-4f19-a907-041a458c8e11', 'Haunted Hollow', 'f2a19665-9ead-4147-96e0-7230802df0bc', 'https://cdn-icons-png.flaticon.com/512/685/685859.png', '2025-10-08 17:40:13.396876', '2025-10-08 17:40:13.396876')
ON CONFLICT (id) DO NOTHING;

-- Premium tier gets all features
INSERT INTO public.tier_type_feature (tier_type_id, feature_id)
SELECT
    (SELECT id FROM public.tier_type WHERE code = 'premium'),
    id
FROM public.feature
ON CONFLICT (tier_type_id, feature_id) DO NOTHING;

INSERT INTO public.activity_type (id, code, display_name, created_at, updated_at)
VALUES ('7adbc498-4789-40ec-9be1-1bb3bf408e9f', 'prs_reviewed', 'PRs Reviewed', '2025-10-09 08:45:16.592910', '2025-10-09 08:45:16.592910')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.activity_type (id, code, display_name, created_at, updated_at)
VALUES ('42c3b89d-2897-4109-a5e7-3406b773bbb4', 'prs_created', 'PRs Created', '2025-10-09 08:45:16.592910', '2025-10-09 08:45:16.592910')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.activity_type (id, code, display_name, created_at, updated_at)
VALUES ('dff9302a-d6f0-49d1-9fb3-6414801eab46', 'prs_merged', 'PRs Merged', '2025-10-09 08:45:16.592910', '2025-10-09 08:45:16.592910')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE "tier_type_feature" ADD CONSTRAINT "tier_type_feature_tier_type_id_tier_type_id_fk" FOREIGN KEY ("tier_type_id") REFERENCES "public"."tier_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_type_feature" ADD CONSTRAINT "tier_type_feature_feature_id_feature_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_dashboard_type_id_dashboard_type_id_fk" FOREIGN KEY ("dashboard_type_id") REFERENCES "public"."dashboard_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_activity_config" ADD CONSTRAINT "da_dashboard_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_activity_config" ADD CONSTRAINT "dac_activity_type_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_github_user" ADD CONSTRAINT "dashboard_github_user_dashboard_id_dashboard_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_github_user" ADD CONSTRAINT "dashboard_github_user_github_user_id_github_user_id_fk" FOREIGN KEY ("github_user_id") REFERENCES "public"."github_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_repository" ADD CONSTRAINT "dashboard_repository_dashboard_id_dashboard_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_tier_type_id_tier_type_id_fk" FOREIGN KEY ("tier_type_id") REFERENCES "public"."tier_type"("id") ON DELETE no action ON UPDATE no action;