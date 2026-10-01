// Global State
let apiKey = localStorage.getItem('ASADI_GEMINI_KEY') || '';

const TOOLS = [
  { id: 'generate-ideas', title: 'Content Idea Generator', cat: 'IDEATION & STRATEGY', icon: 'fa-lightbulb', color: 'text-amber', desc: 'Generate 10 viral content ideas based on niche, audience, and platform.' },
  { id: 'daily-planner', title: 'Daily Content Planner', cat: 'IDEATION & STRATEGY', icon: 'fa-calendar-days', color: 'text-emerald', desc: 'Create a 7-day scheduled content strategy tailored to your primary goals.' },
  { id: 'recycle-content', title: 'Content Recycler', cat: 'IDEATION & STRATEGY', icon: 'fa-rotate', color: 'text-emerald', desc: 'Revive and refresh high-performing past posts for modern algorithms.' },
  { id: 'creative-producer', title: 'AI Creative Producer', cat: 'IDEATION & STRATEGY', icon: 'fa-chess-knight', color: 'text-emerald', desc: 'Build executive 30-day production blueprints, budgets, and KPI goals.' },
  { id: 'content-director', title: 'AI Content Director', cat: 'IDEATION & STRATEGY', icon: 'fa-bullseye', color: 'text-purple', desc: 'Structure narrative arcs, content pillars, and visual style guides.' },

  { id: 'reel-script', title: 'Reel Script Builder', cat: 'SCRIPTING & COPYWRITING', icon: 'fa-video', color: 'text-cyan', desc: 'Scene-by-scene short-form scriptwriter with visual cues & audio triggers.' },
  { id: 'screenplay', title: 'AI Screenplay Workspace', cat: 'SCRIPTING & COPYWRITING', icon: 'fa-scroll', color: 'text-amber', desc: 'Write multi-act video screenplays with character dialogue and scene direction.' },
  { id: 'generate-hooks', title: 'Hook Generator', cat: 'SCRIPTING & COPYWRITING', icon: 'fa-anchor', color: 'text-amber', desc: 'Generate curiosity gaps, statistical, and story-driven viral hooks.' },
  { id: 'caption-assistant', title: 'Caption Assistant', cat: 'SCRIPTING & COPYWRITING', icon: 'fa-pen-nib', color: 'text-amber', desc: 'Craft formatted platform-ready captions with emojis and targeted hashtags.' },
  { id: 'voice-replicator', title: 'Voice Replicator', cat: 'SCRIPTING & COPYWRITING', icon: 'fa-headset', color: 'text-emerald', desc: 'Clone your writing style and sentence structure for new content.' },

  { id: 'repurpose', title: 'Content Repurposer', cat: 'MEDIA & CLIPS', icon: 'fa-arrows-split-up-and-left', color: 'text-purple', desc: 'Transform 1 video or article into X threads, LinkedIn posts, and Reels.' },
  { id: 'find-clips', title: 'Clip Finder', cat: 'MEDIA & CLIPS', icon: 'fa-scissors', color: 'text-purple', desc: 'Analyze transcripts to highlight top viral short-form clip timestamps.' },
  { id: 'thumbnail-ideas', title: 'Thumbnail Ideator', cat: 'MEDIA & CLIPS', icon: 'fa-image', color: 'text-cyan', desc: 'Generate visual thumbnail concepts, contrast tips, and Midjourney prompts.' },
  { id: 'podcast-assistant', title: 'Podcast Assistant', cat: 'MEDIA & CLIPS', icon: 'fa-microphone', color: 'text-purple', desc: 'Generate show notes, chapter timestamps, key quotes, and guest questions.' },
  { id: 'cta-generator', title: 'CTA Generator', cat: 'MEDIA & CLIPS', icon: 'fa-bullhorn', color: 'text-emerald', desc: 'High-converting call-to-actions tailored for lead magnets and sales.' },

  { id: 'analyze-comments', title: 'Comment Analyzer', cat: 'AUDIENCE & RESEARCH', icon: 'fa-comments', color: 'text-cyan', desc: 'Extract sentiment scores, FAQs, audience pain points, and auto-replies.' },
  { id: 'comment-to-content', title: 'Comment-to-Content', cat: 'AUDIENCE & RESEARCH', icon: 'fa-comment-dots', color: 'text-purple', desc: 'Turn viewer questions and comments into new script outlines and concepts.' },
  { id: 'research-assistant', title: 'Creator Research Assistant', cat: 'AUDIENCE & RESEARCH', icon: 'fa-microscope', color: 'text-amber', desc: 'Deep dive research into key facts, competitor blindspots, and angles.' },

  { id: 'workspace', title: 'Creator Workspace (Kanban)', cat: 'BUSINESS & WORKSPACE', icon: 'fa-layer-group', color: 'text-cyan', desc: 'Kanban board pipeline to track content from Idea to Published.' },
  { id: 'brand-pitch', title: 'Brand Pitch Builder', cat: 'BUSINESS & WORKSPACE', icon: 'fa-handshake', color: 'text-amber', desc: 'Draft sponsorship outreach emails, rate card proposals, and metrics.' },
  { id: 'second-brain', title: 'Creator Second Brain', cat: 'BUSINESS & WORKSPACE', icon: 'fa-brain', color: 'text-cyan', desc: 'Knowledge vault and semantic query engine for your accumulated notes.' },
  { id: 'collaboration-finder', title: 'Collaboration Finder', cat: 'BUSINESS & WORKSPACE', icon: 'fa-users-viewfinder', color: 'text-purple', desc: 'Find ideal creator collaboration matches, cross-promo concepts, and pitches.' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderToolsGrid();
  loadKanbanBoard();
  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
  }
});

