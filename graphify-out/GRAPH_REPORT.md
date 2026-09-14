# Graph Report - THSIX  (2026-09-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 194 nodes · 290 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cafb3aee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- package.json
- Footer.tsx
- compilerOptions
- compilerOptions
- Newsletter.tsx
- BrandCard.tsx
- Hero.tsx
- ProductCard.tsx
- dependencies
- Lookbook.tsx
- .oxlintrc.json
- shopify.d.ts
- tsconfig.json
- raf

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `lucide-react` - 15 edges
3. `compilerOptions` - 15 edges
4. `react` - 10 edges
5. `gsap` - 6 edges
6. `react-router-dom` - 6 edges
7. `scripts` - 5 edges
8. `Brand` - 4 edges
9. `Product` - 4 edges
10. `LookbookItem` - 3 edges

## Surprising Connections (you probably didn't know these)
- `LookbookCardProps` --references--> `LookbookItem`  [EXTRACTED]
  src/components/Lookbook/LookbookCard.tsx → src/data/lookbook.ts
- `FooterColumnProps` --references--> `FooterColumn`  [EXTRACTED]
  src/components/Footer/FooterColumn.tsx → src/data/footer.ts
- `SocialLinksProps` --references--> `SocialLink`  [EXTRACTED]
  src/components/Footer/SocialLinks.tsx → src/data/footer.ts
- `WhyThsixFeatureProps` --references--> `Feature`  [EXTRACTED]
  src/components/WhyThsix/WhyThsixFeature.tsx → src/data/features.ts
- `BrandCardProps` --references--> `Brand`  [EXTRACTED]
  src/components/BrandsShowcase/BrandCard.tsx → src/types/brand.ts

## Import Cycles
- None detected.

## Communities (15 total, 2 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (20): gsap, lucide-react, react, react-router-dom, App(), AnnouncementBar(), announcementItems, Lookbook() (+12 more)

### Community 1 - "package.json"
Cohesion: 0.07
Nodes (26): devDependencies, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react (+18 more)

### Community 2 - "Footer.tsx"
Cohesion: 0.12
Nodes (16): Footer(), FooterColumnComponent(), FooterColumnProps, IconComponent, iconComponents, SocialLinks(), SocialLinksProps, Header() (+8 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 4 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 5 - "Newsletter.tsx"
Cohesion: 0.24
Nodes (6): FormState, WhyThsixFeature(), WhyThsixFeatureProps, Feature, features, newsletterContent

### Community 6 - "BrandCard.tsx"
Cohesion: 0.31
Nodes (6): BrandCard(), BrandCardProps, BrandLogo(), BrandsShowcase(), brandsData, Brand

### Community 7 - "Hero.tsx"
Cohesion: 0.25
Nodes (6): Hero(), heroData, HeroContent(), HeroDecoration(), HeroImage(), HeroMeta()

### Community 8 - "ProductCard.tsx"
Cohesion: 0.46
Nodes (5): ProductCard(), ProductCardProps, formatPrice(), sambaProducts, Product

### Community 9 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, gsap, lenis, lucide-react, react, react-dom, react-router-dom

### Community 10 - "Lookbook.tsx"
Cohesion: 0.52
Nodes (4): LookbookCard(), LookbookCardProps, LookbookItem, lookbookItems

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "shopify.d.ts"
Cohesion: 0.40
Nodes (3): IntrinsicElements, JSX, React

## Knowledge Gaps
- **80 isolated node(s):** `IntrinsicElements`, `IconComponent`, `LogoProps`, `FooterLink`, `FormState` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 85 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `App.tsx` to `package.json`, `Footer.tsx`, `Newsletter.tsx`, `BrandCard.tsx`, `Hero.tsx`, `ProductCard.tsx`, `Lookbook.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `package.json`, `Lookbook.tsx`, `Newsletter.tsx`, `Hero.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `IntrinsicElements`, `IconComponent`, `LogoProps` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12873563218390804 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Footer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11692307692307692 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._