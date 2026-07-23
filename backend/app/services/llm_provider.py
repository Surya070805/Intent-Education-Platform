import os
import json
from abc import ABC, abstractmethod
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMProvider(ABC):
    @abstractmethod
    async def generate_intent_profile(self, user_context: dict) -> dict:
        """
        Takes user context (career goal, experience, style, etc.)
        and generates a structured Learning Intent Profile.
        """
    @abstractmethod
    async def generate_explanation(self, user_context: dict, resource_title: str) -> str:
        """
        Generates an explanation of why a resource is relevant to the user.
        """
        pass
        
    @abstractmethod
    async def analyze_session_feedback(self, profile: dict, notes: list, rating: int) -> dict:
        """
        Analyzes session notes and rating to propose updates to the user's intent profile.
        """
        pass

    @abstractmethod
    async def check_guard_relevance(self, career_goal: str, video_title: str, channel_name: str) -> dict:
        """
        Checks if a video is relevant to the user's career goal or if it is a distraction.
        """
        pass

    @abstractmethod
    async def chat_with_coach(self, messages: list, profile: dict, context: dict) -> str:
        """
        Conducts a multi-turn conversation with the AI coach, providing context.
        """
        pass

    @abstractmethod
    async def tag_resource_skills(self, title: str, description: str, channel: str, available_skills: list[dict]) -> list[str]:
        """
        Given a resource's metadata and a list of available skill slugs,
        returns the slugs that this resource teaches.
        """
        pass

    @abstractmethod
    async def assess_skill_from_session(self, session_notes: str, rating: int, skill_name: str) -> float:
        """
        Given session notes and a rating, returns a confidence score (0.0-1.0)
        representing how much the learner understood the skill.
        """
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key, 
                base_url="https://openrouter.ai/api/v1" if "or-v1" in self.api_key else None
            )
        else:
            self.client = None

    async def generate_intent_profile(self, user_context: dict) -> dict:
        if not self.client:
            # Fallback/mock if not connected
            return {
                "inferred_skills": ["python", "javascript", "react"],
                "focus_areas": ["backend development", "api design"],
                "summary": "User wants to be a full stack developer with a focus on python backend."
            }

        prompt = f"""
        You are an expert career and learning coach. Based on the following user inputs, generate a structured Learning Intent Profile.
        
        User Inputs:
        Career Goal: {user_context.get('career_goal')}
        Experience Level: {user_context.get('experience')}
        Learning Style: {user_context.get('learning_style')}
        Daily Study Time (minutes): {user_context.get('daily_minutes')}
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
            "inferred_skills": ["skill1", "skill2"],
            "focus_areas": ["area1", "area2"],
            "summary": "A short 2-sentence summary of their learning intent"
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You output strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error generating intent profile: {e}")
            # Fallback
            return {
                "inferred_skills": [],
                "focus_areas": [],
                "summary": "Failed to generate profile due to AI error."
            }
            
    async def generate_explanation(self, user_context: dict, resource_title: str) -> str:
        if not self.client:
            return "This resource is highly recommended based on your career goals and current skill gaps."
            
        prompt = f"""
        You are an expert career and learning coach. Explain in exactly one short paragraph (under 50 words) 
        why the following resource is relevant to the user right now.
        
        User Goal: {user_context.get('career_goal')}
        User Profile: {user_context.get('summary')}
        
        Resource Title: {resource_title}
        
        Explanation should answer: Why this, why now, and what does it unlock? Keep it encouraging.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful learning assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return "This resource aligns well with your current learning path."

    async def analyze_session_feedback(self, profile: dict, notes: list, rating: int) -> dict:
        if not self.client:
            # Fallback/mock
            return {
                "topics_to_add": ["Advanced Topics"],
                "topics_to_remove": [],
                "skill_level_adjustment": "Maintain current level" if rating > 3 else "Review fundamentals"
            }
            
        prompt = f"""
        You are an AI learning coach. The user just completed a learning session.
        
        Current Profile: {json.dumps(profile)}
        User's Comprehension Rating (1-5): {rating}
        User's Notes: {json.dumps(notes)}
        
        Based on the rating and the depth/confusion expressed in their notes, how should their learning profile be updated?
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
            "topics_to_add": ["new concept 1", "new concept 2"],
            "topics_to_remove": ["concept they mastered"],
            "skill_level_adjustment": "string describing if we should increase difficulty, decrease, or keep same"
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You output strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error analyzing feedback: {e}")
            return {
                "topics_to_add": [],
                "topics_to_remove": [],
                "skill_level_adjustment": "Maintain current level"
            }

    async def check_guard_relevance(self, career_goal: str, video_title: str, channel_name: str) -> dict:
        if not self.client:
            return {
                "is_relevant": True,
                "reason": "Mock fallback: allowed."
            }

        prompt = f"""
        You are an AI Guard Mode for an education platform. The user's career goal is: "{career_goal}".
        They are currently watching a YouTube video with the title: "{video_title}" by the channel "{channel_name}".

        Is this video relevant to their career goal, or is it a distraction (e.g. gaming, entertainment, unrelated content)?
        Note: General productivity, tech news, or soft skills can be considered marginally relevant, but pure entertainment is a distraction.

        Respond ONLY with a valid JSON object matching this schema:
        {{
            "is_relevant": boolean,
            "reason": "A short 1-2 sentence explanation of why this is or isn't relevant to their goal."
        }}
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You output strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=150
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error checking guard relevance: {e}")
            return {
                "is_relevant": True,
                "reason": "Failed to check relevance, defaulting to allowed."
            }

    async def chat_with_coach(self, messages: list, profile: dict, context: dict) -> str:
        if not self.client:
            return "Mock Coach Response: It seems I am offline, but keep practicing!"
            
        system_prompt = f"""
        You are an expert AI Learning Coach embedded directly into an education platform.
        You are talking to a student. Your job is to answer their questions accurately, 
        encourage them, and explain concepts simply according to their experience level.

        User's Career Goal: {profile.get('career', {}).get('name', 'Unknown')}
        User's Experience Level: {profile.get('experience', 'beginner')}
        
        Current Video Context (what they are watching right now):
        Video Title: {context.get('title', 'Unknown')}
        Channel: {context.get('channel_name', 'Unknown')}
        Skills Taught: {', '.join(context.get('skills', []))}
        
        Keep your answers concise, encouraging, and focused on the topic.
        """
        
        api_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            api_messages.append({"role": m["role"], "content": m["content"]})
            
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=api_messages,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error chatting with coach: {e}")
            return "Sorry, I ran into an error trying to answer your question."

    async def tag_resource_skills(self, title: str, description: str, channel: str, available_skills: list[dict]) -> list[str]:
        """Uses LLM to identify which skills a resource teaches."""
        if not self.client or not available_skills:
            return []

        skill_list = ", ".join([f"{s['slug']} ({s['name']})" for s in available_skills])
        prompt = f"""
        You are a curriculum expert. Analyze the following YouTube video and identify which skills it teaches.

        Video Title: {title}
        Channel: {channel}
        Description: {description[:500] if description else 'N/A'}

        Available skill slugs:
        {skill_list}

        Return ONLY a JSON object with a single key "skills" containing a list of slug strings that this video teaches.
        Only include skills that are clearly and directly taught. Maximum 3 skills.
        Example: {{"skills": ["python-fundamentals", "data-wrangling-pandas"]}}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You output strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=100
            )
            content = json.loads(response.choices[0].message.content)
            return content.get("skills", [])
        except Exception as e:
            print(f"Error tagging resource skills: {e}")
            return []

    async def assess_skill_from_session(self, session_notes: str, rating: int, skill_name: str) -> float:
        """Returns a confidence score (0.0-1.0) based on session quality."""
        if not self.client:
            # Fallback: use rating as a proxy
            return min(rating / 5.0, 1.0)

        prompt = f"""
        A learner just finished studying "{skill_name}" and gave themselves a {rating}/5 rating.
        Their notes: "{session_notes}"

        Based on the depth and clarity of their notes and the self-rating,
        estimate their comprehension confidence as a number between 0.0 and 1.0.
        
        Return ONLY a JSON object: {{"confidence": 0.7}}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You output strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=50
            )
            content = json.loads(response.choices[0].message.content)
            return float(content.get("confidence", rating / 5.0))
        except Exception as e:
            print(f"Error assessing skill from session: {e}")
            return rating / 5.0

# Singleton instance
llm_provider = OpenAIProvider()