// Render Tools Grid on Dashboard
function renderToolsGrid() {
  const container = document.getElementById('toolsGrid');
  if (!container) return;

  container.innerHTML = TOOLS.map(t => `
    <div class="tool-card" onclick="switchTab('${t.id}')">
      <div>
        <div class="tool-card-header">
          <div class="tool-card-icon ${t.color}">
            <i class="fa-solid ${t.icon}"></i>
          </div>
          <h4>${t.title}</h4>
        </div>
        <p>${t.desc}</p>
      </div>
      <div class="tool-card-footer">
        Open Tool <i class="fa-solid fa-arrow-right"></i>
      </div>
    </div>
  `).join('');
}

// Filter Tools via Search
function filterTools() {
  const query = document.getElementById('toolSearch').value.toLowerCase();
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  
  navItems.forEach(item => {
    const name = item.getAttribute('data-name') || item.innerText;
    if (name.toLowerCase().includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });

  const cards = document.querySelectorAll('.tool-card');
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(query) ? 'flex' : 'none';
  });
}

// Tab Switching
function switchTab(tabId, el) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  if (el) {
    el.classList.add('active');
  } else {
    const matchingNav = document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
    if (matchingNav) matchingNav.classList.add('active');
  }

  // Update Header Title
  const tool = TOOLS.find(t => t.id === tabId);
  const titleEl = document.getElementById('pageTitle');
  const subEl = document.getElementById('pageSubtitle');

  if (tabId === 'dashboard') {
    titleEl.innerText = 'Executive Dashboard';
    subEl.innerText = 'Complete overview of your content engine and AI micro-apps.';
  } else if (tabId === 'autonomous-pipeline') {
    titleEl.innerText = 'Autonomous 7-Step Pipeline';
    subEl.innerText = 'Simultaneous end-to-end content generation from a single seed idea.';
  } else if (tool) {
    titleEl.innerText = tool.title;
    subEl.innerText = `${tool.cat} • ${tool.desc}`;
  }
}

