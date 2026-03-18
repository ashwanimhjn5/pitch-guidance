# 🔥 Ruthless VC

A brutally honest startup evaluation tool powered by Claude AI. Get comprehensive VC-style feedback on your business ideas with 16-section analysis, market sizing, competitive landscape, and investment verdict.

![Ruthless VC](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node](https://img.shields.io/badge/Node-16%2B-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **16-Section Comprehensive Analysis**: From use cases to investment verdict
- **Progressive Loading States**: See exactly what's being analyzed in real-time
- **Visual Verdict Stamp**: Color-coded investment decision with dramatic animation
- **Key Metrics Dashboard**: TAM, verdict, and risk level at a glance
- **Floating Navigation**: Jump to any section instantly
- **Follow-up Questions**: Continue the conversation with context
- **Production-Grade UI**: Beautiful design with smooth animations
- **Secure API Key Management**: Key stored server-side, never exposed to frontend

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ruthless-vc.git
cd ruthless-vc

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Start the server
npm start

# 5. Open your browser
# Visit http://localhost:3000
```

## 📁 Project Structure

```
ruthless-vc/
├── server.js           # Express backend with API proxy
├── public/
│   └── index.html     # Frontend application (React-free)
├── .env               # Environment variables (DO NOT COMMIT)
├── .env.example       # Template for environment variables
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## 🌐 Deployment

### Deploy to Heroku (Recommended)

1. **Create Heroku Account**: [signup.heroku.com](https://signup.heroku.com)

2. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ruthless-vc.git
git push -u origin main
```

3. **Deploy via Heroku Dashboard**:
   - Go to [dashboard.heroku.com](https://dashboard.heroku.com)
   - Click "New" → "Create new app"
   - Name it: `ruthless-vc`
   - Go to "Deploy" tab → Connect GitHub repository
   - Go to "Settings" tab → "Config Vars" → Add:
     - KEY: `ANTHROPIC_API_KEY`
     - VALUE: `your_api_key_here`
   - Go back to "Deploy" tab → Click "Deploy Branch"
   - Click "View" to see your live app!

**Alternative: Deploy via Heroku CLI**:
```bash
# Install Heroku CLI first
heroku login
heroku create ruthless-vc
heroku config:set ANTHROPIC_API_KEY=your_api_key_here
git push heroku main
heroku open
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
vercel env add ANTHROPIC_API_KEY
# (paste your API key)
vercel --prod
```

### Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway variables set ANTHROPIC_API_KEY=your_api_key_here
railway up
railway open
```

### Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service
4. Connect GitHub repository
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | ✅ Yes |
| `PORT` | Server port (default: 3000) | ❌ No |

### API Configuration

Edit `server.js` to customize:

```javascript
// Change AI model
model: 'claude-opus-4-20250514'  // More capable, higher cost
model: 'claude-sonnet-4-20250514' // Balanced (default)
model: 'claude-haiku-4-20250514'  // Faster, lower cost

// Adjust response length
max_tokens: 8000  // Longer responses
max_tokens: 4000  // Shorter responses
```

## 💰 Cost Management

Each evaluation costs approximately **$0.50-1.50** depending on response length.

**To control costs**:
1. Set spending limits at [console.anthropic.com](https://console.anthropic.com)
2. Monitor usage regularly
3. Consider adding rate limiting for public deployments

## 🎨 Features Deep Dive

### Progressive Loading
Shows 8 animated steps during analysis:
- 🎯 Analyzing use cases and target market
- 💎 Evaluating value proposition
- 📊 Calculating market size (TAM/SAM/SOM)
- 🏢 Researching competitive landscape
- 💀 Pattern matching similar successes & failures
- 💰 Assessing business model viability
- ⚙️ Evaluating execution complexity
- ⚖️ Generating final verdict

### Color-Coded Verdicts
- 🔴 **PASS** - Clear rejection
- 🟡 **WEAK MAYBE** - Skeptical
- 🟠 **STRONG MAYBE** - Interested
- 🟢 **INVESTABLE** - Strong signal
- ✨ **HIGHLY COMPELLING** - Unicorn potential (with confetti!)

### Key Metrics Dashboard
Displays at-a-glance:
- Investment Decision
- Market Size (TAM)
- Primary Risk Factor

### Floating Navigation
- Appears when scrolling through results
- Highlights current section
- Click to jump to any section
- Auto-hides on mobile

## 🔒 Security

- ✅ API key stored server-side only
- ✅ Never exposed in frontend code
- ✅ HTTPS enforced on production
- ✅ CORS enabled for API protection
- ✅ Input validation on all endpoints

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-restart on file changes.

### Testing Locally

```bash
# Test the API endpoint directly
curl -X POST http://localhost:3000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"idea": "A mobile app that helps people find parking spots"}'
```

## 📝 API Documentation

### POST `/api/evaluate`

Evaluates a startup idea or continues a conversation.

**Request Body**:
```json
{
  "idea": "Your business idea description",
  "conversationHistory": [] // Optional, for follow-ups
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Comprehensive evaluation..."
    }
  ]
}
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your own projects!

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)
# Or change PORT in .env
```

### API Key Errors
- Verify key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Check billing/credits
- Ensure key is in `.env` file

### Deployment Issues
```bash
# View Heroku logs
heroku logs --tail

# Restart Heroku app
heroku restart

# Check environment variables
heroku config
```

## 🎯 Roadmap

- [ ] PDF export of evaluations
- [ ] Comparison mode (compare multiple ideas)
- [ ] User accounts with history
- [ ] Share evaluation via link
- [ ] Dark mode toggle
- [ ] Voice input for pitches
- [ ] API rate limiting
- [ ] Analytics dashboard

## 📧 Support

For questions or issues:
- Check [console.anthropic.com](https://console.anthropic.com) for API status
- Review server logs for errors
- Open an issue on GitHub

## 🌟 Show Your Support

If you found this useful, give it a ⭐️ on GitHub!

---

**Built with ❤️ using Claude AI**
