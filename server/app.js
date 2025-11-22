
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Serve static HTML
app.use(express.static(path.join(__dirname, '../static')));

const MOCK_MODE = true;
let userSessions = {};

app.post('/api/process', async (req, res) => {
  const userQuery = req.body.query.toLowerCase();
  const sessionId = req.body.sessionId || 'default';

  try {
    // Initialize session
    if (!userSessions[sessionId]) {
      userSessions[sessionId] = { travelType: null, dependents: [] };
    }

    // Detect dependents
    if (userQuery.includes('wife') || userQuery.includes('children') || userQuery.includes('dependent')) {
      userSessions[sessionId].dependents.push(userQuery);
      return res.json({ type: 'message', message: `Added dependent: ${userQuery}. You can continue booking.` });
    }

    // Detect travel type
    if (userQuery.includes('book')) {
      if (userQuery.includes('duty')) {
        userSessions[sessionId].travelType = 'duty';
        return res.json({
          type: 'approval',
          message: 'Duty travel requires manager approval. Click Approve to proceed.',
          entitlement: 'You have 10 out of 14 passages remaining this financial year.'
        });
      } else if (userQuery.includes('leisure')) {
        userSessions[sessionId].travelType = 'leisure';
        const options = [
          { id: 1, airline: 'Air India', flight: 'AI101', time: '07:00 AM', probability: '92%' },
          { id: 2, airline: 'Air India', flight: 'AI202', time: '02:30 PM', probability: '85%' },
          { id: 3, airline: 'Air India', flight: 'AI303', time: '09:00 PM', probability: '78%' }
        ];
        return res.json({
          type: 'options',
          options,
          entitlement: 'You have 10 out of 14 passages remaining this financial year.'
        });
      }
    }

    // Approval for duty travel
    if (userQuery.includes('approve') && userSessions[sessionId].travelType === 'duty') {
      const options = [
        { id: 1, airline: 'Air India', flight: 'AI101', time: '07:00 AM', probability: '92%' },
        { id: 2, airline: 'Air India', flight: 'AI202', time: '02:30 PM', probability: '85%' },
        { id: 3, airline: 'Air India', flight: 'AI303', time: '09:00 PM', probability: '78%' }
      ];
      return res.json({
        type: 'options',
        options,
        entitlement: 'You have 10 out of 14 passages remaining this financial year.'
      });
    }

    // Selecting flight option
    if (userQuery.includes('option')) {
      if (userSessions[sessionId].travelType === 'duty') {
        const pnrId = 'PNR-' + Math.floor(Math.random() * 100000);
        return res.json({
          type: 'confirmation',
          message: `Duty travel approved and booked! PNR: ${pnrId}. Dependents: ${userSessions[sessionId].dependents.join(', ') || 'None'}`
        });
      } else if (userSessions[sessionId].travelType === 'leisure') {
        return res.json({
          type: 'payment',
          message: 'Select a payment method:',
          methods: ['Credit Card', 'UPI', 'Net Banking']
        });
      }
    }

    // Payment confirmation
    if (userQuery.includes('pay')) {
      const pnrId = 'PNR-' + Math.floor(Math.random() * 100000);
      return res.json({
        type: 'confirmation',
        message: `Payment successful! Leisure travel booked. PNR: ${pnrId}. Dependents: ${userSessions[sessionId].dependents.join(', ') || 'None'}`
      });
    }

    res.json({ type: 'message', message: 'Please start with "Book duty travel..." or "Book leisure travel..."' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
