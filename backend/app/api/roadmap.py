from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, User, supabase

router = APIRouter(prefix="/api/v1/roadmap", tags=["Roadmap"])


@router.get("/")
async def get_roadmap(current_user: User = Depends(get_current_user)):
    """
    Returns the user's career roadmap: their career track, required skills
    ordered by level, and mastery progress for each skill.
    """
    if not supabase:
        return {"career": None, "skills": [], "mastery": {}}

    try:
        # 1. Get user's learning profile to find their career
        profile_res = supabase.table("learning_profiles") \
            .select("career_id, experience") \
            .eq("user_id", current_user.id) \
            .execute()

        if not profile_res.data:
            return {"career": None, "skills": [], "mastery": {}, "message": "Complete onboarding first"}

        career_id = profile_res.data[0].get("career_id")
        if not career_id:
            return {"career": None, "skills": [], "mastery": {}}

        # 2. Get career info
        career_res = supabase.table("careers") \
            .select("*") \
            .eq("id", career_id) \
            .execute()
        career = career_res.data[0] if career_res.data else None

        # 3. Get all skills for this career, ordered by level
        level_order = {"foundation": 0, "beginner": 0, "intermediate": 1, "advanced": 2}
        skills_res = supabase.table("skills") \
            .select("*") \
            .eq("career_id", career_id) \
            .execute()

        skills = sorted(skills_res.data or [], key=lambda s: level_order.get(s.get("level", ""), 0))

        # 4. Get skill prerequisites
        skill_ids = [s["id"] for s in skills]
        prereqs_res = supabase.table("skill_prerequisites") \
            .select("*") \
            .execute()
        prereqs = prereqs_res.data or []

        # Build prerequisite map
        prereq_map = {}
        for p in prereqs:
            sid = p["skill_id"]
            if sid not in prereq_map:
                prereq_map[sid] = []
            prereq_map[sid].append(p["prerequisite_id"])

        # 5. Get user's mastery levels
        mastery_res = supabase.table("user_skill_mastery") \
            .select("skill_id, mastery_level") \
            .eq("user_id", current_user.id) \
            .execute()

        mastery_map = {}
        for m in (mastery_res.data or []):
            mastery_map[m["skill_id"]] = m["mastery_level"]

        # 6. Enrich skills with mastery and prerequisites
        enriched_skills = []
        for skill in skills:
            sid = skill["id"]
            skill_prereqs = prereq_map.get(sid, [])
            # A skill is unlocked if all prerequisites have mastery >= 0.5
            is_unlocked = all(mastery_map.get(p, 0) >= 0.5 for p in skill_prereqs) if skill_prereqs else True

            enriched_skills.append({
                **skill,
                "mastery": mastery_map.get(sid, 0.0),
                "prerequisites": skill_prereqs,
                "is_unlocked": is_unlocked,
                "status": "completed" if mastery_map.get(sid, 0) >= 0.8
                    else "in_progress" if mastery_map.get(sid, 0) > 0
                    else "unlocked" if is_unlocked
                    else "locked"
            })

        return {
            "career": career,
            "skills": enriched_skills,
            "total_skills": len(enriched_skills),
            "completed_skills": sum(1 for s in enriched_skills if s["status"] == "completed"),
            "completion_percent": round(
                sum(1 for s in enriched_skills if s["status"] == "completed") / max(len(enriched_skills), 1) * 100
            )
        }
    except Exception as e:
        print(f"Error fetching roadmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed")
