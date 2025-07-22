import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API to get a single meeting by id or meetingId
app.get('/api/meetings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Try to find by meetingId or id
    const meeting = await db.collection('meetings').findOne({ $or: [ { meetingId: id }, { id } ] });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

const uri = 'mongodb+srv://rohithramanagdg:erfF7r0WMHTx8sKr@cluster0.zwossjq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('Cache_and_cook');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}

connectDB();

// API to get user profile by email
app.get('/api/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const profile = { ...req.body };
    console.log('Received profile POST:', profile);

    if (!profile.email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Remove _id if present to avoid MongoDB immutable field error
    if (profile._id) {
      delete profile._id;
    }

    const result = await db.collection('users').updateOne(
      { email: profile.email },
      { $set: profile },
      { upsert: true }
    );

    const updatedProfile = await db.collection('users').findOne({ email: profile.email });

    res.json({ message: 'Profile saved', result, profile: updatedProfile });
  } catch (err) {
    console.error('Error in /api/profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// API to create a meeting
// API to create a meeting (store userId, meetingId)
app.post('/api/meetings', async (req, res) => {
  try {
    const meeting = req.body;
    if (!meeting.id || !meeting.createdBy) {
      return res.status(400).json({ message: 'Meeting ID and createdBy (userId) are required' });
    }
    // Store meeting with userId and meetingId
    const result = await db.collection('meetings').insertOne({
      ...meeting,
      userId: meeting.createdBy, // for clarity
      meetingId: meeting.id
    });
    res.json({ message: 'Meeting created', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await db.collection('meetings').find({}).toArray();
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to create feedback
// API to create feedback (store meetingId, userId, responses)
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    if (!feedback.meetingId || !feedback.userId || !feedback.responses) {
      return res.status(400).json({ message: 'meetingId, userId, and responses are required' });
    }
    // Store feedback under meetingId and userId
    const result = await db.collection('feedback').insertOne({
      meetingId: feedback.meetingId,
      userId: feedback.userId,
      responses: feedback.responses,
      createdAt: new Date()
    });
    res.json({ message: 'Feedback saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await db.collection('feedback').find({}).toArray();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to create AI insight
app.post('/api/ai-insights', async (req, res) => {
  try {
    const insight = req.body;
    const result = await db.collection('ai_insights').insertOne(insight);
    res.json({ message: 'AI Insight saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API to get AI insights
app.get('/api/ai-insights', async (req, res) => {
  try {
    const insights = await db.collection('ai_insights').find({}).toArray();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- TEAM CRUD ENDPOINTS ---
import { TEAM_COLLECTION, validateTeam } from './team.schema.js';
import { ObjectId } from 'mongodb';

// Create Team
app.post('/api/teams', async (req, res) => {
  const team = req.body;
  const validationError = validateTeam(team);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  try {
    const result = await db.collection(TEAM_COLLECTION).insertOne(team);
    res.json({ message: 'Team created', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get All Teams
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await db.collection(TEAM_COLLECTION).find({}).toArray();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Team by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const team = await db.collection(TEAM_COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});// Get profile by email
app.get('/api/profile/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const profile = await db.collection(PROFILE_COLLECTION).findOne({ email });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile by email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update Team by ID
app.put('/api/teams/:id', async (req, res) => {
  const team = req.body;
  const validationError = validateTeam(team);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  try {
    const id = req.params.id;
    const result = await db.collection(TEAM_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: team }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team updated', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete Team by ID
app.delete('/api/teams/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.collection(TEAM_COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});


app.post('/api/teams', async (req, res) => {
  const team = req.body;
  const validationError = validateTeam(team);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  try {
    const result = await db.collection(TEAM_COLLECTION).insertOne(team);
    res.json({ message: 'Team created', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- BEGIN: Question Editing Endpoints ---
// POST /api/questions
app.post('/api/questions', async (req, res) => {
  const { meetId, userId, questions } = req.body;
  if (!meetId || !userId || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'meetId, userId, and questions[] required' });
  }
  try {
    const result = await db.collection('questions').updateOne(
      { meetId, userId },
      { $set: { questions } },
      { upsert: true }
    );
    res.json({ message: 'Questions saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/questions/:meetId/:userId
app.get('/api/questions/:meetId/:userId', async (req, res) => {
  const { meetId, userId } = req.params;
  try {
    const doc = await db.collection('questions').findOne({ meetId, userId });
    res.json(doc ? doc.questions : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// --- END: Question Editing Endpoints ---
