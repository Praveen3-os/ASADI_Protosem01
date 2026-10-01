require('dotenv').config();
const { Client } = require('langsmith');
const { evaluate } = require('langsmith/evaluation');
const { traceable } = require('langsmith/traceable');

// The pipeline logic to evaluate (same as in server.js, but standalone for testing)
const runAutonomousPipelineChain = traceable(async function runAutonomousPipelineChain(inputs) {
  const seedIdea = inputs.seedIdea;
  
  // Simulated synthesis output
  const pipeline = {
    step1_ResearchBrief: `Topic: ${seedIdea || 'AI Automation'}. Key Insight: Audiences retain 3x more information with structured visual breakdowns.`,
    step2_YouTubeScript: `[INTRO]: Welcome back! Today we are taking "${seedIdea || 'this concept'}" to the next level...\n[BODY]: Step 1 - Plan. Step 2 - Execute. Step 3 - Automate.`,
    step3_ShortReelScript: `[HOOK]: Stop doing ${seedIdea || 'this'} manually in 2026!\n[CTA]: Comment "AUTO" for the link.`,
    step4_TwitterThread: `1/ How to master ${seedIdea || 'content creation'} in 5 simple steps 🧵👇\n2/ Step 1...`,
    step5_LinkedInArticle: `Key lessons from automating ${seedIdea || 'our workflow'} this quarter...`,
    step6_InstagramCaption: `🚀 Ready to upgrade your creator operating system? Here is everything you need... #CreatorOS #Growth`,
    step7_PublishingSchedule: 'Scheduled: YouTube (Mon 10am), Reels (Tue/Thu 5pm), X Thread (Wed 9am), LinkedIn (Fri 8am).'
  };
  return pipeline;
}, { name: "Autonomous_7_Step_Content_Pipeline", run_type: "chain" });

// Custom Evaluator: Check if all 7 steps are present
function hasAllStepsEvaluator(run, example) {
  const outputs = run.outputs;
  const hasAll = 
    outputs.step1_ResearchBrief &&
    outputs.step2_YouTubeScript &&
    outputs.step3_ShortReelScript &&
    outputs.step4_TwitterThread &&
    outputs.step5_LinkedInArticle &&
    outputs.step6_InstagramCaption &&
    outputs.step7_PublishingSchedule;
    
  return {
    key: "has_all_7_steps",
    score: hasAll ? 1 : 0,
    comment: hasAll ? "All steps generated successfully." : "Missing one or more pipeline steps."
  };
}

// Custom Evaluator: Check if seed idea is incorporated
function incorporatesSeedIdeaEvaluator(run, example) {
  const outputs = run.outputs;
  const seedIdea = example.inputs.seedIdea;
  
  // Just check if it's in the research brief
  const includesIdea = outputs.step1_ResearchBrief.includes(seedIdea);
  
  return {
    key: "incorporates_seed_idea",
    score: includesIdea ? 1 : 0,
    comment: includesIdea ? `Seed idea '${seedIdea}' found in output.` : `Seed idea '${seedIdea}' missing.`
  };
}

async function main() {
  console.log("🚀 Starting LangSmith Evaluation for ASADI Creator OS...");
  
  const client = new Client();
  const datasetName = "Creator-OS-Autonomous-Pipeline-Test-" + Date.now();
  
  console.log(`📝 Creating dataset: ${datasetName}`);
  const dataset = await client.createDataset(datasetName, {
    description: "Evaluations for the Autonomous Content Pipeline"
  });
  
  const examples = [
    { inputs: { seedIdea: "Building AI Micro-SaaS" }, outputs: {} },
    { inputs: { seedIdea: "How to repurpose long form videos" }, outputs: {} },
    { inputs: { seedIdea: "The psychology of viral hooks" }, outputs: {} }
  ];
  
  console.log(`➕ Adding ${examples.length} examples to dataset...`);
  for (const ex of examples) {
    await client.createExample(ex.inputs, ex.outputs, { datasetId: dataset.id });
  }
  
  console.log("⏳ Running evaluations...");
  const results = await evaluate(
    (inputs) => runAutonomousPipelineChain(inputs),
    {
      data: datasetName,
      evaluators: [hasAllStepsEvaluator, incorporatesSeedIdeaEvaluator],
      experimentPrefix: "pipeline-eval",
      client: client,
    }
  );
  
  console.log("✅ Evaluation complete!");
  console.log(`View results in LangSmith UI!`);
}

main().catch(console.error);
