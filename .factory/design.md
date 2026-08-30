# WebMCP Safety Check — visual thesis

## Direction: a browser-safety botanical field guide

WebMCP surfaces are unfamiliar specimens: useful, varied, and unsafe to identify by name alone. The interface borrows the visual logic of a working naturalist's field guide—pressed leaves, specimen numbers, margin notes, ruled observations, and a hand lens—without becoming nostalgic decoration. The botanical metaphor explains the job: inventory each tool, inspect its declared traits, flag missing labels, and preserve a review card. The product should feel careful, calm, and evidentiary, not like a generic cyber-security dashboard.

The visual hierarchy passes the clarity/deference/depth tests by making the next action (“Choose a manifest”) dominant, keeping ornamental material behind the task, and layering each tool as a numbered specimen with its findings directly attached.

## Palette

Light is the default treatment; dark is a deliberately inkier “night fieldwork” variant selected with `prefers-color-scheme`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper / background | `#F4F0E3` | `#172019` | Warm field-paper ground |
| sheet / surface | `#FFFDF5` | `#202A22` | Working specimens and controls |
| ink / text | `#17261B` | `#F2F0DF` | Primary copy |
| graphite / muted | `#536052` | `#B9C3B3` | Notes and metadata |
| fern / accent | `#285D3A` | `#9ACB8B` | Primary action |
| fern-ink / accent contrast | `#FFFFFF` | `#102016` | Text on accent |
| moss / success | `#2D6944` | `#A3D6A1` | Clear findings |
| ochre / warning | `#8A5A00` | `#F3C66E` | Review findings |
| madder / danger | `#9C322D` | `#FFAAA2` | Blocking findings |
| rule | `#C9C3AE` | `#445047` | Dividers and control outlines |
| focus | `#704300` | `#F3C66E` | 3 px focus ring; bright ochre is also used inside dark terminal panels |

Status never relies on color: every state also uses a word, icon/mark, and explanatory sentence. Focus uses a 3 px deep-ochre ring on light paper and bright ochre inside dark terminal panels. The light ring has at least 3:1 contrast against paper, deep paper, and sheet surfaces. Checked contrast targets are ≥ 4.5:1 for body text in both treatments.

## Type

- Display and specimen names: Georgia, Cambria, `Times New Roman`, serif. The established system serif gives field-guide authority without downloading a font.
- Interface, tables, and annotations: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace. This ties the evidence labels to manifests and CI output.
- Scale: 16, 18, 22, 32, and clamp(40–78) px. Meaningful copy is never smaller than 16 px. Measures stay under 72 characters. Risk counts and line references use tabular figures.

System fonts are intentional: zero font payload, no CDN, and the contrast between editorial serif and machine-readable mono matches the product.

## Spacing and shape

- 4 px base rhythm; primary sequence 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72.
- Content max width 1180 px; reading measure 68ch.
- Corners are clipped or lightly rounded (2–10 px), like paper and labels—not pill-heavy SaaS chrome.
- 44 px minimum controls and 8 px separation. On 390 px screens, the two-column workbench stacks and secondary explanatory copy yields before controls do.

## Interaction grammar

- “Collect”: choose, drop, or paste a JSON manifest/transcript. The drop zone is a ruled specimen envelope, not a card.
- “Identify”: analyzer classifies read, mutate, external navigation, unknown, credential scope, origin scope, real-profile, approval, and evidence claims.
- “Press”: results appear as numbered specimen rows with a left risk notch and short policy findings.
- “Preserve”: export the exact report as JSON or a printable review card. Clear is reversible for five seconds through Undo.
- Keyboard: visible focus throughout; paste textarea and file input are native controls; findings use headings and lists; tabs use buttons with managed `aria-selected` and Arrow key behavior.

## Motion

Results settle upward 8 px over 180 ms, as if a specimen sheet were placed on a desk. Score needles and counts do not tween (precision matters more than spectacle). Hover changes use 150 ms color/transform transitions. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are instant.

## Asset plan and provenance

### Hero: `assets/src/field-guide-hero.png` → responsive WebP/AVIF

Prompt sheet (use case `illustration-story`):

> Asset type: wide landing-page hero illustration. Primary request: an overhead botanical field-guide study of browser-agent safety declarations. Scene: warm archival paper with a single fern-like plant whose leaves subtly resemble browser tabs and small structured-data brackets, a brass hand lens examining one leaf, restrained red thread marking a risky specimen, tiny blank specimen labels with no writing. Style: refined hand-cut linocut and watercolor wash, original scientific field-guide plate, tactile paper grain, precise and calm. Composition: landscape, subject concentrated center-right with generous quiet paper space on the left, clean silhouette for responsive crop. Lighting: soft north-window studio light. Palette: parchment, deep botanical green, graphite, muted ochre, sparing madder red. Avoid: all text, letters, numbers, logos, watermarks, people, screens, neon gradients, glossy 3D, generic cybersecurity shields, visual clutter, malformed tools.

Generated with the factory Azure image deployment (`factory-image`) via `/opt/fleet/lib/gen-image.sh` on 2026-08-28. Original output is project-specific and supplied under the repository's MIT license. Prompt sidecar is stored beside the source. The selected candidate must be visually inspected for artifacts before use and optimized to ≤300 KB WebP. The footer discloses generated imagery.

The 1200×630 social card is a centered crop of that reviewed source, exported locally as WebP on 2026-08-30. The 180 px touch icon is a resized derivative of the original project logo. No additional generated or third-party art was introduced in repair 3.

### Native assets

Small icons, risk notches, focus marks, and the logo leaf are authored in semantic HTML/CSS or local SVG. They are simple interface geometry and remain crisp without raster payload.

## Page composition

- Landing: quiet masthead; one h1 and field-guide hero; a three-step “collect / identify / preserve” strip; sample report; CLI copy block; download CTA; explicit boundary that claims are not proof.
- Extension workspace: compact specimen header; source tabs; input envelope; summary ledger; tool specimen list; export actions. Empty, invalid, no-tool, offline, and successful states have distinct next steps.
- Privacy and terms: plain paper documents with the same masthead and readable measure.
