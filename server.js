const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON Database for Workspace, Second Brain, and History
const DB_FILE = path.join(__dirname, 'data_store.json');

// LangSmith Tracing Setup
let traceable;
try {
  traceable = require('langsmith/traceable').traceable;
} catch (e) {
  traceable = (fn) => fn;
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      kanban: [
        { id: '1', title: 'Viral AI Tools Overview', status: 'idea', category: 'YouTube', date: '2026-10-01' },
        { id: '2', title: '10 X Hooks for Developers', status: 'scripting', category: 'Twitter', date: '2026-10-02' },
        { id: '3', title: 'Sponsorship Pitch to TechBrand', status: 'review', category: 'Sponsorship', date: '2026-10-03' },
        { id: '4', title: 'Shorts: 3 AI Hacks', status: 'published', category: 'Reels', date: '2026-09-28' }
      ],
      secondBrain: [
        { id: 'sb-1', topic: 'AI Video Editing', note: 'AI video trimming increases retention by 35% when cut on natural pauses.', tags: ['video', 'ai', 'retention'] },
        { id: 'sb-2', topic: 'Hook Psychology', note: 'Curiosity gaps outperform direct statements by 4x on short-form platforms.', tags: ['hooks', 'psychology'] }
      ],
      history: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { kanban: [], secondBrain: [], history: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// AI Engine Helper (Uses Google Generative AI if key provided, else smart rule-based synthesizer)
const generateAIResponse = traceable(async function generateAIResponse(prompt, apiKey = process.env.GEMINI_API_KEY) {
  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn('Gemini API call failed, using rule-based synthesis engine:', err.message);
    }
  }
  return null; // Signals fallback to smart template synthesizer
}, { name: "Gemini_AI_Agent_Step", run_type: "llm" });

// === 01. Content Idea Generator ===
app.post('/api/generate-ideas', async (req, res) => {
  const { topic, audience, platform, count = 5, apiKey } = req.body;
  const prompt = `Act as an expert Content Strategist. Generate ${count} high-converting viral content ideas for topic: "${topic}" targeting audience: "${audience}" on platform: "${platform}". Provide Title, Angle, Format, and Estimated Virality Score (1-100).`;
  
  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const angles = ['Deep Dive Case Study', 'Myth Busting', 'Step-by-Step Tutorial', 'Unpopular Opinion', 'Ultimate Beginner Guide', 'Before & After Transformation'];
  const formats = platform === 'YouTube' ? ['10-Min Video', 'Documentary', 'Listicle'] : platform === 'Instagram' ? ['Reel', 'Carousel', 'Story Series'] : ['Thread', 'Single Post', 'Infographic'];
  
  const ideas = [];
  for (let i = 1; i <= count; i++) {
    const angle = angles[i % angles.length];
    const format = formats[i % formats.length];
    ideas.push({
      id: i,
      title: `${topic || 'AI Productivity'}: The ${angle} Every ${audience || 'Creator'} Needs to Know (#${i})`,
      angle,
      format,
      targetPlatform: platform || 'Multi-platform',
      viralityScore: Math.floor(82 + Math.random() * 16),
      reasoning: `High search intent combined with strong audience relevance for ${audience || 'general viewers'}.`
    });
  }

  res.json({ result: ideas, source: 'synthesizer' });
});