// API Key Modal
function openApiKeyModal() {
  document.getElementById('apiKeyModal').classList.remove('hidden');
}
function closeApiKeyModal() {
  document.getElementById('apiKeyModal').classList.add('hidden');
}
function saveApiKey() {
  apiKey = document.getElementById('apiKeyInput').value.trim();
  localStorage.setItem('ASADI_GEMINI_KEY', apiKey);
  closeApiKeyModal();
  alert('API Key settings saved!');
}

// Helper: Make API Post
async function postAPI(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, apiKey })
    });
    return await response.json();
  } catch (err) {
    console.error('API Call Error:', err);
    return { error: err.message };
  }
}

// Render Output Helper
function displayOutput(containerId, title, data, rawMarkdown = null) {
  const container = document.getElementById(containerId);
  container.classList.remove('hidden');

  let formattedText = '';
  if (rawMarkdown) {
    formattedText = rawMarkdown;
  } else if (typeof data === 'object') {
    formattedText = JSON.stringify(data, null, 2);
  } else {
    formattedText = String(data);
  }

  container.innerHTML = `
    <div class="output-header">
      <h4><i class="fa-solid fa-sparkles text-accent"></i> ${title}</h4>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" onclick="copyToClipboard('${containerId}')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary" onclick="sendToKanban('${title}')"><i class="fa-solid fa-plus"></i> Send to Workspace</button>
      </div>
    </div>
    <div class="output-body" id="${containerId}-text">${escapeHtml(formattedText)}</div>
  `;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function copyToClipboard(containerId) {
  const text = document.getElementById(`${containerId}-text`).innerText;
  navigator.clipboard.writeText(text);
  alert('Copied output to clipboard!');
}

function sendToKanban(title) {
  fetch('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `Draft: ${title}`, status: 'idea', category: 'AI Generated' })
  }).then(() => {
    alert(`Saved "${title}" to your Content Workspace!`);
    loadKanbanBoard();
  });
}

// ==========================================
// TOOL EXECUTIONS
// ==========================================

// Autonomous Pipeline
async function runAutonomousPipeline() {
  const seedIdea = document.getElementById('autoSeedIdea').value;
  const outputEl = document.getElementById('pipelineOutput');
  outputEl.classList.remove('hidden');
  outputEl.innerHTML = `<p><i class="fa-solid fa-spinner fa-spin text-accent"></i> Running 7-Step Autonomous Pipeline...</p>`;

  const res = await postAPI('/api/autonomous-pipeline', { seedIdea });
  if (res.result) {
    let md = '';
    if (typeof res.result === 'object') {
      md = Object.entries(res.result).map(([step, content]) => `### 📌 ${step.replace(/_/g, ' ')}\n${content}\n`).join('\n---\n\n');
    } else {
      md = res.result;
    }
    displayOutput('pipelineOutput', 'Autonomous Pipeline Output (7 Steps)', res.result, md);
  }
}

// 01. Content Idea Generator
async function runIdeaGenerator() {
  const topic = document.getElementById('ideaTopic').value;
  const audience = document.getElementById('ideaAudience').value;
  const platform = document.getElementById('ideaPlatform').value;
  const count = document.getElementById('ideaCount').value;

  const res = await postAPI('/api/generate-ideas', { topic, audience, platform, count });
  displayOutput('ideaOutput', 'Generated Content Ideas', res.result);
}

// 05. Reel Script Builder
async function runReelScript() {
  const topic = document.getElementById('reelTopic').value;
  const targetDuration = document.getElementById('reelDuration').value;

  const res = await postAPI('/api/reel-script', { topic, targetDuration });
  displayOutput('reelOutput', 'Short-Form Reel Script', res.result);
}

// 02. Repurposer
async function runRepurposer() {
  const contentInput = document.getElementById('repurposeInput').value;
  const res = await postAPI('/api/repurpose', { contentInput });
  displayOutput('repurposeOutput', 'Multi-Platform Repurposed Drafts', res.result);
}

