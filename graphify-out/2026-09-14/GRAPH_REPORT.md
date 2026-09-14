# Graph Report - THSIX  (2026-09-14)

## Corpus Check
- 63 files · ~1,342,795 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .css 16, .glb 3, (none) 1)

## Summary
- 557 nodes · 654 edges · 44 communities (38 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `169bf631`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- package.json
- Footer.tsx
- compilerOptions
- compilerOptions
- Lookbook.tsx
- BrandCard.tsx
- Hero.tsx
- ProductCard.tsx
- dependencies
- Product Image Gallery Design
- .oxlintrc.json
- shopify.d.ts
- tsconfig.json
- Product Image Gallery - Implementation Tasks
- Design Specification: Shopify Real-Time E-Commerce Platform
- 🧰 FULL SKILL REFERENCE BY BUNDLE {#skill-reference}
- Enhanced Shopify Storefront Web Components Rules
- Components
- Tasks
- ⚡ MASTER TANDEM PLAYBOOK — PRE-BUILT COMBOS BY PROJECT TYPE {#tandem-playbook}
- Component Architecture
- PHASE 3 — WEB DESIGN & UI/UX EXECUTION {#phase-3}
- 🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents
- PHASE 4 — SENIOR CODE DEVELOPMENT {#phase-4}
- stagger-testimonials.tsx
- PHASE 2 — ARCHITECTURE & SYSTEM DESIGN {#phase-2}
- PHASE 6 — SECURITY HARDENING {#phase-6}
- PHASE 0 — PRE-BOOT & SKILL STACK DECLARATION {#phase-0}
- PHASE 10 — POST-DEPLOYMENT & OBSERVABILITY {#phase-10}
- PHASE 1 — PROJECT DISCOVERY & INTELLIGENCE GATHERING {#phase-1}
- PHASE 5 — SENIOR CODE ANALYSIS & REVIEW {#phase-5}
- PHASE 7 — INFRASTRUCTURE & DEPLOYMENT {#phase-7}
- PHASE 8 — TESTING & QA {#phase-8}
- 🚨 EMERGENCY PROTOCOLS {#emergency}
- PHASE 9 — DOCUMENTATION & HANDOFF {#phase-9}
- 🧠 PROJECT BRAIN MANAGEMENT {#brain}
- 🧠 CORE PHILOSOPHY: THE TANDEM SKILL DOCTRINE
- React + TypeScript + Vite
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents` - 23 edges
2. `🧰 FULL SKILL REFERENCE BY BUNDLE {#skill-reference}` - 22 edges
3. `compilerOptions` - 19 edges
4. `lucide-react` - 18 edges
5. `react` - 15 edges
6. `compilerOptions` - 15 edges
7. `⚡ MASTER TANDEM PLAYBOOK — PRE-BUILT COMBOS BY PROJECT TYPE {#tandem-playbook}` - 14 edges
8. `Product Image Gallery Design` - 12 edges
9. `Product Image Gallery - Implementation Tasks` - 10 edges
10. `PHASE 3 — WEB DESIGN & UI/UX EXECUTION {#phase-3}` - 9 edges

## Surprising Connections (you probably didn't know these)
- `BrandCardProps` --references--> `Brand`  [EXTRACTED]
  src/components/BrandsShowcase/BrandCard.tsx → src/types/brand.ts
- `FooterColumnProps` --references--> `FooterColumn`  [EXTRACTED]
  src/components/Footer/FooterColumn.tsx → src/data/footer.ts
- `SocialLinksProps` --references--> `SocialLink`  [EXTRACTED]
  src/components/Footer/SocialLinks.tsx → src/data/footer.ts
- `LookbookCardProps` --references--> `LookbookItem`  [EXTRACTED]
  src/components/Lookbook/LookbookCard.tsx → src/data/lookbook.ts
- `ProductCardProps` --references--> `Product`  [EXTRACTED]
  src/components/ProductShowcase/ProductCard.tsx → src/types/product.ts

## Import Cycles
- None detected.

## Communities (44 total, 3 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (30): gsap, lucide-react, react, react-router-dom, App(), HomePage(), raf(), FloatingCartButton() (+22 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (38): devDependencies, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react (+30 more)

### Community 2 - "Footer.tsx"
Cohesion: 0.16
Nodes (12): FooterColumnComponent(), FooterColumnProps, IconComponent, iconComponents, SocialLinks(), SocialLinksProps, FooterColumn, footerColumns (+4 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 4 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 5 - "Lookbook.tsx"
Cohesion: 0.17
Nodes (10): LookbookCard(), LookbookCardProps, FormState, WhyThsixFeature(), WhyThsixFeatureProps, Feature, features, LookbookItem (+2 more)

### Community 6 - "BrandCard.tsx"
Cohesion: 0.31
Nodes (6): BrandCard(), BrandCardProps, BrandLogo(), BrandsShowcase(), brandsData, Brand

### Community 7 - "Hero.tsx"
Cohesion: 0.19
Nodes (9): BlurText(), BlurTextProps, buildKeyframes(), Hero(), heroData, HeroContent(), HeroDecoration(), HeroImage() (+1 more)

### Community 8 - "ProductCard.tsx"
Cohesion: 0.46
Nodes (5): ProductCard(), ProductCardProps, formatPrice(), sambaProducts, Product

### Community 9 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, autoprefixer, clsx, framer-motion, gsap, lenis, lucide-react, maath (+11 more)

### Community 10 - "Product Image Gallery Design"
Cohesion: 0.05
Nodes (37): Browser Compatibility, Component Communication Pattern, Component Structure, CSS Strategy, Current State, Data Access Strategy, Design Goals, Desktop Layout (+29 more)

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "shopify.d.ts"
Cohesion: 0.40
Nodes (3): IntrinsicElements, JSX, React

### Community 14 - "Product Image Gallery - Implementation Tasks"
Cohesion: 0.05
Nodes (36): Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Accessibility Requirements (+28 more)

### Community 15 - "Design Specification: Shopify Real-Time E-Commerce Platform"
Cohesion: 0.06
Nodes (35): Architecture, Automated Testing Pipeline, Automatic Recovery, Business Logic Errors, Business Rule Enforcement, Cart Data Model, Component Errors, Correctness Properties (+27 more)

### Community 16 - "🧰 FULL SKILL REFERENCE BY BUNDLE {#skill-reference}"
Cohesion: 0.09
Nodes (22): 🤖 Agent Architect Pack, 🏗️ Architecture & Design Pack, 🧱 DDD & Evented Architecture Pack, 🌧️ DevOps & Cloud Pack, 🚀 Essentials (Everyone — Start Here), 🧰 FULL SKILL REFERENCE BY BUNDLE {#skill-reference}, ⚡ Full-Stack Developer Pack, 🎮 Game Dev Pack (+14 more)

### Community 17 - "Enhanced Shopify Storefront Web Components Rules"
Cohesion: 0.09
Nodes (21): 1. A Minimal Product Card with Image and Price, 2. A Cool Example Using the 'Buy Now' Button, 3. A Grid Collection Page, 4. A Product Details Page Layout, 5. A Blog Post Page Layout, 6. A Very Customized Variant Selector, Attributes, Core Requirements (+13 more)

### Community 18 - "Components"
Cohesion: 0.10
Nodes (20): Attributes, Attributes, Attributes, Attributes, Attributes, Attributes, Attributes, Attributes and properties (+12 more)

### Community 19 - "Tasks"
Cohesion: 0.12
Nodes (16): Critical Path, Dependencies, Implementation Plan: Shopify Real-Time E-Commerce Platform, Notes, Optional Enhancement Tasks, Overview, Parallel Work Opportunities, Phase 1: Foundation & Error Fixes (Week 1-2) (+8 more)

### Community 20 - "⚡ MASTER TANDEM PLAYBOOK — PRE-BUILT COMBOS BY PROJECT TYPE {#tandem-playbook}"
Cohesion: 0.14
Nodes (14): 🤖 AI Chatbot / Agent System, 🔐 Authentication System, 💳 E-Commerce / Payment Flow, 🏗️ Enterprise / DDD Architecture, 🔍 Full Codebase Audit, 🚀 Full SaaS MVP (Ship in 2 Weeks), 🎮 Game Development (Unity / Unreal), 📈 Growth & Conversion Optimization (+6 more)

### Community 21 - "Component Architecture"
Cohesion: 0.17
Nodes (12): Cart Sync Messages, Component Architecture, Components and Interfaces, Core Interface Definitions, Error Boundary System, Inventory Update Messages, Product Update Messages, Provider Hierarchy (+4 more)

### Community 22 - "PHASE 3 — WEB DESIGN & UI/UX EXECUTION {#phase-3}"
Cohesion: 0.22
Nodes (9): 3.1 — The Designer + Developer Core Duo (MANDATORY PAIRING), 3.2 — Extended Frontend Stack for Full Pages, 3.3 — Conversion & Marketing Pages (Full 6-Skill Stack), 3.4 — Immersive / Animated Design, 3.5 — Mobile Design, 3.6 — Design Tokens (Mandatory Before Any Styled Component), 3.7 — Accessibility Standards (Non-Negotiable), 3.8 — Responsive Breakpoints (Test All Before Marking Done) (+1 more)

### Community 23 - "🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents"
Cohesion: 0.25
Nodes (7): 🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents, Applies to: Antigravity IDE · Gemini CLI · Claude Code · Cursor · Codex CLI · OpenCode · AdaL CLI, 🎯 RAPIDXAI PROJECT TYPE QUICK-SELECT, ✅ SESSION COMPLETION CHECKLIST {#checklist}, Source Skills: Antigravity Awesome Skills (868+ skills) — github.com/sickn33/antigravity-awesome-skills, 📋 TABLE OF CONTENTS, Version: 3.0.0 — FINAL | Maintainer: RapidXAI | February 2026

### Community 24 - "PHASE 4 — SENIOR CODE DEVELOPMENT {#phase-4}"
Cohesion: 0.25
Nodes (8): 4.1 — Pre-Code Mandatory Checklist, 4.2 — Full-Stack Feature Development — The 7-Layer Stack, 4.3 — Language & Framework Tandems, 4.4 — Code Quality Standards (Hard Rules), 4.5 — API Integration Standards, 4.6 — Stripe / Payments, 4.7 — Communications (Twilio, SMS, Voice), PHASE 4 — SENIOR CODE DEVELOPMENT {#phase-4}

### Community 25 - "stagger-testimonials.tsx"
Cohesion: 0.25
Nodes (5): shoeTestimonialsData, SQRT_5000, StaggerTestimonialsProps, TestimonialCardProps, TestimonialItem

### Community 26 - "PHASE 2 — ARCHITECTURE & SYSTEM DESIGN {#phase-2}"
Cohesion: 0.33
Nodes (6): 2.1 — Architecture Triple Invocation, 2.2 — Stack Selection Criteria (Non-Negotiable), 2.3 — API Contract Design (Tandem), 2.4 — Database Schema Design, 2.5 — Write Architecture to Brain, PHASE 2 — ARCHITECTURE & SYSTEM DESIGN {#phase-2}

### Community 27 - "PHASE 6 — SECURITY HARDENING {#phase-6}"
Cohesion: 0.33
Nodes (6): 6.1 — The Security Trio (Always All Three, Never Fewer), 6.2 — Authentication & Authorization Rules, 6.3 — Data Protection, 6.4 — Mandatory Security Headers, 6.5 — Payments Security, PHASE 6 — SECURITY HARDENING {#phase-6}

### Community 28 - "PHASE 0 — PRE-BOOT & SKILL STACK DECLARATION {#phase-0}"
Cohesion: 0.40
Nodes (5): 0.1 — Read the Brain Directory First, 0.2 — Verify Skill Installation, 0.3 — Mandatory Skill Stack Declaration, 0.4 — Establish Operating Context, PHASE 0 — PRE-BOOT & SKILL STACK DECLARATION {#phase-0}

### Community 29 - "PHASE 10 — POST-DEPLOYMENT & OBSERVABILITY {#phase-10}"
Cohesion: 0.40
Nodes (5): 10.1 — Observability Stack (Minimum Viable Production), 10.2 — Required Monitoring Stack, 10.3 — Weekly Maintenance Skills, 10.4 — Alerting Thresholds, PHASE 10 — POST-DEPLOYMENT & OBSERVABILITY {#phase-10}

### Community 30 - "PHASE 1 — PROJECT DISCOVERY & INTELLIGENCE GATHERING {#phase-1}"
Cohesion: 0.40
Nodes (5): 1.1 — Codebase Scan, 1.2 — Planning Tandem (Always These Three Together), 1.3 — Business Context Alignment, 1.4 — Preliminary Risk Scan (Dual-Skill), PHASE 1 — PROJECT DISCOVERY & INTELLIGENCE GATHERING {#phase-1}

### Community 31 - "PHASE 5 — SENIOR CODE ANALYSIS & REVIEW {#phase-5}"
Cohesion: 0.40
Nodes (5): 5.1 — Full Code Audit — Mandatory 5-Skill Tandem, 5.2 — Performance Analysis, 5.3 — Technical Debt Classification, 5.4 — Dependency Audit, PHASE 5 — SENIOR CODE ANALYSIS & REVIEW {#phase-5}

### Community 32 - "PHASE 7 — INFRASTRUCTURE & DEPLOYMENT {#phase-7}"
Cohesion: 0.40
Nodes (5): 7.1 — Deployment Tandem, 7.2 — Environment Management, 7.3 — Pre-Deployment Checklist, 7.4 — CI/CD Pipeline — Required Order, PHASE 7 — INFRASTRUCTURE & DEPLOYMENT {#phase-7}

### Community 33 - "PHASE 8 — TESTING & QA {#phase-8}"
Cohesion: 0.40
Nodes (5): 8.1 — The QA Skill Stack (All Five Active Together), 8.2 — Test Coverage Requirements, 8.3 — Non-Negotiable E2E Tests (Must Exist Before Production), 8.4 — Performance Benchmarks, PHASE 8 — TESTING & QA {#phase-8}

### Community 34 - "🚨 EMERGENCY PROTOCOLS {#emergency}"
Cohesion: 0.40
Nodes (5): Critical Bug in Production, 🚨 EMERGENCY PROTOCOLS {#emergency}, Production Is Down, Runaway API Costs (Google AI Studio / Gemini), Security Breach Suspected

### Community 35 - "PHASE 9 — DOCUMENTATION & HANDOFF {#phase-9}"
Cohesion: 0.50
Nodes (4): 9.1 — Documentation Tandem, 9.2 — Mandatory Documentation Set, 9.3 — Code-Level Documentation Standards, PHASE 9 — DOCUMENTATION & HANDOFF {#phase-9}

### Community 36 - "🧠 PROJECT BRAIN MANAGEMENT {#brain}"
Cohesion: 0.50
Nodes (4): Brain Directory Structure, Brain Read Protocol (Every Session Start), Brain Write Protocol (Every Session End and After Major Decisions), 🧠 PROJECT BRAIN MANAGEMENT {#brain}

### Community 37 - "🧠 CORE PHILOSOPHY: THE TANDEM SKILL DOCTRINE"
Cohesion: 0.50
Nodes (4): 🧠 CORE PHILOSOPHY: THE TANDEM SKILL DOCTRINE, Tandem Invocation — Real Syntax Examples, The Tandem Mental Model, The Three Laws of Skill Invocation

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **346 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 368 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents` connect `🚀 AGENT_SOP.md — Standard Operating Protocol for AI Agents` to `PHASE 7 — INFRASTRUCTURE & DEPLOYMENT {#phase-7}`, `PHASE 8 — TESTING & QA {#phase-8}`, `🚨 EMERGENCY PROTOCOLS {#emergency}`, `PHASE 9 — DOCUMENTATION & HANDOFF {#phase-9}`, `🧠 PROJECT BRAIN MANAGEMENT {#brain}`, `🧠 CORE PHILOSOPHY: THE TANDEM SKILL DOCTRINE`, `🧰 FULL SKILL REFERENCE BY BUNDLE {#skill-reference}`, `⚡ MASTER TANDEM PLAYBOOK — PRE-BUILT COMBOS BY PROJECT TYPE {#tandem-playbook}`, `PHASE 3 — WEB DESIGN & UI/UX EXECUTION {#phase-3}`, `PHASE 4 — SENIOR CODE DEVELOPMENT {#phase-4}`, `PHASE 2 — ARCHITECTURE & SYSTEM DESIGN {#phase-2}`, `PHASE 6 — SECURITY HARDENING {#phase-6}`, `PHASE 0 — PRE-BOOT & SKILL STACK DECLARATION {#phase-0}`, `PHASE 10 — POST-DEPLOYMENT & OBSERVABILITY {#phase-10}`, `PHASE 1 — PROJECT DISCOVERY & INTELLIGENCE GATHERING {#phase-1}`, `PHASE 5 — SENIOR CODE ANALYSIS & REVIEW {#phase-5}`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `App.tsx` to `package.json`, `Lookbook.tsx`, `BrandCard.tsx`, `Hero.tsx`, `ProductCard.tsx`, `stagger-testimonials.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `package.json`, `Lookbook.tsx`, `stagger-testimonials.tsx`, `Hero.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _346 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07890070921985816 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04994192799070848 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._