// === 02. Content Repurposer ===
app.post('/api/repurpose', async (req, res) => {
  const { contentInput, targetPlatforms = ['Twitter/X', 'LinkedIn', 'Instagram Reel', 'Newsletter'], apiKey } = req.body;
  const prompt = `Take the following original content and repurpose it into tailored drafts for each of these platforms: ${targetPlatforms.join(', ')}.\nOriginal Content:\n${contentInput}`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const summary = contentInput ? contentInput.slice(0, 150) + '...' : 'Key insights from your core content.';
  const output = {
    'Twitter/X': `🚀 Quick Breakdown: ${summary}\n\n1/ Key Takeaway A: Focus on consistency.\n2/ Key Takeaway B: Leverage AI automation.\n3/ Key Takeaway C: Focus on audience engagement.\n\nRetweet if you found this valuable! 🔁`,
    'LinkedIn': `Insight of the day 💡\n\n${contentInput || 'Original core content.'}\n\nHere are 3 key action steps to execute this today:\n• Step 1: Audit your current workflow.\n• Step 2: Implement automated repurposing.\n• Step 3: Track conversion metrics.\n\nWhat are your thoughts on this? Drop a comment below 👇`,
    'Instagram Reel': `[SCENE 1 - HOOK]: Speak directly to camera: "Stop making this huge mistake!"\n[TEXT ON SCREEN]: ${summary}\n[SCENE 2 - BODY]: Show screencast or visual B-roll explaining the 3 main steps.\n[SCENE 3 - CTA]: "Save this Reel & follow for daily creator tips!"`,
    'Newsletter': `Subject: 📧 The Secret to Scaling ${contentInput ? contentInput.slice(0, 30) : 'Your Content'}\n\nHey Creator,\n\nToday we are diving into a crucial topic:\n"${contentInput || 'Scaling content output with AI.'}"\n\n3 Lessons Learned:\n1. Execution matters more than perfection.\n2. Repurposing expands your reach 4x.\n3. Always build for your core audience.\n\nTalk soon,\n- Creator Team`
  };

  res.json({ result: output, source: 'synthesizer' });
});

// === 03. Hook Generator ===
app.post('/api/generate-hooks', async (req, res) => {
  const { topic, tone = 'Curiosity', count = 5, apiKey } = req.body;
  const prompt = `Generate ${count} compelling video/post hooks about "${topic}" using tone "${tone}". Categorize by Hook Type (e.g. Curiosity Gap, Negative Framing, Data-Driven, Story-Driven).`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const hookStyles = [
    { type: 'Curiosity Gap', template: (t) => `Nobody is talking about this ${t} secret, but it changed everything for me.` },
    { type: 'Negative Framing', template: (t) => `If you are still doing ${t} the old way, you are losing 10 hours a week.` },
    { type: 'Data-Driven', template: (t) => `92% of creators fail at ${t}. Here is the exact playbook to be in the 8%.` },
    { type: 'Story-Driven', template: (t) => `I tested ${t} for 30 days straight. Here is what nobody tells you.` },
    { type: 'Bold Claim', template: (t) => `This 1 simple ${t} strategy will replace your entire marketing team.` }
  ];

  const hooks = hookStyles.slice(0, count).map((style, idx) => ({
    id: idx + 1,
    type: style.type,
    hookText: style.template(topic || 'content strategy'),
    tone,
    expectedRetentionScore: `${Math.floor(88 + Math.random() * 11)}%`
  }));

  res.json({ result: hooks, source: 'synthesizer' });
});

