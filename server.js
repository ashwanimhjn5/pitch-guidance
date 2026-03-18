/**
 * Pitch Guidance - Server with Supabase Auth
 * A thoughtful startup evaluation tool powered by Claude AI
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware - CORS and JSON parsing ONLY
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth middleware - verify JWT token
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

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

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/evaluate
 * Evaluates a startup idea (can be used with or without auth)
 * If authenticated, can save the evaluation
 */
app.post('/api/evaluate', async (req, res) => {
    try {
        const { idea, conversationHistory, saveEvaluation, ideaId } = req.body;

        console.log('📨 Received request:', { 
            hasIdea: !!idea, 
            hasHistory: !!conversationHistory,
            ideaLength: idea?.length || 0,
            saveEvaluation,
            ideaId
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

        // If user wants to save and provided auth token, save to database
        if (saveEvaluation && req.headers.authorization) {
            try {
                const token = req.headers.authorization.substring(7);
                const { data: { user } } = await supabase.auth.getUser(token);
                
                if (user && ideaId) {
                    const evaluationText = response.data.content.find(item => item.type === "text")?.text || "";
                    
                    // Extract metadata
                    const verdictMatch = evaluationText.match(/(?:PASS|NEEDS REFINEMENT|PROMISING|STRONG OPPORTUNITY|HIGHLY COMPELLING)/i);
                    const verdict = verdictMatch ? verdictMatch[0] : null;
                    
                    const tamMatch = evaluationText.match(/TAM[:\s]+.*?(\$[\d.]+[BMK])/i);
                    const marketSize = tamMatch ? tamMatch[1] : null;
                    
                    // Save evaluation
                    const { data: evaluation, error: evalError } = await supabase
                        .from('evaluations')
                        .insert({
                            idea_id: ideaId,
                            user_id: user.id,
                            evaluation_text: evaluationText,
                            verdict,
                            market_size: marketSize
                        })
                        .select()
                        .single();
                    
                    if (!evalError && evaluation) {
                        response.data.evaluationId = evaluation.id;
                        console.log('💾 Evaluation saved:', evaluation.id);
                    }
                }
            } catch (saveError) {
                console.error('Failed to save evaluation:', saveError);
                // Don't fail the request if save fails
            }
        }

        res.json(response.data);

    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message || 'Failed to analyze idea';
        
        console.error('Returning error:', { status, message });
        res.status(status).json({ error: message });
    }
});

/**
 * POST /api/ideas
 * Create a new idea (requires auth)
 */
app.post('/api/ideas', authenticateUser, async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const { data, error } = await supabase
            .from('ideas')
            .insert({
                user_id: req.user.id,
                title: title.substring(0, 500), // Limit title length
                description
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to save idea' });
        }

        console.log('💡 New idea created:', data.id);
        res.json(data);

    } catch (error) {
        console.error('Error creating idea:', error);
        res.status(500).json({ error: 'Failed to create idea' });
    }
});

/**
 * GET /api/ideas
 * Get all ideas for the authenticated user
 */
app.get('/api/ideas', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ideas')
            .select(`
                *,
                evaluations (
                    id,
                    verdict,
                    market_size,
                    created_at
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to fetch ideas' });
        }

        console.log(`📚 Retrieved ${data.length} ideas for user`);
        res.json(data);

    } catch (error) {
        console.error('Error fetching ideas:', error);
        res.status(500).json({ error: 'Failed to fetch ideas' });
    }
});

/**
 * GET /api/ideas/:id
 * Get a specific idea with its evaluation
 */
app.get('/api/ideas/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ideas')
            .select(`
                *,
                evaluations (
                    id,
                    evaluation_text,
                    verdict,
                    market_size,
                    primary_risk,
                    created_at,
                    conversation_history (
                        id,
                        role,
                        content,
                        created_at
                    )
                )
            `)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(404).json({ error: 'Idea not found' });
        }

        console.log('📖 Retrieved idea:', id);
        res.json(data);

    } catch (error) {
        console.error('Error fetching idea:', error);
        res.status(500).json({ error: 'Failed to fetch idea' });
    }
});

/**
 * DELETE /api/ideas/:id
 * Delete an idea and all its evaluations
 */
app.delete('/api/ideas/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('ideas')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to delete idea' });
        }

        console.log('🗑️ Deleted idea:', id);
        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting idea:', error);
        res.status(500).json({ error: 'Failed to delete idea' });
    }
});

/**
 * POST /api/conversation
 * Save a conversation message (requires auth)
 */
app.post('/api/conversation', authenticateUser, async (req, res) => {
    try {
        const { evaluationId, role, content } = req.body;

        if (!evaluationId || !role || !content) {
            return res.status(400).json({ error: 'evaluationId, role, and content are required' });
        }

        const { data, error } = await supabase
            .from('conversation_history')
            .insert({
                evaluation_id: evaluationId,
                user_id: req.user.id,
                role,
                content
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to save conversation' });
        }

        res.json(data);

    } catch (error) {
        console.error('Error saving conversation:', error);
        res.status(500).json({ error: 'Failed to save conversation' });
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
║  ✓ API key is secure on the server                   ║
║  ✓ Supabase connected                                ║
║  ✓ Ready to help founders build better               ║
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
