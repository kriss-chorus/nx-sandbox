-- SEED DATA
-- Tiers
INSERT INTO public.tier_types (id, code, name, created_at, updated_at) VALUES
    ('f2932a37-d4a4-4047-9b0f-c22ba27a2b4e', 'basic', 'Basic', '2025-10-08 16:14:17.291921', '2025-10-08 16:14:17.291921')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tier_types (id, code, name, created_at, updated_at) VALUES
    ('f2a19665-9ead-4147-96e0-7230802df0bc', 'premium', 'Premium', '2025-10-08 16:14:17.291921', '2025-10-08 16:14:17.291921')
ON CONFLICT (id) DO NOTHING;

-- Features
INSERT INTO public.features (id, code, name, created_at, updated_at) VALUES
    ('57b5d989-19cc-4915-b043-4f9b3216f384', 'export', 'Export', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.features (id, code, name, created_at, updated_at) VALUES
    ('645cfad3-c420-4ce7-a50b-262ab302ae44', 'summary', 'Summary Statistics Bar', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.features (id, code, name, created_at, updated_at) VALUES
    ('9c0837c9-8d73-43b2-aeb1-505308c87535', 'type_chips', 'Dashboard Type Selection Chips', '2025-10-08 16:37:55.181064', null)
ON CONFLICT (id) DO NOTHING;

-- Dashboard Types
INSERT INTO public.dashboard_types (id, code, name, layout_config, created_at, updated_at) VALUES
    ('48bfc042-81aa-4814-9d56-4d0f841bcb92', 'user_activity', 'User Activity', '{}', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.dashboard_types (id, code, name, layout_config, created_at, updated_at) VALUES
    ('79e67172-ff4b-4237-906f-14e7a6c7deb0', 'team_overview', 'Team Overview', '{}', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.dashboard_types (id, code, name, layout_config, created_at, updated_at) VALUES
    ('91fc99b6-05d0-4dad-bba2-2f82ff912f1d', 'project_focus', 'Project Focus', '{}', '2025-10-08 16:42:14.836477', '2025-10-08 16:42:14.836477')
ON CONFLICT (id) DO NOTHING;

-- Clients
INSERT INTO public.clients (id, name, tier_type_id, icon_url, logo_url, created_at, updated_at)
VALUES ('2667d6c1-89e6-4848-8e12-03cefeeec0c8', 'Candy Corn Labs', 'f2932a37-d4a4-4047-9b0f-c22ba27a2b4e', null, 'https://cdn-icons-png.flaticon.com/512/3277/3277218.png', '2025-10-08 17:38:18.491243', '2025-10-08 17:38:18.491243')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.clients (id, name, tier_type_id, icon_url, logo_url, created_at, updated_at)
VALUES ('0da1c95b-ac37-4f19-a907-041a458c8e11', 'Haunted Hollow', 'f2a19665-9ead-4147-96e0-7230802df0bc', null, 'https://cdn-icons-png.flaticon.com/512/685/685859.png', '2025-10-08 17:40:13.396876', '2025-10-08 17:40:13.396876')
ON CONFLICT (id) DO NOTHING;

-- Premium tier gets all features
INSERT INTO public.tier_type_features (tier_type_id, feature_id)
SELECT
    (SELECT id FROM public.tier_types WHERE code = 'premium'),
    id
FROM public.features
ON CONFLICT (tier_type_id, feature_id) DO NOTHING;

ALTER TABLE "tier_types" DROP COLUMN "features";
ALTER TABLE "clients" DROP COLUMN "icon_url";
ALTER TABLE "dashboard_types" DROP COLUMN "layout_config";