// === 04. Daily Content Planner ===
app.post('/api/daily-planner', async (req, res) => {
  const { niche, goal, apiKey } = req.body;
  const prompt = `Create a complete 7-day content schedule for niche "${niche}" with primary goal "${goal}". Specify Day, Platform, Content Topic, Format, and Best Time to Post.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule = days.map((day, i) => ({
    day,
    platform: i % 2 === 0 ? 'Instagram & YouTube Shorts' : 'LinkedIn & X',
    topic: `Day ${i + 1} ${niche || 'Growth'} Action Plan: ${goal || 'Audience Engagement'} step ${i + 1}`,
    format: i % 3 === 0 ? 'Short-Form Reel' : i % 3 === 1 ? 'Carousel / Thread' : 'Long-form Post',
    bestTime: i % 2 === 0 ? '09:00 AM EST' : '05:30 PM EST',
    objective: i < 3 ? 'Awareness' : i < 5 ? 'Engagement' : 'Monetization/Conversion'
  }));

  res.json({ result: schedule, source: 'synthesizer' });
});

// === 05. Reel Script Builder ===
app.post('/api/reel-script', async (req, res) => {
  const { topic, targetDuration = '30s', apiKey } = req.body;
  const prompt = `Write a viral 30-60 second short-form Reel/TikTok script for topic: "${topic}". Include Scene timestamp, On-Screen Visual Cue, Spoken Script, and Audio/B-Roll Directions.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const script = {
    title: `Viral Reel Script: ${topic || 'Mastering AI Tools'}`,
    duration: targetDuration,
    hook: {
      timestamp: '00:00 - 00:03',
      visual: 'Zoom in fast on creator pointing at screen',
      spokenText: `Stop scrolling if you want to double your reach with ${topic || 'AI'}!`,
      audioCue: 'Swoosh effect + energetic beat drop'
    },
    bodyScenes: [
      {
        timestamp: '00:03 - 00:15',
        visual: 'Screen recording showing step 1 execution',
        spokenText: 'First, never write from scratch. Use AI prompts to structure your core thesis.',
        broll: 'Keyboard typing footage overlaid with text highlight'
      },
      {
        timestamp: '00:15 - 00:25',
        visual: 'Creator talking to camera with dynamic caption popups',
        spokenText: 'Second, auto-repurpose every long video into 5 short-form clips automatically.',
        broll: 'Fast-cut video montage of social logos'
      }
    ],
    cta: {
      timestamp: '00:25 - 00:30',
      visual: 'Creator holding phone with follow arrow popup',
      spokenText: `Comment "${(topic || 'SCRIPT').toUpperCase().slice(0, 6)}" below and I’ll send you the full free template!`,
      audioCue: 'Ding chime + screen fade'
    }
  };

  res.json({ result: script, source: 'synthesizer' });
});

// === 06. Clip Finder ===
app.post('/api/find-clips', async (req, res) => {
  const { transcript, minClips = 3, apiKey } = req.body;
  const prompt = `Analyze this video transcript and identify ${minClips} viral short-form clips. Provide Start Time, End Time, Headline, Viral Potential Score (1-100), and Key Quote.\nTranscript:\n${transcript}`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const clips = [
    {
      id: 1,
      startTime: '01:15',
      endTime: '02:05',
      duration: '50s',
      headline: 'The #1 Secret to Audience Growth',
      viralScore: 95,
      summaryQuote: transcript ? transcript.slice(0, 100) + '...' : 'Consistency beats intensity every single time.'
    },
    {
      id: 2,
      startTime: '04:30',
      endTime: '05:15',
      duration: '45s',
      headline: 'Why 99% of Content Fails in 2026',
      viralScore: 89,
      summaryQuote: 'If your hook doesn\'t land in 3 seconds, retention drops by 70%.'
    },
    {
      id: 3,
      startTime: '08:10',
      endTime: '09:00',
      duration: '50s',
      headline: 'Automating Your Creative Workflow',
      viralScore: 92,
      summaryQuote: 'Systemizing content generation frees up 20 hours every week.'
    }
  ];

  res.json({ result: clips, source: 'synthesizer' });
});

