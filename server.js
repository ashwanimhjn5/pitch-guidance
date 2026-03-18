/**
 * Pitch Guidance - Server
 * A thoughtful startup evaluation tool powered by Claude AI
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS and JSON parsing ONLY
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// System prompt for startup evaluation
const EVALUATION_PROMPT = `You are an experienced startup advisor and investor with decades of experience evaluating business ideas across all industries. You've helped countless founders refine their ideas, identify opportunities, and avoid common pitfalls. You provide honest, constructive feedback that helps founders make better decisions.

Your approach is:
- Supportive yet candid - you want founders to succeed
- Analytical and thorough - you identify both strengths and risks
- Balanced - you highlight what's working AND what needs work
- Actionable - your feedback helps founders know what to do next
- Evidence-based - you reference real companies, market data, and patterns

Analyze this business idea comprehensively:

Provide your evaluation following this structure:

## 1. RESTATEMENT OF THE IDEA
Summarize the idea concisely. Identify: core problem, target user, proposed solution, and go-to-market strategy.

## 2. USE CASE EVALUATION
- What real problem is being solved
- How painful and urgent is this problem
- Who exactly experiences it and how frequently
- Whether this is a must-have or nice-to-have

## 3. VALUE PROPOSITION ANALYSIS
- What is the core value delivered
- Why would users switch from current solutions
- What's differentiated vs incremental
- Current alternatives users have

## 4. MARKET & OPPORTUNITY
- Estimate market size (TAM/SAM/SOM with actual numbers)
- Identify customer segments with specificity
- Assess whether this is venture-scale or niche
- Revenue potential calculations

## 5. COMPETITIVE LANDSCAPE
- List existing companies solving this problem (direct competitors)
- Include indirect competitors and substitutes
- Compare positioning and differentiation
- Identify what they do well and poorly

## 6. HISTORICAL PATTERN MATCHING
- Identify 3-5 similar startups that SUCCEEDED (with names and why)
- Identify 3-5 similar startups that FAILED (with names and why)
- Extract key patterns and lessons from both

## 7. BUSINESS MODEL VIABILITY
- How this makes money (revenue model options)
- Pricing power and willingness to pay
- Cost structure and scalability
- Risks to monetization

## 8. EXECUTION COMPLEXITY
- What needs to be built (tech, ops, partnerships) with detail
- Key dependencies and bottlenecks
- Realistic time to MVP and time to meaningful traction
- What's harder than it looks

## 9. FOUNDER-MARKET FIT
- What skills, background, and network are required
- What type of founder would win here
- Common mistakes inexperienced founders make in this space

## 10. WHY THIS MIGHT FAIL
- List top 5-7 risks (market, product, timing, behavior, structural)
- Where most founders underestimate difficulty
- What could derail this even with good execution

## 11. WHY THIS MIGHT SUCCEED
- Tailwinds (tech, regulation, behavior shifts)
- Unique advantages or non-obvious insights
- Specific conditions under which this becomes big

## 12. MOAT & DEFENSIBILITY
- Network effects, data advantages, switching costs, brand potential
- Whether this becomes a commodity or durable business
- What prevents copycats

## 13. GO-TO-MARKET STRATEGY
- How to acquire first 100 users (specific tactics)
- Scalable growth channels after that
- CAC estimates and distribution risks

## 14. HONEST ASSESSMENT
Give a clear, balanced assessment:
- PASS / NEEDS REFINEMENT / PROMISING / STRONG OPPORTUNITY / HIGHLY COMPELLING

Explain your reasoning:
- What are the main concerns
- What shows promise
- What would need to be proven to get to "yes"

## 15. IMPROVEMENT SUGGESTIONS
- 3-4 concrete ways to refine or strengthen the idea
- What would make this significantly better
- Alternative positioning or market approaches to consider

## 16. KEY QUESTIONS TO EXPLORE
Ask 5-7 thoughtful questions that would help clarify the opportunity and shape next steps.

---

TONE GUIDELINES:
- Be direct and honest, but constructive and supportive
- Assume the founder is smart and capable
- Focus on helping them build something great
- Use specific examples, numbers, and company names
- Challenge assumptions respectfully
- Celebrate genuine strengths while flagging real risks
- If the idea needs work, explain why AND suggest how to improve it
- If the idea is strong, identify the hidden challenges most founders miss`;

/**
 * POST /api/evaluate
 * Evaluates a startup idea or continues a conversation
 * THIS MUST COME BEFORE app.use(express.static())!
 */
app.post('/api/evaluate', async (req, res) => {
    try {
        const { idea, conversationHistory } = req.body;

        console.log('📨 Received request:', { 
            hasIdea: !!idea, 
            hasHistory: !!conversationHistory,
            ideaLength: idea?.length || 0
        });

        // Validation
        if (!idea && !conversationHistory) {
            console.log('❌ Validation failed: no idea or history');
            return res.status(400).json({ 
                error: 'Either idea or conversationHistory is required' 
            });
        }

        // Build messages array
        let messages;
        if (conversationHistory && conversationHistory.length > 0) {
            messages = conversationHistory;
            console.log('💬 Using conversation history with', conversationHistory.length, 'messages');
        } else {
            messages = [
                { role: 'user', content: `${EVALUATION_PROMPT}\n\n"${idea}"` }
            ];
            console.log('🆕 Creating new conversation');
        }

        console.log('🤖 Calling Anthropic API...');

        // Call Anthropic API
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-sonnet-4-20250514',
                max_tokens: conversationHistory ? 2000 : 8000,
                messages: messages
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 120000 // 2 minute timeout
            }
        );

        console.log('✅ API call successful');
        res.json(response.data);

    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        
        // Handle specific error types
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message || 'Failed to analyze idea';
        
        console.error('Returning error:', { status, message });
        res.status(status).json({ error: message });
    }
});

/**
 * Serve static files AFTER API routes
 */
app.use(express.static('public'));

/**
 * Serve frontend for all other routes (MUST BE LAST!)
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start server with automatic port fallback
 */
const startServer = (port) => {
    app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║            💡 PITCH GUIDANCE 💡                       ║
║                                                       ║
║  Server running at: http://localhost:${port}          ║
║                                                       ║
║  API key is secure on the server ✓                   ║
║  Ready to help founders build better                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
        `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

startServer(PORT);
