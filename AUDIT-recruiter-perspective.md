# Portfolio Audit: Recruiter Perspective
**Date:** April 10, 2026  
**Site:** joneilcaoile.github.io  
**Auditor lens:** Hiring manager at a SoCal medtech company reviewing candidates for validation, applications, R&D, or human factors roles.

---

## First Impression (0-10 seconds)

**Score: 9/10**

The ECG heartbeat entrance animation is memorable and on-brand. It communicates "biomedical" before the visitor reads a word. The hero section is strong: professional headshot, clear title ("Biomedical Engineer"), an honest tagline ("Two years watching devices fail patients. Now I test them, validate them, and build tools so they don't."), and an interactive terminal that reinforces the builder identity. The green "Available May 2026 / SoCal" badge answers the two questions every recruiter asks first: when and where.

Three CTAs (View device projects, Get in touch, Resume) give clear next steps. No confusion about what this person wants or where they're headed.

---

## Content Quality

### Statement (01 / About)
Grounded and personal. Opens with a philosophy ("the body already holds the answers") rather than a generic summary. Mentions clinical observation before engineering credentials, which differentiates immediately. The stat cards (400+ hrs, 6 built & tested, IEC 62366/21 CFR 820/MDR, M.S. BME, UseTrace/PhotoCull) provide fast credibility scanning.

### Skills (02 / What I Bring)
Four role-aligned cards (Validation, Applications, R&D, Human Factors) each with specific capabilities and project references. This is excellent for a recruiter trying to match a candidate to a req. The "See:" references connecting skills to specific projects show evidence, not just claims.

### Story (03 / Story)
"Two years in clinics before a single line of code" is a strong headline. The narrative arc (clinics > frustration > engineering > tools) is clear and compelling. The three paragraphs read like a person, not a template. Credential pills and story timeline nodes provide quick verification points. The closing line "Two years watching the problem. Then grad school to fix it. Now I'm ready to do it for real." lands well.

### Featured Project (04)
Pneumothorax Air Leak Monitor gets spotlight treatment with an architecture flow diagram (Sense > Process > Classify > Alert). Appropriate for a capstone device with real clinical relevance.

### Work Grid (05 / More Work)
Six project cards with pipeline visualizations, rarity badges (RPG-themed), role tags, evidence lines, tech tags, and case study links. Each card answers: what is it, why was it built, what did it prove, and what role does it map to.

### Toolkit (06)
Honest depth indicators ("Coursework + capstone" instead of "Expert"). This builds trust. Recruiters are tired of candidates who list every tool they've touched as a skill.

### Journey (07)
The poetic intro about the body's ability to heal ties back to the opening statement beautifully. Timeline is chronological and honest. The pixel art journey walk and RPG class tree add personality without undermining professionalism.

### Skills Matrix (08)
Cross-reference table of skills by project. Clean way to show breadth. Includes UseTrace as a column even though it doesn't have a work card in the grid (see issues).

### Personal (09 / Off the Clock)
Photography, gaming, e-bike, coffee, SoCal native, music. Shows personality. The Minecraft crafting recipe is a fun touch. Not overdone.

### Criteria (10 / My Criteria)
Bold section. "The product touches patients." "Physical testing is part of the job." "Engineers have signature authority." This will resonate with hiring managers who value directness and technical self-awareness. Some might see it as presumptuous for a new grad, but for the medtech audience, it reads as someone who knows the industry and won't waste their time or yours. The closing line ("If this list describes half your company and you're working on the other half, I want to hear about that too") softens it well.

### Contact (11)
Professional email, phone, LinkedIn, GitHub, contact form with Formspree backend. Clean and complete.

---

## Issues Found

### Critical (Fix now)

**1. UseTrace HFE is missing from the work grid.**  
UseTrace has a case study page (case-usetrace.html), is referenced in the Skills Matrix, the Bring cards, and the Story section, but does NOT have its own card in the "Six projects. Zero fluff." grid. This is arguably the most recruiter-relevant project: a real tool used by 50+ engineers at 4 medtech companies. It demonstrates exactly the kind of work a validation/applications/HFE engineer does. Fuji Vibes (a photography filter previewer) occupies a slot that UseTrace would fill with far more hiring impact. **Recommendation: Replace Fuji Vibes with UseTrace in the 6-card grid, or expand to 7 cards.**

**2. Pneumothorax appears twice.**  
It has a dedicated Featured Project section (04) AND a card in the work grid (05). A recruiter scrolling quickly might think it's padding. **Recommendation: Remove Pneumothorax from the work grid and replace it with UseTrace. That gives you: 1 featured project + 6 unique work cards = 7 projects total, all distinct.**

### Medium (Should fix)

**3. Fuji Vibes has no case study link.**  
Every other work card links to a case study page. Fuji Vibes only has "Live App" and "GitHub". If it stays in the grid, it needs a case study or it looks incomplete compared to the others.

**4. "Six projects. Zero fluff." heading is inaccurate if Pneumothorax is featured separately.**  
If Pneumothorax is already featured above, the grid shows 5 unique + 1 duplicate. Update the heading to match reality after restructuring.

### Minor (Nice to have)

**5. The entrance overlay shows a thin right-edge gap on some viewport widths.**  
The CSS uses `position: fixed; inset: 0;` which should be full coverage. This may only appear with visible scrollbars. Low priority since most users won't notice on first visit.

**6. No resume download button in the hero area.**  
There's a "Resume" text link, but it's not styled as a button like the other two CTAs. If this opens a PDF, making it a proper button with a download icon would increase conversion.

**7. The RPG elements (rarity badges, pet system, XP bar) are fun but could confuse a non-gaming recruiter.**  
For the target audience (SoCal medtech hiring managers, often 35-55), some of these references might not land. The RPG theme doesn't hurt credibility, but it's worth knowing it's a calculated bet. The engineering content underneath is strong enough to carry it.

---

## What a Recruiter Would Think

**Strengths they'd notice:**
- This person has clinical experience AND engineering skills. That's rare.
- 6 real projects with case studies, not just homework screenshots.
- Knows the regulatory landscape (IEC 62366, 21 CFR 820, ISO 14971) and can name specific standards in context.
- Built actual tools (UseTrace, PhotoCull) that real people use.
- Honest about depth. "Coursework + capstone" is refreshing.
- The criteria section shows industry awareness and self-selection. This saves the recruiter's time.
- Available date and location are immediately visible.

**Questions they might have:**
- Where's UseTrace in the project grid? (They'll see it referenced everywhere but can't click into it from the main page easily.)
- Has this person worked in industry, or is everything academic? (All projects are school or personal. The 400+ clinical hours and UseTrace's real-world usage help, but a recruiter might want to see internship or co-op experience.)
- Why is the photography tool in the same grid as medical device projects? (Fuji Vibes feels like filler compared to the others.)

**Overall recruiter verdict:** This is a top-quartile new grad portfolio for medtech. The clinical background is a genuine differentiator. The site itself demonstrates technical ability (8000+ lines of hand-written HTML/CSS/JS with no framework). With the UseTrace card added and the Pneumothorax duplication removed, this would be a 9/10 portfolio for the target roles.

---

## Recommended Fix Priority

1. Add UseTrace HFE work card to the grid (case study already exists)
2. Remove Pneumothorax from work grid (it's already featured above)
3. Move Fuji Vibes to bottom of grid or make it a "bonus" rather than equal-weight
4. Update heading from "Six projects" to match new count
5. Style the Resume link as a proper download button