// === 07. Thumbnail Ideator ===
app.post('/api/thumbnail-ideas', async (req, res) => {
  const { videoTitle, apiKey } = req.body;
  const prompt = `Create 3 distinct YouTube thumbnail concepts for title: "${videoTitle}". For each concept include Text Overlay, Expression/Subject, Background Visual, Color Contrast Scheme, and Midjourney Prompt.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const concepts = [
    {
      conceptName: 'High-Impact Shock Factor',
      textOverlay: 'THIS CHANGES EVERYTHING!',
      expression: 'Shocked face pointing at glowing metric dashboard',
      background: 'Dark futuristic tech lab with neon red vs blue contrast',
      midjourneyPrompt: `/imagine prompt: high quality thumbnail of modern creator, shocked expression, pointing at glowing hologram chart, cinematic lighting, 8k resolution --ar 16:9`
    },
    {
      conceptName: 'Minimalist Curiosity',
      textOverlay: 'DON\'T DO THIS ❌',
      expression: 'Thoughtful face looking directly at viewer with crossed arms',
      background: 'Clean split screen: red warning side vs green success side',
      midjourneyPrompt: `/imagine prompt: minimal high-contrast YouTube thumbnail, bold red cross overlay, sleek studio background, vivid colors --ar 16:9`
    },
    {
      conceptName: 'Transformation / Case Study',
      textOverlay: '$0 TO $10K/MO',
      expression: 'Confident smile pointing upward to big bold numbers',
      background: 'Subtle dark gradient with rising graph line glowing in green',
      midjourneyPrompt: `/imagine prompt: financial growth YouTube thumbnail, bold green text banner, glowing arrow up, ultra crisp detail --ar 16:9`
    }
  ];

  res.json({ result: concepts, source: 'synthesizer' });
});

// === 08. Caption Assistant ===
app.post('/api/caption-assistant', async (req, res) => {
  const { contentDescription, platform = 'Instagram', tone = 'Engaging', apiKey } = req.body;
  const prompt = `Write a high-engaging ${platform} caption for: "${contentDescription}" with tone "${tone}". Include formatted line breaks, emojis, Call to Action, and 15 targeted hashtags.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const caption = `✨ ${contentDescription || 'Level up your content strategy today!'}\n\nHere is what you need to know:\n\n👉 Step 1: Define your core audience.\n👉 Step 2: Use AI to scale production.\n👉 Step 3: Measure results & double down on winners.\n\nWhich step are you working on right now? Drop a comment below! 👇\n\n.\n.\n.\n#ContentCreator #CreatorEconomy #SocialMediaMarketing #AIForCreators #ContentStrategy #ViralTips #DigitalGrowth #ShortFormContent #ReelsTips #GrowthHacking`;

  res.json({ result: caption, source: 'synthesizer' });
});

// === 09. CTA Generator ===
app.post('/api/cta-generator', async (req, res) => {
  const { goal = 'Lead Magnet / Email Signup', platform = 'General', apiKey } = req.body;
  const prompt = `Generate 6 high-converting Call-To-Action (CTA) phrases optimized for goal: "${goal}" on platform: "${platform}". Categorize by style (Direct, Low Friction, Value-First, FOMO).`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const ctas = [
    { style: 'Value-First', ctaText: 'Comment "GROWTH" below and I’ll DM you the free 5-page blueprint instantly.' },
    { style: 'Low Friction', ctaText: 'Tap the link in bio to get instant access—takes less than 30 seconds.' },
    { style: 'Direct', ctaText: 'Subscribe now so you never miss another weekly breakdown.' },
    { style: 'FOMO / Scarcity', ctaText: 'Only 50 free spots available for this template. Grab yours before link expires!' },
    { style: 'Social Proof', ctaText: 'Join 10,000+ creators who upgraded their workflow this week—link in bio.' },
    { style: 'Question Trigger', ctaText: 'What is your biggest roadblock with this? Let me know in the comments!' }
  ];

  res.json({ result: ctas, source: 'synthesizer' });
});

// === 10. Comment Analyzer ===
app.post('/api/analyze-comments', async (req, res) => {
  const { commentsText, apiKey } = req.body;
  const prompt = `Analyze these audience comments. Extract Overall Sentiment, Top 3 Audience Pain Points, Frequently Asked Questions, and Suggested Automated Replies.\nComments:\n${commentsText}`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const result = {
    sentiment: { positive: 78, neutral: 15, negative: 7 },
    topThemes: ['AI Tool Recommendations', 'Step-by-step Execution', 'Pricing & Free Options'],
    faqs: [
      'What software did you use for the automated voiceover?',
      'Can beginners with 0 followers apply this strategy?',
      'Is there a full video tutorial available?'
    ],
    suggestedReplies: [
      'Thanks for watching! I used Gemini AI + Canva for this workflow.',
      'Absolutely! This works even better for brand new accounts.',
      'Full breakdown link is right in my bio!'
    ]
  };

  res.json({ result, source: 'synthesizer' });
});

