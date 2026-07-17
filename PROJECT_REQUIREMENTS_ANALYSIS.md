# Bloom Project Requirements Analysis

This analysis consolidates the project PDFs in this workspace into a practical build reference for Bloom, an AI-powered career learning environment.

## Source Documents Reviewed

- `Vision.md.pdf`: product vision, mission, principles, success definition.
- `PRD - Bloom.pdf`: product requirements, users, MVP scope, metrics, non-goals.
- `TRD Bloom.pdf`: engineering requirements, security, performance, APIs, observability, deployment, testing.
- `Bloom Architecture.pdf`: layered architecture, core components, data and recommendation flow.
- `Backend_Schema.md.pdf`: backend services, primary entities, storage strategy, events, caching, observability.
- `App Flow.pdf`: user lifecycle, onboarding, dashboard, sessions, feedback, revision, settings, error states.
- `AI System Design.pdf`: learner model, skill gap analysis, recommendation pipeline, explainability, AI ethics.
- `Bloom Implementation Plan.pdf`: phased engineering plan and definition of done.
- `Bloom.pdf`: long-term product, engineering, AI, business, and research roadmap.
- `Bloom (1).pdf`: UI/UX design specification.
- `Research Vision and Technical Research Roadmap.pdf`: long-term research agenda.
- `Business Strategy & Commercial Model.pdf`: monetization, segments, GTM, competitive moat.

## Product Summary

Bloom is not a course platform, LMS, social network, or content creator. It is an intelligence layer over existing educational resources. Its core job is to help a learner answer: "What should I learn next, why now, and what does it unlock?"

The product should guide learners from career intent to structured learning progress by combining:

- AI onboarding
- Learning Intent Profile
- Skill and career graph reasoning
- Personalized recommendations
- Guided learning sessions
- Progress tracking
- Feedback loops
- Explainable AI decisions
- Optional focus support through Guard Mode

## Primary Users

The initial product should focus on individual learners:

- Undergraduate and graduate students
- Self-learners
- Career switchers
- Working professionals seeking upskilling or interview preparation

Secondary and future users include universities, bootcamps, corporate learning teams, career coaches, and enterprise learning departments.

## MVP Scope

The MVP should validate whether personalized educational recommendations improve learning efficiency.

Included in MVP:

- Account creation and login
- AI onboarding
- Learning Intent Profile generation
- Career selection
- Personalized learning feed
- Personalized roadmap
- YouTube integration as the first learning source
- Basic recommendation engine
- Recommendation explanations
- Basic Guard Mode
- Learning sessions
- Basic progress tracking
- Save, dismiss, complete, and feedback actions

Excluded from MVP:

- Multi-platform integrations beyond YouTube
- Enterprise dashboards
- API platform
- Creator marketplace
- Community features
- Mobile app
- Full AI tutor or AI career coach
- Institutional cohort management

## Core User Flow

The essential application loop is:

1. Visitor opens Bloom.
2. User signs up or logs in.
3. AI onboarding captures career goal, experience, known skills, learning style, study time, language, and objectives.
4. Bloom creates a Learning Intent Profile.
5. Bloom maps the learner to a career roadmap and skill graph.
6. Dashboard shows today's learning, current roadmap position, recommendations, streak, progress, and revision prompts.
7. User starts a learning session.
8. User consumes a resource, practices, reflects, and marks progress.
9. Bloom records feedback and updates mastery estimates.
10. Recommendations and roadmap update.

Each major transition should be atomic and recoverable:

- Unauthenticated
- Authenticated
- Onboarded
- Active learning
- Session complete
- Profile updated
- Recommendations refreshed

## Required Screens and UX Areas

The UI/UX specification calls for a focused, low-friction interface where every screen has one primary action.

Required MVP screens:

- Landing page
- Login
- Registration
- Password recovery
- AI onboarding
- Personalized dashboard
- Learning session
- Roadmap
- Progress
- Search
- Profile and settings

Required dashboard sections:

- Today's Learning
- Continue Learning
- Recommended Resources
- Skill Progress
- Learning Streak
- Upcoming Revision
- Career Progress
- Notifications

Required recommendation card fields:

- Resource title
- Platform
- Estimated duration
- Difficulty
- Skills covered
- AI explanation
- Save action
- Start learning action

Accessibility is a core requirement: keyboard navigation, screen reader support, visible focus states, accessible forms, scalable text, and sufficient contrast.

## System Architecture

The architecture should be modular, cloud-native, API-first, privacy-conscious, explainable, and event-driven where useful.

Logical layers:

