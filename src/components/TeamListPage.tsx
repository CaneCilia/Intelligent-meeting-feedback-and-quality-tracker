import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Member {
  name: string;
  role: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  members: Member[];
}

export default function TeamListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        setLoading(false);
      });
  }, []);

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Typography variant="h4" gutterBottom>Teams</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : teams.length === 0 ? (
        <Typography>No teams found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {teams.map(team => (
            <Grid item xs={12} md={6} key={team._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{team.name}</Typography>
                  <Typography variant="subtitle1" gutterBottom>Members:</Typography>
                  <ul>
                    {team.members.map((m, idx) => (
                      <li key={idx}>{m.name} - {m.role} - {m.email}</li>
                    ))}
                  </ul>
                  <Button variant="outlined" onClick={() => navigate(`/teams/edit/${team._id}`)} sx={{ mt: 1 }}>Edit</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
