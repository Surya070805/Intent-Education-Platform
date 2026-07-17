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

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
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

# Singleton instance
llm_provider = OpenAIProvider()
