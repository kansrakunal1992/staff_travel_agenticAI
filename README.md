# Agentic AI Staff Travel Prototype

## Setup Instructions
1. Clone this repository.
2. Navigate to `agentic_ai_prototype/server`.
3. Run `npm install express node-fetch airtable body-parser`.
4. Add your credentials in `app.js`:
   - DEEPSEEK_API_KEY
   - AMADEUS_API_KEY & AMADEUS_API_SECRET
   - AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
5. Start the server: `node app.js`.
6. Deploy to Railway by connecting your GitHub repo.

## Flow
- User enters request in HTML text box.
- Backend calls DeepSeek API for NLP.
- Calls Amadeus API for flight search & PNR creation.
- Stores PNR in Airtable.
- Returns confirmation message to UI.

## Future Enhancements
- Add SSR elements (DOJ, Staff ID) in Amadeus booking.
- Implement entitlement checks.