1. Presentation Layer: web app, browser extension, future mobile app.
2. Application Layer: authentication, sessions, request routing, workflows, API orchestration.
3. Learning Intelligence Layer: learning intent, skill graph, creator intelligence, content intelligence, recommendations, Guard Mode.
4. Knowledge Layer: skill graph, career graph, content graph, creator graph, learner graph.
5. Data Layer: user profiles, history, metadata, analytics, recommendations, feedback.
6. External Platform Layer: YouTube first, later GitHub, docs, blogs, Kaggle, podcasts, research papers, courses.

Core backend services:

- Authentication Service
- User Service
- Learning Profile Service
- Learning Service
- Recommendation Service
- Skill Graph Service
- Content Service
- Creator Service
- Analytics Service
- Notification Service
- Search Service
- API Gateway

For an MVP, these can be implemented as modular domains inside one deployable application if the boundaries remain clear. The documents describe service-oriented architecture as the long-term target, but the implementation plan says to build the smallest valuable feature first.

## Core Domain Model

Primary entities:

- User
- Learning Profile
- Career
- Skill
- Resource
- Creator
- Learning Session
- Recommendation
- Feedback
- Analytics Event
- Notification

Important relationships:

- User has one Learning Profile.
- User has many Learning Sessions.
- User has many Recommendations.
- User has many Feedback events.
- Career has many required Skills.
- Skill has many prerequisite Skills.
- Skill has many Resources.
- Skill has many Creators.
- Creator has many Resources.
- Recommendation references learner profile, skill, resource, ranking rationale, and status.

Storage strategy from the backend schema:

- Relational data: users, profiles, sessions, recommendations, progress.
- Graph database: skill graph and career graph.
- Document store: content metadata.
- Search engine: skills, careers, creators, resources, projects, technologies.
- Event or time-series store: analytics events.
- In-memory cache: profiles, recommendations, graph fragments, popular resources, creator metadata.

For an MVP, a relational database with graph-like tables for skill prerequisites may be enough, as long as the design can evolve toward a graph database later.

## Recommendation System Requirements

The recommendation engine should produce personalized, explainable recommendations using:

- Learning Intent Profile
- Current skill level
- Career target
- Skill gap analysis
- Skill prerequisites
- Content metadata
- Creator metadata
- Learning history
- Explicit feedback
- Implicit feedback

Recommendation pipeline:

1. Read learner profile.
2. Locate learner position in the skill graph.
3. Identify skill gaps.
4. Determine candidate next skills.
5. Retrieve candidate resources.
6. Evaluate relevance, quality, difficulty, freshness, creator suitability, and learning style fit.
7. Rank candidates.
8. Generate explanation.
9. Store recommendation.
10. Return recommendation.
11. Observe feedback.
12. Update learner model.

Every recommendation must answer:

- Why this resource?
- Why now?
- Which career goal does this support?
- Which prerequisite does it satisfy?
- What does it unlock next?

Popularity alone is explicitly not enough.

## AI System Requirements

Bloom's AI is a learning intelligence system, not just a chatbot.

Required AI components:

- Learning Intent Engine
- Learner Knowledge Model
- Skill Gap Analyzer
- Learning Experience Planner
- Resource Retrieval Engine
- Recommendation Ranking Engine
- Feedback Engine

The Learning Intent Profile should include:

- Career goal
- Current skills
- Learning preferences
- Preferred language
- Daily learning time
- Completed skills
- Weak areas
- Learning history
- Career timeline
- Progress

AI constraints:

- AI should guide, not control.
- AI must be explainable.
- AI must not make irreversible decisions without user control.
- Learners can ignore recommendations, change goals, modify roadmaps, disable Guard Mode, and choose alternative resources.
- The system should optimize learning outcomes, not engagement or screen time.

## Events and Analytics

Core event flow:

1. User Registered
2. Profile Created
3. Career Selected
4. Recommendation Generated
5. Learning Started
6. Learning Completed
7. Feedback Submitted
8. Profile Updated

Analytics events should include:

- User Login
- Resource Viewed
- Resource Completed
- Recommendation Accepted
- Recommendation Skipped
- Search Performed
- Learning Session Started
- Learning Session Completed

Each event should include:

- Event ID
- User ID
- Event type
- Timestamp
- Metadata

Metrics to track:

- Daily active users
- Weekly active users
- Session frequency
- Session completion rate
- Recommendation acceptance rate
- Recommendation completion rate
- Save rate
- Skip rate
- User satisfaction
- Skill nodes completed
- Projects completed
- Roadmap progress
- Free to Pro conversion, later

## Non-Functional Requirements

Performance targets:

- Read API operations under 200 ms, excluding external API latency.
- Cached recommendation retrieval under 500 ms.
- Search results under 300 ms.

Availability and reliability:

