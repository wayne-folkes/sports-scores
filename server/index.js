'use strict';

const express = require('express');
const cors = require('cors');

const scoresRouter = require('./routes/scores');
const teamsRouter = require('./routes/teams');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/scores', scoresRouter);
app.use('/api/teams', teamsRouter);

app.listen(PORT, () => {
  console.log(`Sports scores server running on port ${PORT}`);
});

module.exports = app;
