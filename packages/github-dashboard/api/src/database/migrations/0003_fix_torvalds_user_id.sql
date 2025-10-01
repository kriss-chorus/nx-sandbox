-- Fix torvalds user ID and update avatar URL to use GitHub user ID
UPDATE github_users 
SET github_user_id = '1024025',
    avatar_url = 'https://avatars.githubusercontent.com/u/1024025?v=4'
WHERE github_username = 'torvalds';
