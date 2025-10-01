-- Update avatar URLs for all users with correct GitHub avatar URLs
UPDATE github_users 
SET avatar_url = 'https://avatars.githubusercontent.com/u/84944842?v=4' 
WHERE github_username = 'kriss-chorus';

UPDATE github_users 
SET avatar_url = 'https://avatars.githubusercontent.com/u/583231?v=4' 
WHERE github_username = 'octocat';

UPDATE github_users 
SET avatar_url = 'https://avatars.githubusercontent.com/u/1024025?v=4' 
WHERE github_username = 'torvalds';

-- Bot user already has correct avatar URL from previous migration
