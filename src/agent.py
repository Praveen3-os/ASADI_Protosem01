import os
import google.generativeai as genai
from typing import Dict, Any

class ReelScriptAgent:
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def generate_script(self, topic: str, tone: str = "engaging") -> Dict[str, Any]:
        """
        Agentic function to generate a 30-60 second reel script.
        Breaks down the topic into Hook, Body, and CTA.
        """
        print(f"Agent received task: Generate reel script for topic: '{topic}' with tone: '{tone}'")
        
        thoughts = [
            f"Analyzing topic: '{topic}'",
            f"Determining appropriate structure for a {tone} 30-60 second short-form video...",
            "Formulating a strong hook to capture attention in the first 3 seconds...",
            "Structuring the body to deliver high value quickly...",
            "Crafting a clear Call to Action (CTA)...",
            "Executing LLM generation call..."
        ]
        
        if not self.model:
            # Fallback mock response if no API key is provided
            thoughts.append("Warning: GEMINI_API_KEY not found. Using simulated response.")
            return {
                "agent": "Reel_Script_AI",
                "thoughts": thoughts,
                "result": {
                    "hook": f"Stop scrolling! Did you know this one trick about {topic}?",
                    "body": f"Most people get {topic} completely wrong. Here is the secret: First, focus on the core fundamentals. Second, apply the 80/20 rule to maximize your results. Finally, stay consistent.",
                    "cta": "Save this video for later and follow for more daily tips!"
                }
            }

        try:
            prompt = f"""
            You are an expert short-form video producer. Create a highly engaging 30-60 second reel script.
            Topic: {topic}
            Tone: {tone}
            
            Format your response STRICTLY as a JSON object with exactly three keys:
            "hook": The first 3-5 seconds to grab attention.
            "body": The main content delivering value (20-40 seconds).
            "cta": A strong call to action (5-10 seconds).
            """
            
            response = self.model.generate_content(prompt)
            # Basic parsing to extract JSON (in a production app, use structured outputs)
            import json
            import re
            
            text = response.text
            # Extract JSON block if it's wrapped in markdown
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                data = json.loads(text)
                
            thoughts.append("Successfully generated and parsed script.")
            return {
                "agent": "Reel_Script_AI",
                "thoughts": thoughts,
                "result": data
            }
            
        except Exception as e:
            thoughts.append(f"Error during generation: {str(e)}")
            return {
                "agent": "Reel_Script_AI",
                "thoughts": thoughts,
                "error": str(e)
            }