// === 11. Comment-to-Content ===
app.post('/api/comment-to-content', async (req, res) => {
  const { commentInput, apiKey } = req.body;
  const prompt = `Convert this top viewer comment/question into 3 standalone content formats (Reel script outline, X thread hook, YouTube video title & outline):\nComment: "${commentInput}"`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const result = {
    sourceComment: commentInput || 'How do I generate 30 days of content without burnout?',
    reelConcept: {
      title: 'How to create 30 posts in 2 hours',
      hook: 'Someone asked me how I never run out of post ideas. Here is my exact 3-step system.',
      keyPoints: ['Batch research on Monday', 'Use AI templates on Tuesday', 'Auto-schedule for 30 days']
    },
    xThreadHook: 'I got asked: "How do you avoid creator burnout?" Here is the system that saved me 20 hours a week (Thread) 🧵👇',
    youtubeOutline: {
      title: 'The Ultimate Lazy Creator System (30 Days of Content in 2 Hours)',
      sections: ['00:00 Intro & The Burnout Trap', '03:15 The AI Batching Method', '08:45 Automation Setup', '12:30 Summary']
    }
  };

  res.json({ result, source: 'synthesizer' });
});

// === 12. Creator Research Assistant ===
app.post('/api/research-assistant', async (req, res) => {
  const { topic, depth = 'Comprehensive', apiKey } = req.body;
  const prompt = `Perform research on topic: "${topic}". Provide Key Industry Facts, Content Angles, Competitor Blindspots, and 3 Verified References/Data Points.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const research = {
    topic: topic || 'Artificial Intelligence in Social Media Marketing',
    keyFacts: [
      'Short-form video retention increases by 40% when captions are styled with dynamic highlights.',
      '73% of modern digital marketers leverage AI tools for initial draft generation.',
      'Multi-platform cross-posting yields 3.2x higher audience reach compared to single-platform publishing.'
    ],
    contentAngles: [
      'The Dark Side of Over-Automating Your Personal Brand',
      'How AI Tools Are Creating a New Class of Solo Creators',
      'The 5-Minute AI Workflow That Beats Full-Time Agencies'
    ],
    competitorBlindspots: 'Most creators post raw AI text without adding personal anecdotes or unique visual hooks.',
    recommendedTags: ['#AIResearch', '#CreatorStrategy', '#TechTrends']
  };

  res.json({ result: research, source: 'synthesizer' });
});

// === 13. Voice Replicator ===
app.post('/api/voice-replicator', async (req, res) => {
  const { sampleText, newTopic, apiKey } = req.body;
  const prompt = `Analyze the writing voice & style from this sample text:\n"${sampleText}"\nNow rewrite a new draft about topic: "${newTopic}" matching the exact sentence structure, vocabulary level, tone, and formatting style.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const replicatedDraft = `[VOICE PROFILE MATCHED: High Energy, Punchy Sentences, Direct Callouts]\n\nLet’s be honest.\nMost people overcomplicate ${newTopic || 'content creation'}.\n\nThey waste hours overthinking every single detail.\nHere is what actually works:\n\n1. Keep it simple.\n2. Execute fast.\n3. Iterate based on real data.\n\nNo fluff. No excuses.\n\nStart today. Thank me later. ⚡️`;

  res.json({ result: replicatedDraft, source: 'synthesizer' });
});

// === 14. Podcast Assistant ===
app.post('/api/podcast-assistant', async (req, res) => {
  const { transcriptOrNotes, showTitle, apiKey } = req.body;
  const prompt = `Act as a Podcast Producer. Generate Show Title ideas, Episode Summary, Chapter Timestamps, Key Takeaway Quotes, and Guest Question List from these notes:\n"${transcriptOrNotes}"`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const podcastData = {
    showTitle: showTitle || 'The Modern Creator Podcast - Ep 42',
    summary: 'In this episode, we unpack how high-performing creators scale their personal brands with AI automation, audience engagement tactics, and smart delegation.',
    chapters: [
      { time: '00:00', title: 'Introduction & Episode Overview' },
      { time: '04:12', title: 'The Evolution of Creator Tools' },
      { time: '14:35', title: 'Building a System for 10x Content Output' },
      { time: '28:50', title: 'Q&A and Key Lessons' }
    ],
    keyQuotes: [
      '"Systems beat talent when talent doesn\'t have a system."',
      '"The future of creation is human insight powered by AI speed."'
    ],
    guestQuestions: [
      'What was the single biggest turning point in your creation process?',
      'How do you maintain authenticity while scaling output?'
    ]
  };

  res.json({ result: podcastData, source: 'synthesizer' });
});

