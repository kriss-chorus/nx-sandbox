CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dashboard_github_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "dashboard_github_users_dashboard_id_github_username_unique" UNIQUE("dashboard_id","github_username")
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
ALTER TABLE "dashboard_github_users" ADD CONSTRAINT "dashboard_github_users_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_repositories" ADD CONSTRAINT "dashboard_repositories_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;