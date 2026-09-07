# Design Mobile App

Design mobile app screens using Sleek (sleek.design).

## Usage

```
/app design-mobile <description>
```

## What It Does

Uses the Sleek API to generate professionally designed mobile app screens from a text description.

## Workflow

1. Check for `SLEEK_API_KEY` — if missing, start the device flow to authenticate
2. Create a new Sleek project
3. Send the user's full app description as one chat message
4. Share the live editor link: `https://sleek.design/project/:id`
5. Poll until the design run completes
6. Render and show screenshots of all generated screens
7. Fetch component HTML for use in development

## Examples

```
/app design-mobile A fitness tracker with workout calendar, progress charts, and profile
/app design-mobile An e-commerce app with product catalog, cart, and checkout flow
/app design-mobile A social media app with feed, stories, messaging, and profile
```

## Integration with App Creation

Combine with the fullstack developer agent:
1. First: `/app design-mobile` to get the visual design
2. Then: use the component HTML from Sleek as the basis for frontend code
3. The fullstack-developer agent can implement the screens based on Sleek's output
