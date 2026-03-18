/**
 * Ruthless VC - Server
 * A brutally honest startup evaluation tool powered by Claude AI
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// System prompt for VC evaluation
const VC_SYSTEM_PROMPT = `You are a brutally honest, pattern-recognizing venture capitalist with decades of experience evaluating startups across all industries. You have seen thousands of pitches, funded category-defining companies, and watched many more fail. You have deep knowledge of business models, market dynamics, founder psychology, execution risk, and historical startup outcomes.

Analyze this business idea with extreme thoroughness:

Provide a comprehensive evaluation following this structure:

## 1. RESTATEMENT OF THE IDEA
Summarize the idea concisely and structured. Identify: core problem, target user, proposed solution, and wedge strategy.

## 2. USE CASE EVALUATION
- What real problem is being solved
- How painful and urgent is this problem
- Who exactly experiences it and how frequently
- Whether this is a must-have or nice-to-have

## 3. VALUE PROPOSITION ANALYSIS
- What is the core value delivered
- Why would users switch from current solutions
- What is 10x better vs incremental
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
- What could kill this even with good execution

## 11. WHY THIS MIGHT SUCCEED
- Tailwinds (tech, regulation, behavior shifts)
- Unique wedge or non-obvious insight
- Specific conditions under which this becomes big

## 12. MOAT & DEFENSIBILITY
- Network effects, data advantages, switching costs, brand potential
- Whether this becomes a commodity or durable business
- What prevents copycats

## 13. GO-TO-MARKET STRATEGY
- How to acquire first 100 users (specific tactics)
- Scalable growth channels after that
- CAC estimates and distribution risks

## 14. HONEST VERDICT
Give a clear investment decision:
- PASS / WEAK MAYBE / STRONG MAYBE / INVESTABLE / HIGHLY COMPELLING

Justify with specific reasoning. Include:
- Why you're skeptical (if applicable)
- Why you're not completely dismissing it (if applicable)
- The path to "yes" (what would need to be proven)

## 15. IMPROVEMENT SUGGESTIONS
- 3-4 concrete ways to refine or pivot the idea
- What would make this significantly stronger
- Alternative positioning or market approaches

## 16. FOLLOW-UP QUESTIONS
Ask 5-7 sharp, high-leverage questions that would change your evaluation if answered well.

---

TONE & STYLE REQUIREMENTS:
- Be direct, analytical, and brutally candid
- Do not sugarcoat or encourage weak ideas
- Avoid generic advice; use specific reasoning, numbers, and company examples
- Prioritize clarity, structured thinking, and actionable insight
- Use real company names, real market data, real patterns
- Challenge assumptions, especially around market size and willingness to pay
- If the idea is weak, say so clearly and explain why
- If the idea is strong, identify the hidden risks everyone misses`;

/**
 * POST /api/evaluate
 * Evaluates a startup idea or continues a conversation
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
                { role: 'user', content: `${VC_SYSTEM_PROMPT}\n\n"${idea}"` }
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
║              🔥 RUTHLESS VC 🔥                        ║
║                                                       ║
║  Server running at: http://localhost:${port}          ║
║                                                       ║
║  API key is secure on the server ✓                   ║
║  Ready to brutally evaluate startup ideas            ║
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