// === 15. Creator Workspace (Kanban & Task Management) ===
app.get('/api/workspace', (req, res) => {
  const db = loadDB();
  res.json(db.kanban);
});

app.post('/api/workspace', (req, res) => {
  const { title, status = 'idea', category = 'General' } = req.body;
  const db = loadDB();
  const newItem = {
    id: 'kb-' + Date.now(),
    title,
    status,
    category,
    date: new Date().toISOString().split('T')[0]
  };
  db.kanban.push(newItem);
  saveDB(db);
  res.json({ success: true, item: newItem, kanban: db.kanban });
});

app.put('/api/workspace/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDB();
  const item = db.kanban.find(k => k.id === id);
  if (item) {
    item.status = status;
    saveDB(db);
  }
  res.json({ success: true, kanban: db.kanban });
});

// === 16. Content Recycler ===
app.post('/api/recycle-content', async (req, res) => {
  const { pastPostText, apiKey } = req.body;
  const prompt = `Analyze this top-performing past post and recommend 3 ways to refresh, recycle, and adapt it for modern algorithm trends in 2026:\n"${pastPostText}"`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const recommendations = [
    {
      angle: '2026 Trend Update',
      reworkedDraft: `Updated for 2026: ${pastPostText || 'Core Evergreen Strategy'}\n\nWhat changed? AI tools made step 1 10x faster. Here is the updated breakdown...`
    },
    {
      angle: 'Counter-Intuitive Flip',
      reworkedDraft: `Why everything you heard about "${pastPostText ? pastPostText.slice(0, 30) : 'this strategy'}" is wrong in 2026... (Thread)`
    },
    {
      angle: 'Short-Form Reel Script',
      reworkedDraft: `[HOOK]: I posted about this 1 year ago, but today it’s more critical than ever. Here’s why...`
    }
  ];

  res.json({ result: recommendations, source: 'synthesizer' });
});

// === 17. Brand Pitch Builder ===
app.post('/api/brand-pitch', async (req, res) => {
  const { creatorNiche, audienceSize, brandName, pitchGoal, apiKey } = req.body;
  const prompt = `Draft a high-converting sponsorship pitch email for creator in niche "${creatorNiche}" (${audienceSize} followers) reaching out to brand "${brandName}". Goal: "${pitchGoal}". Include Subject Line, Email Body, ROI Metrics proposal, and Rate Card Suggestion.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const pitch = {
    subject: `Partnership Proposal: ${brandName || 'Brand'} x ${creatorNiche || 'Tech'} Creator (${audienceSize || '50k+'} Audience)`,
    body: `Hi ${brandName || 'Brand'} Team,\n\nI’ve been a huge fan of your products, and my audience of ${audienceSize || '50,000+'} dedicated ${creatorNiche || 'tech'} enthusiasts regularly asks for recommendations in this exact category.\n\nI’d love to feature ${brandName || 'your brand'} in an upcoming dedicated Reel & YouTube segment.\n\nRecent Campaign Performance:\n• Average Engagement Rate: 5.4%\n• Average Views per Reel: 35,000+\n• Conversion Rate on Past Partner Links: 3.8%\n\nLet me know if you’d be open to reviewing our media kit!\n\nBest regards,\n[Your Name]`,
    rateSuggestion: 'Estimated Sponsored Package: $1,200 - $2,500 per integrated video.'
  };

  res.json({ result: pitch, source: 'synthesizer' });
});

// === 18. AI Content Director ===
app.post('/api/content-director', async (req, res) => {
  const { channelGoal, monthlyTheme, apiKey } = req.body;
  const prompt = `Act as an Executive Content Director. Build a strategic production masterplan for monthly theme: "${monthlyTheme}" with goal: "${channelGoal}". Outline Narrative Arc, 4 Content Pillars, Visual Style Guide, and Weekly Execution Plan.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const masterplan = {
    monthlyTheme: monthlyTheme || 'Scaling Digital Presence with AI',
    narrativeArc: 'From novice setup -> Workflow mastery -> Automated revenue engine.',
    contentPillars: [
      'Pillar 1: Educational How-To Guides (40%)',
      'Pillar 2: Behind-the-Scenes Case Studies (30%)',
      'Pillar 3: Tool Comparisons & Reviews (20%)',
      'Pillar 4: Thought Leadership & Vision (10%)'
    ],
    visualStyleGuide: 'Dark mode aesthetic, neon accent lines, 60fps cinematic cuts, bold Sans-serif text popups.',
    weeklyBreakdown: [
      'Week 1: Foundations & Common Pitfalls',
      'Week 2: Deep Dive Step-by-Step System',
      'Week 3: Live Case Study & Results',
      'Week 4: Q&A + Masterclass Launch'
    ]
  };

  res.json({ result: masterplan, source: 'synthesizer' });
});