async def seed_skills():
    """
    Seeds career tracks and skills with prerequisite relationships.
    """
    if not supabase:
        return {"status": "skipped"}

    careers_data = [
        {
            "name": "Full-Stack Development",
            "slug": "full-stack-dev",
            "description": "Build complete web applications from frontend to backend.",
            "skills": [
                {"name": "HTML & CSS", "slug": "html-css", "level": "foundation", "estimated_hours": 20},
                {"name": "JavaScript Fundamentals", "slug": "javascript-fundamentals", "level": "foundation", "estimated_hours": 30},
                {"name": "Git & Version Control", "slug": "git-version-control", "level": "foundation", "estimated_hours": 8},
                {"name": "React", "slug": "react", "level": "intermediate", "estimated_hours": 40, "prereqs": ["html-css", "javascript-fundamentals"]},
                {"name": "Node.js & Express", "slug": "nodejs-express", "level": "intermediate", "estimated_hours": 35, "prereqs": ["javascript-fundamentals"]},
                {"name": "Databases & SQL", "slug": "databases-sql", "level": "intermediate", "estimated_hours": 25, "prereqs": ["javascript-fundamentals"]},
                {"name": "TypeScript", "slug": "typescript", "level": "intermediate", "estimated_hours": 20, "prereqs": ["javascript-fundamentals"]},
                {"name": "Next.js & Full-Stack", "slug": "nextjs-fullstack", "level": "advanced", "estimated_hours": 40, "prereqs": ["react", "nodejs-express"]},
                {"name": "DevOps & Deployment", "slug": "devops-deployment", "level": "advanced", "estimated_hours": 30, "prereqs": ["nodejs-express", "databases-sql"]},
                {"name": "System Design", "slug": "system-design", "level": "advanced", "estimated_hours": 35, "prereqs": ["nextjs-fullstack", "databases-sql"]},
            ]
        },
        {
            "name": "Data Science & AI",
            "slug": "data-science-ai",
            "description": "Analyze data, build models, and deploy AI solutions.",
            "skills": [
                {"name": "Python Fundamentals", "slug": "python-fundamentals", "level": "foundation", "estimated_hours": 25},
                {"name": "Statistics & Probability", "slug": "statistics-probability", "level": "foundation", "estimated_hours": 20},
                {"name": "Data Wrangling (Pandas)", "slug": "data-wrangling-pandas", "level": "foundation", "estimated_hours": 15},
                {"name": "Data Visualization", "slug": "data-visualization", "level": "intermediate", "estimated_hours": 15, "prereqs": ["python-fundamentals", "data-wrangling-pandas"]},
                {"name": "Machine Learning", "slug": "machine-learning", "level": "intermediate", "estimated_hours": 50, "prereqs": ["python-fundamentals", "statistics-probability"]},
                {"name": "SQL for Data Science", "slug": "sql-data-science", "level": "intermediate", "estimated_hours": 15, "prereqs": ["data-wrangling-pandas"]},
                {"name": "Deep Learning", "slug": "deep-learning", "level": "advanced", "estimated_hours": 45, "prereqs": ["machine-learning"]},
                {"name": "NLP & LLMs", "slug": "nlp-llms", "level": "advanced", "estimated_hours": 40, "prereqs": ["deep-learning"]},
                {"name": "MLOps & Deployment", "slug": "mlops-deployment", "level": "advanced", "estimated_hours": 30, "prereqs": ["machine-learning"]},
            ]
        }
    ]

    inserted_careers = 0
    inserted_skills = 0
    inserted_prereqs = 0

    for career_data in careers_data:
        # Upsert career
        career_row = {
            "name": career_data["name"],
            "slug": career_data["slug"],
            "description": career_data["description"],
        }
        existing = supabase.table("careers").select("id").eq("slug", career_data["slug"]).execute()
        if existing.data:
            career_id = existing.data[0]["id"]
        else:
            res = supabase.table("careers").insert(career_row).execute()
            career_id = res.data[0]["id"]
            inserted_careers += 1

        # Insert skills
        slug_to_id = {}
        for skill_data in career_data["skills"]:
            skill_row = {
                "career_id": career_id,
                "name": skill_data["name"],
                "slug": skill_data["slug"],
                "level": skill_data["level"],
                "estimated_hours": skill_data["estimated_hours"],
            }
            existing_skill = supabase.table("skills").select("id").eq("slug", skill_data["slug"]).execute()
            if existing_skill.data:
                slug_to_id[skill_data["slug"]] = existing_skill.data[0]["id"]
            else:
                res = supabase.table("skills").insert(skill_row).execute()
                slug_to_id[skill_data["slug"]] = res.data[0]["id"]
                inserted_skills += 1

        # Insert prerequisites
        for skill_data in career_data["skills"]:
            for prereq_slug in skill_data.get("prereqs", []):
                skill_id = slug_to_id.get(skill_data["slug"])
                prereq_id = slug_to_id.get(prereq_slug)
                if skill_id and prereq_id:
                    try:
                        supabase.table("skill_prerequisites").insert({
                            "skill_id": skill_id,
                            "prerequisite_id": prereq_id,
                        }).execute()
                        inserted_prereqs += 1
                    except Exception:
                        pass  # Already exists

    return {
        "status": "success",
        "inserted_careers": inserted_careers,
        "inserted_skills": inserted_skills,
        "inserted_prereqs": inserted_prereqs,
    }
