-- Fix avatar URL for bot user
UPDATE github_users 
SET avatar_url = 'https://avatars.githubusercontent.com/in/276250?v=4' 
WHERE github_username = 'orca-security-us[bot]';