// === 19. Creator Second Brain ===
app.get('/api/second-brain', (req, res) => {
  const db = loadDB();
  res.json(db.secondBrain);
});

app.post('/api/second-brain', (req, res) => {
  const { topic, note, tags = [] } = req.body;
  const db = loadDB();
  const newItem = {
    id: 'sb-' + Date.now(),
    topic,
    note,
    tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())
  };
  db.secondBrain.push(newItem);
  saveDB(db);
  res.json({ success: true, item: newItem, brain: db.secondBrain });
});

app.post('/api/second-brain/query', async (req, res) => {
  const { question, apiKey } = req.body;
  const db = loadDB();
  const prompt = `Based on the creator's saved knowledge base:\n${JSON.stringify(db.secondBrain)}\nAnswer the user's question: "${question}". Synthesize insights and recommend content ideas.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const matchingNotes = db.secondBrain.filter(b => b.topic.toLowerCase().includes(question.toLowerCase()) || b.note.toLowerCase().includes(question.toLowerCase()));
  const answer = matchingNotes.length > 0
    ? `Found ${matchingNotes.length} related knowledge entries in your Second Brain:\n` + matchingNotes.map(m => `• [${m.topic}]: ${m.note}`).join('\n')
    : `Searched Second Brain for "${question}". Recommendation: Save more notes on this topic to strengthen semantic connections!`;

  res.json({ result: answer, source: 'synthesizer' });
});

// === 20. AI Screenplay Workspace ===
app.post('/api/screenplay', async (req, res) => {
  const { concept, characters = 'Creator, Mentor', structure = '3-Act Structure', apiKey } = req.body;
  const prompt = `Write a polished video screenplay scene based on concept: "${concept}" with characters: "${characters}" following structure "${structure}". Format in standard Industry Screenplay Markdown.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const screenplay = `TITLE: ${(concept || 'THE CREATOR JOURNEY').toUpperCase()}\nACT I: THE BREAKTHROUGH\n\nINT. CREATOR STUDIO - NIGHT\n\nDim neon blue lighting illuminating the desk. CREATOR (20s) stares intensely at monitor analytics.\n\nCREATOR\n(sighs)\nThree views again. There has to be a better way to structure this story.\n\nMENTOR enters, setting down a notebook.\n\nMENTOR\nYou're focusing on the algorithm instead of the audience emotion. Hook them first, deliver value second.\n\nCREATOR\nShow me.`;

  res.json({ result: screenplay, source: 'synthesizer' });
});

