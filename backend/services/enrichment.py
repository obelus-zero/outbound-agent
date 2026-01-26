from anthropic import Anthropic
from config import settings
import json


class EnrichmentService:
    """Service for researching and enriching prospect data using Claude"""

    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL

    async def research_prospect(self, prospect_data: dict, icp_context: dict) -> dict:
        """
        Research a prospect using Claude AI.
        Returns structured data about the prospect including personalization hooks.
        """
        prompt = f"""You are a sales research assistant. Research the following prospect and provide insights for cold outbound messaging.

PROSPECT INFORMATION:
- Name: {prospect_data.get('name', 'Unknown')}
- Title: {prospect_data.get('title', 'Unknown')}
- Company: {prospect_data.get('company', 'Unknown')}
- LinkedIn: {prospect_data.get('linkedin_url', 'Not provided')}
- Twitter: {prospect_data.get('twitter_url', 'Not provided')}

ICP CONTEXT (What we're selling):
- Product: {icp_context.get('product', {}).get('name', 'Unknown')}
- Description: {icp_context.get('product', {}).get('description', '')}
- Target Industries: {', '.join(icp_context.get('target_company', {}).get('industries', []))}
- Pain Points We Solve: {', '.join(icp_context.get('messaging', {}).get('pain_points', []))}
- Value Props: {', '.join(icp_context.get('messaging', {}).get('value_props', []))}

Based on available public information, provide:

1. SUMMARY: A 2-3 sentence summary of who this person is and their likely priorities.

2. PERSONALIZATION HOOKS: 3-5 specific things we could reference to personalize outreach (recent company news, their background, mutual interests, etc.)

3. PAIN POINTS: What challenges might they face that our product solves?

4. ICP SIGNALS: How well does this prospect match our ICP? List positive and negative signals.

5. RECOMMENDED APPROACH: How should we approach this person? What angle is most likely to resonate?

Respond in JSON format:
{{
    "summary": "...",
    "personalization_hooks": ["...", "..."],
    "likely_pain_points": ["...", "..."],
    "icp_signals_found": {{
        "positive_signals": ["...", "..."],
        "negative_signals": ["...", "..."],
        "confidence_score": 0-100
    }},
    "recommended_approach": "...",
    "talking_points": ["...", "..."],
    "questions_to_ask": ["...", "..."]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse JSON response
            content = response.content[0].text

            # Try to extract JSON from response
            try:
                # Handle potential markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                result = json.loads(content)
            except json.JSONDecodeError:
                # If JSON parsing fails, create structured response from text
                result = {
                    "summary": content[:500],
                    "personalization_hooks": [],
                    "likely_pain_points": [],
                    "icp_signals_found": {
                        "positive_signals": [],
                        "negative_signals": [],
                        "confidence_score": 50
                    },
                    "recommended_approach": "",
                    "talking_points": [],
                    "questions_to_ask": []
                }

            return result

        except Exception as e:
            raise Exception(f"Research failed: {str(e)}")

    async def enrich_company(self, company_name: str, domain: str = None) -> dict:
        """Enrich company data using Claude"""
        prompt = f"""Research the company "{company_name}"{f' (website: {domain})' if domain else ''}.

Provide the following information in JSON format:
{{
    "description": "Brief company description",
    "industry": "Primary industry",
    "employee_count_estimate": "e.g., 100-500",
    "funding_stage": "e.g., Series B, Public, Bootstrapped",
    "tech_stack_likely": ["technology1", "technology2"],
    "recent_news": ["news item 1", "news item 2"],
    "competitors": ["competitor1", "competitor2"],
    "key_challenges": ["challenge1", "challenge2"]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                return json.loads(content)
            except json.JSONDecodeError:
                return {"description": content[:500]}

        except Exception as e:
            return {"error": str(e)}