- Target uptime: 99.9%.
- Graceful recovery from failures.
- No single service should become a single point of failure in the long-term architecture.
- Retry transient failures.
- Use circuit breakers for unstable dependencies.
- Avoid cascading failures.
- Critical learner data must not be lost.

Security and privacy:

- HTTPS for communication.
- Passwords must never be stored in plain text.
- Authentication tokens must expire.
- Sensitive data encrypted at rest and in transit.
- Role-based access control.
- Least-privilege access.
- Audit authentication events, administrative actions, and critical system changes.
- Minimal data collection.
- User consent where applicable.
- Data export.
- Account deletion.
- Configurable retention policies.

Observability:

- Structured logs
- Error logs
- Audit logs
- API latency metrics
- Error rate metrics
- Recommendation latency metrics
- Queue length metrics
- Distributed tracing for service dependencies

Testing:

- Unit tests for business logic, utilities, deterministic AI components.
- Integration tests for APIs, database interactions, third-party integrations.
- End-to-end tests for registration, onboarding, recommendations, learning sessions, and progress tracking.
- Performance tests for API latency, recommendation generation, and search.
- Security tests for authentication, authorization, and vulnerability scanning.

## Implementation Phases

Recommended build order:

1. Project Foundation
   - Repository, environments, CI/CD, coding standards, docs.

2. Core Platform
   - Auth, user service, learning profile service, API gateway, database schema, basic dashboard.

3. AI Onboarding
   - Career selection, skills assessment, preferences, schedule, Learning Intent Profile, initial roadmap.

4. Recommendation Engine MVP
   - Resource metadata, ranking, recommendation API, cards, explanations, save and dismiss.

5. Learning Experience
   - Guided sessions, timer, completion recording, progress dashboard, learning history.

6. Analytics and Feedback
   - Event tracking, feedback engine, dashboard metrics, feedback-informed ranking.

7. Skill Graph
   - Prerequisites, skill gap analysis, dynamic roadmap recalculation.

8. Multi-Platform Support
   - Documentation, GitHub, blogs, Kaggle, podcasts.

9. AI Learning Coach
   - Conversational learning assistant, revision planning, interview prep.

10. Enterprise Platform
   - Organizations, cohorts, admin dashboards, reporting.

## Recommended MVP Technical Interpretation

The documents describe a future distributed platform, but the safest MVP is a modular monolith or small service set with clear internal boundaries.

Suggested MVP modules:

- Auth
- Users and profiles
- Onboarding
- Careers and skills
- Resources
- Recommendations
- Sessions and progress
- Feedback and analytics
- Search
- Settings

Suggested first data approach:

- Relational database for core entities.
- Tables for skills and skill prerequisites instead of immediate graph database.
- Resource metadata table for YouTube resources.
- Analytics event table or append-only event store.
- Cache layer only after usage patterns justify it.

Suggested first recommendation approach:

- Rules plus scoring model.
- AI-generated explanation text.
- Human-curated starter skill and resource data for selected career tracks.
- Feedback signals recorded from day one.
- Keep model/provider integration abstracted.

This aligns with the implementation plan's instruction to validate assumptions before expanding scope.

## Open Decisions and Gaps

The documents intentionally remain technology-agnostic, so implementation still needs decisions on:

- Frontend framework
- Backend framework
- Database choice
- Auth provider
- AI provider
- YouTube API strategy
- Hosting and deployment target
- Initial career tracks
- Initial skill taxonomy
- Initial resource curation process
- Scoring formula for MVP recommendations
- Privacy policy and retention defaults
- Free vs Pro feature gating for first release
- Browser extension versus web app priority for the first build

The biggest product ambiguity is whether the first shippable product is primarily a browser extension, a web app, or both. Business and roadmap documents emphasize browser extension first, while architecture and UI documents allow both browser extension and web app.

## Build Priority

The first usable version should prove the core loop:

1. A learner creates an account.
2. The learner completes AI onboarding.
3. Bloom creates a Learning Intent Profile.
4. Bloom generates an initial roadmap.
5. Bloom recommends YouTube resources with explanations.
6. The learner starts and completes a learning session.
7. Bloom records progress and feedback.
8. Bloom updates the next recommendation.

Everything outside this loop should be treated as future scope unless required to make the loop usable, trustworthy, or measurable.

## Final Assessment

The documents contain enough information to start building Bloom's MVP. They are strongest on product direction, architecture boundaries, AI philosophy, user flow, and phased execution. They are less specific on implementation technology, exact database schema fields, API contracts, recommendation scoring, UI visual design tokens, and initial content taxonomy.

To move from documents to development, the next step should be a technical build specification that chooses the stack, defines the MVP database schema, drafts API routes, outlines the frontend screens, and defines the first recommendation scoring algorithm.