// === 21. Autonomous Content Pipeline ===
const runAutonomousPipelineChain = traceable(async function runAutonomousPipelineChain(seedIdea, apiKey) {
  const prompt = `Run Autonomous 7-Step Content Pipeline for seed idea: "${seedIdea}". Generate Output for: 1. Research Brief, 2. Main YouTube Script, 3. Short Reel Script, 4. X/Twitter Thread, 5. LinkedIn Article, 6. Instagram Caption, 7. 7-Day Distribution Schedule.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return { result: aiOutput, source: 'ai' };

  const pipeline = {
    step1_ResearchBrief: `Topic: ${seedIdea || 'AI Automation'}. Key Insight: Audiences retain 3x more information with structured visual breakdowns.`,
    step2_YouTubeScript: `[INTRO]: Welcome back! Today we are taking "${seedIdea || 'this concept'}" to the next level...\n[BODY]: Step 1 - Plan. Step 2 - Execute. Step 3 - Automate.`,
    step3_ShortReelScript: `[HOOK]: Stop doing ${seedIdea || 'this'} manually in 2026!\n[CTA]: Comment "AUTO" for the link.`,
    step4_TwitterThread: `1/ How to master ${seedIdea || 'content creation'} in 5 simple steps 🧵👇\n2/ Step 1...`,
    step5_LinkedInArticle: `Key lessons from automating ${seedIdea || 'our workflow'} this quarter...`,
    step6_InstagramCaption: `🚀 Ready to upgrade your creator operating system? Here is everything you need... #CreatorOS #Growth`,
    step7_PublishingSchedule: 'Scheduled: YouTube (Mon 10am), Reels (Tue/Thu 5pm), X Thread (Wed 9am), LinkedIn (Fri 8am).'
  };
  return { result: pipeline, source: 'synthesizer' };
}, { name: "Autonomous_7_Step_Content_Pipeline", run_type: "chain" });

app.post('/api/autonomous-pipeline', async (req, res) => {
  const { seedIdea, apiKey } = req.body;
  const output = await runAutonomousPipelineChain(seedIdea, apiKey);
  res.json(output);
});

// === 22. AI Creative Producer ===
app.post('/api/creative-producer', async (req, res) => {
  const { creatorGoal, targetBudget = '$500', timeline = '30 Days', apiKey } = req.body;
  const prompt = `Act as an AI Creative Producer. Formulate a 30-Day Executive Production Plan for goal: "${creatorGoal}" with budget "${targetBudget}" and timeline "${timeline}". Include Deliverables Checklist, Budget Allocation, Risk Assessment, and KPI Benchmarks.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const plan = {
    goal: creatorGoal || 'Launch New SaaS Product Video Series',
    budgetAllocation: {
      'AI Software & Subscriptions': '$150',
      'Thumbnail Design & Assets': '$150',
      'Paid Micro-Distribution': '$200'
    },
    deliverables: ['4x Long-form Videos', '12x Short Reels', '30x Social Posts'],
    kpiBenchmarks: { targetViews: '100,000+', targetLeads: '500 email subscribers' },
    riskAssessment: 'Primary risk is production delay. Mitigation: Batch shoot all A-roll in 1 session.'
  };

  res.json({ result: plan, source: 'synthesizer' });
});

// === 23. Creator Collaboration Finder ===
app.post('/api/collaboration-finder', async (req, res) => {
  const { creatorNiche, subscriberCount = '10k', apiKey } = req.body;
  const prompt = `Find 3 ideal collaboration creator archetypes & cross-promotional pitch ideas for niche "${creatorNiche}" with ${subscriberCount} followers. Include Match Score, Synergy Angle, and Collaboration Concept.`;

  const aiOutput = await generateAIResponse(prompt, apiKey);
  if (aiOutput) return res.json({ result: aiOutput, source: 'ai' });

  const matches = [
    {
      archetype: 'Tech & Productivity Tool Reviewer (15k-25k Followers)',
      matchScore: '98%',
      synergyAngle: 'Complementary audience interested in hardware + software workflows.',
      collabConcept: 'Joint Live Stream: "The Ultimate 2026 Tech & AI Creator Desk Setup"'
    },
    {
      archetype: 'SaaS Founder / Indie Hacker (10k Followers)',
      matchScore: '94%',
      synergyAngle: 'High conversion audience looking for business case studies.',
      collabConcept: 'Podcast Guest Swap & Cross-Newsletter Takeover'
    },
    {
      archetype: 'Short-Form Video Editor / Animator (20k Followers)',
      matchScore: '91%',
      synergyAngle: 'Visual design synergy for joint template giveaways.',
      collabConcept: 'Co-created Free Template Pack + Co-branded Reel'
    }
  ];

  res.json({ result: matches, source: 'synthesizer' });
});

app.listen(PORT, () => {
  console.log(`🚀 ASADI Creator OS SaaS Platform running at http://localhost:${PORT}`);
});
