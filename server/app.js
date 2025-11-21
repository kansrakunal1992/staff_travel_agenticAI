const express = require('express');
const fetch = require('node-fetch');
const Airtable = require('airtable');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('static'));

// Toggle: Set to true for mock mode (no external API calls)
const MOCK_MODE = true;

// Credentials (use env variables in Railway for real mode)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'mock-key';
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || 'mock-key';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || 'mock-secret';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'mock-key';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'mock-base';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'PNR_Records';

// Airtable setup
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Session store for clarifications
let userSessions = {};

app.post('/api/process', async (req, res) => {
    const userQuery = req.body.query;
    const sessionId = req.body.sessionId || 'default';

    try {
        let origin = 'DEL', destination = 'BOM', travelType = 'Duty', date = 'tomorrow';

        if (!MOCK_MODE) {
            // Step 1: NLP via DeepSeek
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

        // Clarification: Ask for time preference
        if (!userSessions[sessionId]?.timePreference && !userQuery.toLowerCase().includes('morning') && !userQuery.toLowerCase().includes('evening')) {
            userSessions[sessionId] = { origin, destination, travelType, date };
            return res.json({ message: "Do you prefer morning or evening flights?" });
        }

        if (userQuery.toLowerCase().includes('morning') || userQuery.toLowerCase().includes('evening')) {
            userSessions[sessionId].timePreference = userQuery.toLowerCase();
        }

        const timePref = userSessions[sessionId]?.timePreference || 'any';

        let options = [];
        let pnrId = 'PNR-' + Math.floor(Math.random() * 100000);

        if (!MOCK_MODE) {
            // Step 2: Amadeus Flight Search
            const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`
            });
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            const flightSearchUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=1`;
            const flightResponse = await fetch(flightSearchUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const flightData = await flightResponse.json();

            options = flightData.data.slice(0, 3).map((offer, idx) => {
                const segment = offer.itineraries[0].segments[0];
                return `Option ${idx + 1}: ${segment.carrierCode}${segment.number} at ${segment.departure.at}`;
            });

            if (!userQuery.toLowerCase().includes('option')) {
                return res.json({ message: `Here are your flight options:\n${options.join('\n')}\nPlease reply with Option 1, 2, or 3.` });
            }

            const selectedIndex = parseInt(userQuery.match(/\d+/)?.[0]) - 1;
            const selectedOffer = flightData.data[selectedIndex];

            // Step 3: Amadeus Booking
            const bookingResponse = await fetch('https://test.api.amadeus.com/v1/booking/flight-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    data: {
                        type: "flight-order",
                        flightOffers: [selectedOffer],
                        travelers: [{ id: "1", dateOfBirth: "1980-01-01", name: { firstName: "Test", lastName: "User" } }]
                    }
                })
            });
            const bookingData = await bookingResponse.json();
            pnrId = bookingData.data.id || pnrId;
        }

        // Step 4: Airtable (skip if mock)
        if (!MOCK_MODE) {
            await base(AIRTABLE_TABLE_NAME).create({
                Query: userQuery,
                Origin: origin,
                Destination: destination,
                TravelType: travelType,
                PNR: pnrId,
                Status: 'Confirmed'
            });
        }

        res.json({ message: `Booking confirmed with PNR: ${pnrId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
