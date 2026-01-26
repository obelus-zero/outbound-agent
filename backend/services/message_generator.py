from anthropic import Anthropic
from config import settings
import json


class MessageGenerator:
    """Service for generating personalized outreach messages using Claude"""

    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL

    async def generate(
        self,
        prospect_data: dict,
        research_data: dict,
        icp_context: dict,
        channel: str,
        message_type: str = "initial"
    ) -> dict:
        """
        Generate a personalized outreach message.

        Args:
            prospect_data: Basic prospect info (name, title, company)
            research_data: Research results from EnrichmentService
            icp_context: ICP configuration for messaging guidance
            channel: 'email', 'linkedin', 'linkedin_inmail', 'phone'
            message_type: 'initial', 'follow_up_1', 'follow_up_2', 'breakup'

        Returns:
            dict with subject (if email), body/content, and hook used
        """

        # Channel-specific guidelines
        channel_guidelines = {
            "email": {
                "max_length": 150,
                "include_subject": True,
                "style": "Professional but conversational. Short paragraphs. Clear CTA."
            },
            "linkedin": {
                "max_length": 300,
                "include_subject": False,
                "style": "Casual and friendly. Like messaging a colleague. No formal salutations."
            },
            "linkedin_inmail": {
                "max_length": 200,
                "include_subject": True,
                "style": "Professional but personal. Reference their profile/activity."
            },
            "linkedin_connection": {
                "max_length": 100,
                "include_subject": False,
                "style": "Very brief. Just explain why you're connecting."
            },
            "phone": {
                "max_length": 100,
                "include_subject": False,
                "style": "Talking points and key questions to ask."
            }
        }

        # Message type guidance
        type_guidance = {
            "initial": "First touch. Focus on providing value and sparking curiosity. Don't be pushy.",
            "follow_up_1": "Gentle follow-up. Provide additional value or a different angle.",
            "follow_up_2": "Try a different approach. Maybe share a relevant case study or insight.",
            "breakup": "Final attempt. Create urgency but be respectful. Offer to reconnect later."
        }

        channel_config = channel_guidelines.get(channel, channel_guidelines["email"])
        messaging_config = icp_context.get("messaging", {})

        # Build the prompt
        prompt = f"""You are an expert cold outbound copywriter. Write a {channel} message for sales outreach.

PROSPECT:
- Name: {prospect_data.get('name', 'there')}
- First Name: {prospect_data.get('first_name', prospect_data.get('name', 'there').split()[0])}
- Title: {prospect_data.get('title', 'Unknown')}
- Company: {prospect_data.get('company', 'Unknown')}

RESEARCH INSIGHTS:
{json.dumps(research_data, indent=2) if research_data else 'No research available'}

WHAT WE'RE SELLING:
- Product: {icp_context.get('product', {}).get('name', 'our product')}
- Company: {icp_context.get('product', {}).get('company', '')}
- Description: {icp_context.get('product', {}).get('description', '')}

VALUE PROPOSITIONS:
{chr(10).join('- ' + vp for vp in messaging_config.get('value_props', []))}

PAIN POINTS WE ADDRESS:
{chr(10).join('- ' + pp for pp in messaging_config.get('pain_points', []))}

CHANNEL: {channel}
MESSAGE TYPE: {message_type}
GUIDANCE: {type_guidance.get(message_type, '')}

STYLE REQUIREMENTS:
- Maximum {channel_config['max_length']} words
- Style: {channel_config['style']}
- Tone: {messaging_config.get('tone', 'professional')}
- NEVER use these phrases: {', '.join(messaging_config.get('avoid', []))}

CUSTOM INSTRUCTIONS:
{messaging_config.get('instructions', 'None')}

IMPORTANT RULES:
1. Personalize using the research insights
2. Lead with value, not features
3. Keep it short and scannable
4. Include ONE clear call-to-action
5. Sound human, not robotic
6. Don't be salesy or pushy
7. Reference something specific about them or their company

Respond in JSON format:
{{
    {"'subject': '...'," if channel_config['include_subject'] else ""}
    "content": "The message body",
    "hook": "The personalization element used"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

            # Parse JSON response
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]

                result = json.loads(content)

                # Normalize response
                if "body" in result and "content" not in result:
                    result["content"] = result.pop("body")

                return result

            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "content": content,
                    "hook": "Unable to parse hook"
                }

        except Exception as e:
            raise Exception(f"Message generation failed: {str(e)}")

    async def generate_sequence_messages(
        self,
        prospect_data: dict,
        research_data: dict,
        icp_context: dict,
        sequence_steps: list
    ) -> list:
        """Generate messages for all steps in a sequence"""
        messages = []

        for step in sequence_steps:
            if step["type"] in ["email", "linkedin", "linkedin_inmail", "linkedin_connection"]:
                msg = await self.generate(
                    prospect_data=prospect_data,
                    research_data=research_data,
                    icp_context=icp_context,
                    channel=step["type"],
                    message_type=step.get("message_type", "initial")
                )
                messages.append({
                    "step_order": step.get("order", 0),
                    "channel": step["type"],
                    **msg
                })

        return messages
