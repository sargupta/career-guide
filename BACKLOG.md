# SARGVISION AI — Project Backlog & Future TODOs (2026)

## 🎯 High-Priority: Retention & Engagement (Persona Fixes)
- [x] **WhatsApp 2-Way Conversational Loop**: Allow students to reply to nudges with text/voice to automatically log activities.
- [x] **RPG Gamification Layer**: Turn the "Digital Twin" into a "Level Up" game with Character Classes, XP for logging study/work, and Badges.
- [x] **Mobile focus/HI**: Simplify major dashboard views to show "ONE Next Best Action" rather than dense radar charts.
- [x] **Streaks & Daily Challenges**: Implement a "streak" system to reward consistent logging, similar to Duolingo.

## 🛠️ Technical Hardening & Infrastructure
- [x] **Full Kong Gateway SSL/TLS Mapping**: Move from HTTP to HTTPS for the AI Gateway endpoints.
- [x] **Autoscaling Config**: Define Horizontal Pod Autoscaler (HPA) policies for the FastAPI backend on Cloud Run.
- [x] **Monitoring & Prometheus**: Set up Grafana dashboards for token cost tracking and agent latency monitoring.
- [x] **Advanced Semantic Caching**: Tune the Redis cache for better hit-rates on common Indian academic queries.

## 🧠 AI Agent & Memory Maturity
- [x] **100% Agent Test Coverage**: Implement E2E tests for the 6 specialized sub-agents using Playwright.
- [x] **Multi-Modal Memory**: Allow the memory layer to extract facts from images (e.g., student uploading a certificate photo).
- [x] **Regional Language Support**: Expand the Simplification Agent to support Hinglish, Bengali, and other major regional languages.

## 📚 Content & Domain Expansion
- [x] **Non-Tech Career Seeding**: Populate the DB with paths for BA, BCom, LLB, and Arts students (currently tech-heavy).
- [x] **Government Exam Mastery**: Specific agents for UPSC/GATE/CAT tracking and syllabus simplification.
- [x] **Scholarship Radar**: Integrate a dedicated agent for finding Tier-II/III specific financial grants.

---

**Status**: SARGVISION AI is currently **Production-Ready** (Phase 1–11 Complete). 
The above tasks represent the roadmap for the "Engagement & Growth" phase.
