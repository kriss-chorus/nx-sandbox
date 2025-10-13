import { Add, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';

import { GitHubUser } from '../../../../../types/github';

interface UserSectionProps {
  users: GitHubUser[];
  onUsersChange: (users: GitHubUser[]) => void;
}

export function UserSection({
  users,
  onUsersChange
}: UserSectionProps) {
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');

  const addUserFromInput = () => {
    const raw = selectedUserToAdd.trim();
    if (!raw) return;
    const username = raw.replace(/^@/, '');
    if (!users.find(u => (u as GitHubUser).login === username)) {
      const newUser = {
        id: Date.now(),
        login: username,
        name: username,
        avatar_url: `https://github.com/${username}.png`,
        html_url: `https://github.com/${username}`,
        public_repos: 0,
        followers: 0,
        following: 0,
        public_gists: 0,
        created_at: '',
        updated_at: ''
      } as GitHubUser;
      onUsersChange([...users, newUser]);
    }
    setSelectedUserToAdd('');
  };

  const handleAddUser = () => {
    addUserFromInput();
  };

  const handleRemoveUser = (userLogin: string) => {
    onUsersChange(users.filter(u => (u as GitHubUser).login !== userLogin));
  };

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Members
          </Typography>
          
          <Box display="flex" gap={2} mb={2}>
            <TextField
              fullWidth
              label="GitHub Username"
              value={selectedUserToAdd}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedUserToAdd(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUserFromInput();
                }
              }}
              placeholder="e.g., octocat"
              helperText="Press Enter to add"
            />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddUser}
              disabled={!selectedUserToAdd.trim()}
            >
              Add
            </Button>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {users.length > 0 && (
              users.map(user => (
                <Chip
                  key={(user as GitHubUser).login}
                  label={(user as GitHubUser).name || (user as GitHubUser).login}
                  onDelete={() => handleRemoveUser((user as GitHubUser).login)}
                  deleteIcon={<Delete />}
                />
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