// 03. Hook Generator
async function runHookGenerator() {
  const topic = document.getElementById('hookTopic').value;
  const tone = document.getElementById('hookTone').value;

  const res = await postAPI('/api/generate-hooks', { topic, tone });
  displayOutput('hookOutput', 'Viral Hooks List', res.result);
}

// 04. Daily Content Planner
async function runDailyPlanner() {
  const niche = document.getElementById('plannerNiche').value;
  const goal = document.getElementById('plannerGoal').value;

  const res = await postAPI('/api/daily-planner', { niche, goal });
  displayOutput('plannerOutput', '7-Day Content Plan', res.result);
}

// 06. Clip Finder
async function runClipFinder() {
  const transcript = document.getElementById('clipTranscript').value;
  const res = await postAPI('/api/find-clips', { transcript });
  displayOutput('clipOutput', 'Viral Video Clips & Timestamps', res.result);
}

// 07. Thumbnail Ideator
async function runThumbnailIdeator() {
  const videoTitle = document.getElementById('thumbTitle').value;
  const res = await postAPI('/api/thumbnail-ideas', { videoTitle });
  displayOutput('thumbOutput', 'Thumbnail Concepts & Prompts', res.result);
}

// 08. Caption Assistant
async function runCaptionAssistant() {
  const contentDescription = document.getElementById('captionInput').value;
  const platform = document.getElementById('captionPlatform').value;
  const tone = document.getElementById('captionTone').value;

  const res = await postAPI('/api/caption-assistant', { contentDescription, platform, tone });
  displayOutput('captionOutput', 'Platform Ready Caption', res.result);
}

// 09. CTA Generator
async function runCtaGenerator() {
  const goal = document.getElementById('ctaGoal').value;
  const platform = document.getElementById('ctaPlatform').value;

  const res = await postAPI('/api/cta-generator', { goal, platform });
  displayOutput('ctaOutput', 'High Converting CTAs', res.result);
}

// 10. Comment Analyzer
async function runCommentAnalyzer() {
  const commentsText = document.getElementById('commentText').value;
  const res = await postAPI('/api/analyze-comments', { commentsText });
  displayOutput('commentOutput', 'Audience Comment Sentiment & FAQs', res.result);
}

// 11. Comment to Content
async function runCommentToContent() {
  const commentInput = document.getElementById('commentQuery').value;
  const res = await postAPI('/api/comment-to-content', { commentInput });
  displayOutput('commentContentOutput', 'Transformed Content Concepts', res.result);
}

// 12. Research Assistant
async function runResearchAssistant() {
  const topic = document.getElementById('researchTopic').value;
  const res = await postAPI('/api/research-assistant', { topic });
  displayOutput('researchOutput', 'Research Brief & Content Angles', res.result);
}

// 13. Voice Replicator
async function runVoiceReplicator() {
  const sampleText = document.getElementById('voiceSample').value;
  const newTopic = document.getElementById('voiceTopic').value;

  const res = await postAPI('/api/voice-replicator', { sampleText, newTopic });
  displayOutput('voiceOutput', 'Voice Cloned Content Draft', res.result);
}

// 14. Podcast Assistant
async function runPodcastAssistant() {
  const transcriptOrNotes = document.getElementById('podcastNotes').value;
  const res = await postAPI('/api/podcast-assistant', { transcriptOrNotes });
  displayOutput('podcastOutput', 'Podcast Show Notes & Chapters', res.result);
}

// 16. Content Recycler
async function runContentRecycler() {
  const pastPostText = document.getElementById('recycleInput').value;
  const res = await postAPI('/api/recycle-content', { pastPostText });
  displayOutput('recycleOutput', 'Recycled Evergreen Post Drafts', res.result);
}

// 17. Brand Pitch Builder
async function runBrandPitch() {
  const creatorNiche = document.getElementById('pitchNiche').value;
  const audienceSize = document.getElementById('pitchAudience').value;
  const brandName = document.getElementById('pitchBrand').value;
  const pitchGoal = document.getElementById('pitchGoal').value;

  const res = await postAPI('/api/brand-pitch', { creatorNiche, audienceSize, brandName, pitchGoal });
  displayOutput('pitchOutput', 'Sponsorship Email & Proposal', res.result);
}

