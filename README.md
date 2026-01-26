# Outbound Sales Agent v2

AI-powered cold outbound sales tool with ICP scoring, personalized messaging, and multi-channel sequence management.

## Features

- **ICP Configuration** - Define your Ideal Customer Profile with target industries, titles, signals, and pain points
- **Prospect Management** - Import via CSV, track status through the pipeline
- **AI-Powered Research** - Claude AI researches prospects and identifies personalization hooks
- **Message Generation** - Personalized messages for LinkedIn, Email, and Phone
- **Sequence Builder** - Drag-and-drop outreach sequences with customizable steps
- **Review Queue** - Approve, edit, or regenerate messages before sending
- **Multi-Channel Outreach** - LinkedIn (Connection, InMail), Email (Gmail), Phone
- **Sales Navigator Integration** - Direct links to Sales Navigator for each prospect

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Claude API key from [console.anthropic.com](https://console.anthropic.com)

### Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install email-validator

# Create .env file
echo "DATABASE_URL=sqlite:///./outbound_agent.db" > .env
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env

# Start the server
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Configuration

### Environment Variables

Create a `.env` file in the `backend` folder:

```env
# Required
DATABASE_URL=sqlite:///./outbound_agent.db
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional - for integrations
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
PROSPECT_IO_API_KEY=
APOLLO_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

### ICP Configuration

1. Register and log in
2. Go to ICP Config page
3. Click "Load Semgrep Template" for a starter config or create your own
4. Configure:
   - Target industries and company sizes
   - Target job titles and seniority levels
   - Positive/negative signals
   - Pain points and value propositions
   - Messaging tone and phrases to avoid

## Usage Flow

### 1. Import Prospects

- Go to Import page
- Upload a CSV with columns: first_name, last_name, email, title, company, linkedin_url
- Prospects are automatically scored against your ICP

### 2. Generate Messages

- Click on a prospect to view details
- Click "Generate Messages" to research them and create personalized outreach
- Claude AI will research the prospect and generate messages for each channel

### 3. Review Messages

- Go to Review Queue
- Approve, edit, or regenerate each message
- Messages move to Approved when ready

### 4. Execute Outreach

- Go to Approved page
- Copy message and click "Open in Gmail" or "Open in Sales Navigator"
- Mark as sent after sending

### 5. Track Progress

- Each prospect has a customizable sequence
- Track which step you're on
- Mark steps complete as you go

## Project Structure

```
outbound-sales-agent-v2/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and env vars
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   │   ├── user.py
│   │   ├── prospect.py
│   │   ├── company.py
│   │   ├── message.py
│   │   ├── icp.py
│   │   ├── sequence.py
│   │   └── activity.py
│   ├── routers/             # API endpoints
│   │   ├── auth.py
│   │   ├── prospects.py
│   │   ├── messages.py
│   │   ├── icp.py
│   │   ├── sequences.py
│   │   ├── workflow.py
│   │   └── integrations.py
│   └── services/            # Business logic
│       ├── enrichment.py    # Claude AI research
│       ├── message_generator.py
│       └── icp_scorer.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js    # API client
│   │   ├── hooks/useAuth.js # Auth state
│   │   └── pages/           # React pages
│   │       ├── Dashboard.jsx
│   │       ├── Prospects.jsx
│   │       ├── ProspectDetail.jsx
│   │       ├── ReviewQueue.jsx
│   │       ├── Approved.jsx
│   │       ├── ICPConfig.jsx
│   │       ├── Import.jsx
│   │       └── Settings.jsx
│   └── package.json
└── README.md
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- SQLite/PostgreSQL (Database)
- Anthropic Claude (AI)
- Pydantic (Validation)

**Frontend:**
- React 18
- Tailwind CSS
- React Query (Data fetching)
- Zustand (State management)
- React Router
- Lucide React (Icons)

## Deployment

### Backend (Railway/Render)

1. Set environment variables in your hosting platform
2. Use `DATABASE_URL` for PostgreSQL connection
3. Deploy with: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com`

## Security Notes

- Never commit `.env` files
- API keys are stored server-side only
- JWT tokens expire after 7 days
- CORS is configured for development; restrict in production

## License

MIT
