const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const Airtable = require('airtable');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ✅ Serve static HTML
app.use(express.static(path.join(__dirname, '../static')));

// ✅ Mock Mode toggle
const MOCK_MODE = true;

// ✅ Environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'mock-key';
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || 'mock-key';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || 'mock-secret';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'mock-key';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'mock-base';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'PNR_Records';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
let userSessions = {};

app.post('/api/process', async (req, res) => {
  const userQuery = req.body.query;
  const sessionId = req.body.sessionId || 'default';

  try {
    let origin = 'DEL', destination = 'BOM', travelType = 'Duty', date = 'tomorrow';

    if (!MOCK_MODE) {
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/nlp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({ text: userQuery })
      });
      const nlpData = await deepseekResponse.json();
      origin = nlpData.origin || origin;
      destination = nlpData.destination || destination;
      travelType = nlpData.travelType || travelType;
      date = nlpData.date || date;
    }

    // Clarification
    if (!userSessions[sessionId]?.timePreference &&
        !userQuery.toLowerCase().includes('morning') &&
        !userQuery.toLowerCase().includes('evening')) {
      userSessions[sessionId] = { origin, destination, travelType, date };
      return res.json({ type: 'clarification', message: "Do you prefer morning or evening flights?" });
    }

    if (userQuery.toLowerCase().includes('morning') || userQuery.toLowerCase().includes('evening')) {
      userSessions[sessionId].timePreference = userQuery.toLowerCase();
    }

    // Mock flight options
    if (userQuery.toLowerCase().includes('book')) {
      const options = [
        { id: 1, airline: 'IndiGo', flight: '6E123', time: '07:00 AM' },
        { id: 2, airline: 'Air India', flight: 'AI456', time: '09:30 AM' },
        { id: 3, airline: 'Vistara', flight: 'UK789', time: '06:00 PM' }
      ];
      return res.json({ type: 'options', options });
    }

    if (userQuery.toLowerCase().includes('option')) {
      const pnrId = 'PNR-' + Math.floor(Math.random() * 100000);
      return res.json({ type: 'confirmation', message: `Booking confirmed with PNR: ${pnrId}` });
    }

    res.json({ type: 'message', message: 'Please start with "Book duty travel..."' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