// 18. Content Director
async function runContentDirector() {
  const channelGoal = document.getElementById('directorGoal').value;
  const monthlyTheme = document.getElementById('directorTheme').value;

  const res = await postAPI('/api/content-director', { channelGoal, monthlyTheme });
  displayOutput('directorOutput', 'Strategic Production Masterplan', res.result);
}

// 19. Second Brain
async function saveSecondBrainNote() {
  const topic = document.getElementById('sbTopic').value;
  const note = document.getElementById('sbNote').value;
  if (!topic || !note) return alert('Please enter topic and note!');

  await fetch('/api/second-brain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, note })
  });

  document.getElementById('sbTopic').value = '';
  document.getElementById('sbNote').value = '';
  alert('Saved to Second Brain Vault!');
}

async function querySecondBrain() {
  const question = document.getElementById('sbQuery').value;
  const res = await postAPI('/api/second-brain/query', { question });
  displayOutput('sbOutput', 'Second Brain Semantic Answer', res.result);
}

// 20. Screenplay
async function runScreenplay() {
  const concept = document.getElementById('scriptConcept').value;
  const res = await postAPI('/api/screenplay', { concept });
  displayOutput('screenplayOutput', 'Screenplay Scene Output', res.result);
}

// 22. Creative Producer
async function runCreativeProducer() {
  const creatorGoal = document.getElementById('producerGoal').value;
  const targetBudget = document.getElementById('producerBudget').value;

  const res = await postAPI('/api/creative-producer', { creatorGoal, targetBudget });
  displayOutput('producerOutput', 'Executive Production Plan', res.result);
}

// 23. Collaboration Finder
async function runCollaborationFinder() {
  const creatorNiche = document.getElementById('collabNiche').value;
  const subscriberCount = document.getElementById('collabSubs').value;

  const res = await postAPI('/api/collaboration-finder', { creatorNiche, subscriberCount });
  displayOutput('collabOutput', 'Collaboration Matches', res.result);
}

// ==========================================
// KANBAN BOARD MANAGEMENT
// ==========================================
async function loadKanbanBoard() {
  try {
    const res = await fetch('/api/workspace');
    const cards = await res.json();
    renderKanbanCards(cards);
  } catch (err) {
    console.error('Failed to load Kanban workspace:', err);
  }
}

function renderKanbanCards(cards) {
  const statuses = ['idea', 'scripting', 'review', 'published'];
  statuses.forEach(st => {
    const colEl = document.getElementById(`cards-${st}`);
    const countEl = document.getElementById(`count-${st}`);
    if (!colEl) return;

    const filtered = cards.filter(c => c.status === st);
    countEl.innerText = filtered.length;

    colEl.innerHTML = filtered.map(c => `
      <div class="kanban-card" onclick="moveKanbanCard('${c.id}', '${st}')">
        <h5>${escapeHtml(c.title)}</h5>
        <p><i class="fa-solid fa-tag"></i> ${c.category || 'General'} • ${c.date || ''}</p>
        <span style="font-size:0.7rem; color:var(--accent-cyan); margin-top:6px; display:inline-block;">Click to Move &rarr;</span>
      </div>
    `).join('');
  });
}

async function moveKanbanCard(id, currentStatus) {
  const statusCycle = { 'idea': 'scripting', 'scripting': 'review', 'review': 'published', 'published': 'idea' };
  const newStatus = statusCycle[currentStatus];

  await fetch(`/api/workspace/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });

  loadKanbanBoard();
}

function openNewCardModal() {
  const title = prompt('Enter content title for Workspace card:');
  if (title) {
    fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status: 'idea', category: 'Custom' })
    }).then(() => loadKanbanBoard());
  }
}
