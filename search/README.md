# 🔍 Search Experience & Query Intelligence Module  
**Owner: Arushi Agrawal**

## Ownership Notice
This module is owned and maintained by **Arushi Agrawal**.  
Please do **not** push changes here without prior discussion.

---

## Scope of This Module

### 1. Search Experience
- News & article search via external APIs (SerpAPI or equivalent)
- Pagination based result loading (no infinite scroll)
- Manual refresh to fetch latest results
- API-provided filters only
- Voice search support

### 2. Query Intelligence
- Prefix-based query suggestions
- Next-word query prediction (keyboard-style)
- Frequency-based + context-aware predictions
- Emergency-aware query boosting
- Recent searches (last 3 only, no full history)

### 3. Normal Mode Ranking Logic
- Keyword relevance
- Semantic similarity
- Article freshness
- Source credibility score
- Cross-source agreement
- CTR & engagement metrics
- Pogo-sticking detection (low-quality demotion)

### 4. Ranking Feedback Loop
- Click & engagement signals update ranking weights
- User feedback incorporated over time
- Poor-quality results automatically demoted

---

## Notes
- This module focuses **only on Normal Browsing Mode**
- Emergency Mode ranking is handled separately
- Implementation will be split across backend services and frontend search UI
