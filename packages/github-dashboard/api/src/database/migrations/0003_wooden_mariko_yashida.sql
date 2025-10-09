CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_repo_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_repository" DROP CONSTRAINT "dashboard_repositories_dashboard_id_github_repo_id_unique";--> statement-breakpoint
ALTER TABLE "dashboard_repository" ADD COLUMN "repository_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_repository" ADD CONSTRAINT "dashboard_repository_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_repository" DROP COLUMN "github_repo_id";--> statement-breakpoint
ALTER TABLE "dashboard_repository" ADD CONSTRAINT "dr_dashboard_id_repository_id_unique" UNIQUE("dashboard_id","repository_id");