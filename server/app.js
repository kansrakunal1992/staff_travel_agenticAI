const express = require('express');
const fetch = require('node-fetch');
const Airtable = require('airtable');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('static'));

// TODO: Insert your credentials below
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY';
const AMADEUS_API_KEY = 'YOUR_AMADEUS_API_KEY';
const AMADEUS_API_SECRET = 'YOUR_AMADEUS_API_SECRET';
const AIRTABLE_API_KEY = 'YOUR_AIRTABLE_API_KEY';
const AIRTABLE_BASE_ID = 'YOUR_AIRTABLE_BASE_ID';
const AIRTABLE_TABLE_NAME = 'PNR_Records';

// Configure Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

app.post('/api/process', async (req, res) => {
    const userQuery = req.body.query;

    try {
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

        const origin = nlpData.origin || 'DEL';
        const destination = nlpData.destination || 'BOM';
        const travelType = nlpData.travelType || 'Duty';

        // Step 2: Flight Search via Amadeus (placeholder)
        // TODO: Implement Amadeus Flight Offers Search API call here

        // Step 3: Create PNR via Amadeus (placeholder)
        // TODO: Implement Amadeus Booking API call here

        // Mock PNR for now
        const pnrId = 'PNR-' + Math.floor(Math.random() * 100000);

        // Step 4: Store in Airtable
        await base(AIRTABLE_TABLE_NAME).create({
            Query: userQuery,
            Origin: origin,
            Destination: destination,
            TravelType: travelType,
            PNR: pnrId,
            Status: 'Confirmed'
        });

        res.json({ message: `Booking confirmed with PNR: ${pnrId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
