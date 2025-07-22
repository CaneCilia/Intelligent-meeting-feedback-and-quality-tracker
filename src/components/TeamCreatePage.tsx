import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Member {
  name: string;
  role: string;
  email: string;
}

export default function TeamCreatePage() {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<Member[]>([{ name: '', role: '', email: '' }]);
  const [errors, setErrors] = useState<string>('');
  const navigate = useNavigate();

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([...members, { name: '', role: '', email: '' }]);
  };

  const validate = () => {
    if (!teamName.trim()) return 'Team name is required.';
    for (const m of members) {
      if (!m.name.trim()) return 'Each member must have a name.';
      if (!m.role.trim()) return 'Each member must have a role.';
      if (!m.email.trim()) return 'Each member must have an email.';
      if (!/^\S+@\S+\.\S+$/.test(m.email)) return `Invalid email format: ${m.email}`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrors(validationError);
      return;
    }

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, members }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors(data.message || 'Failed to create team.');
        return;
      }

      navigate('/teams');
    } catch (error) {
      setErrors('Server error. Please try again later.');
    }
  };

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Card sx={{ boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create Team
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Team Name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Typography variant="subtitle1" mt={2} gutterBottom>
              Team Members
            </Typography>

            <Grid container spacing={2}>
              {members.map((member, idx) => (
                <Grid item xs={12} key={idx}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      background: '#f9fafc',
                      boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                      borderRadius: 2,
                    }}
                  >
                    <TextField
                      label="Name"
                      value={member.name}
                      onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                      required
                      sx={{ flex: 1, minWidth: '150px' }}
                    />
                    <TextField
                      label="Role"
                      value={member.role}
                      onChange={e => handleMemberChange(idx, 'role', e.target.value)}
                      required
                      sx={{ flex: 1, minWidth: '150px' }}
                    />
                    <TextField
                      label="Email"
                      value={member.email}
                      onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                      required
                      sx={{ flex: 1, minWidth: '200px' }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addMember}
              sx={{ mt: 2 }}
            >
              Add Member
            </Button>

            {errors && (
              <Typography color="error" mt={2}>
                {errors}
              </Typography>
            )}

            <Box mt={3}>
              <Button type="submit" variant="contained" color="primary">
                Create Team
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
