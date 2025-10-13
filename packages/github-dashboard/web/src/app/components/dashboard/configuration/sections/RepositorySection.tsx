import { Add, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';

interface RepositorySectionProps {
  repositories: string[];
  onRepositoriesChange: (repositories: string[]) => void;
  organizationRepos?: Array<{ full_name: string }>;
}

export function RepositorySection({
  repositories,
  onRepositoriesChange,
  organizationRepos = []
}: RepositorySectionProps) {
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState<string>('');
  const hasOrgRepos = (organizationRepos?.length ?? 0) > 0;

  const addRepoFromInput = () => {
    const value = selectedRepoToAdd.trim();
    if (!value) return;
    // Minimal owner/repo validation when free text
    const isValid = hasOrgRepos || /.+\/.+/.test(value);
    if (!isValid) return;
    if (!repositories.includes(value)) {
      onRepositoriesChange([...repositories, value]);
    }
    setSelectedRepoToAdd('');
  };

  const handleAddRepository = () => {
    addRepoFromInput();
  };

  const handleRemoveRepository = (repo: string) => {
    onRepositoriesChange(repositories.filter(r => r !== repo));
  };

  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Repositories
          </Typography>
          
          <Box display="flex" gap={2} mb={2}>
            {hasOrgRepos ? (
              <FormControl fullWidth>
                <InputLabel>Add Repository</InputLabel>
                <Select
                  value={selectedRepoToAdd}
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => setSelectedRepoToAdd(e.target.value as string)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        zIndex: 9999
                      }
                    }
                  }}
                >
                  {(organizationRepos || [])
                    .filter(repo => !repositories.includes(repo.full_name))
                    .map(repo => (
                      <MenuItem key={repo.full_name} value={repo.full_name}>
                        {repo.full_name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label="Repository (owner/name)"
                placeholder="e.g., vercel/next.js"
                value={selectedRepoToAdd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRepoToAdd(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRepoFromInput();
                  }
                }}
                helperText="Press Enter to add"
              />
            )}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddRepository}
              disabled={!selectedRepoToAdd}
            >
              Add
            </Button>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {repositories.map(repo => (
              <Chip
                key={repo}
                label={repo}
                onDelete={() => handleRemoveRepository(repo)}
                deleteIcon={<Delete />}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
