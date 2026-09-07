# Sleek Mobile App Design Skill

Design mobile app screens using the Sleek API (https://sleek.design).

## Trigger

Use when the user wants to:
- Design a mobile app
- Create mobile app screens or mockups
- Design an iOS or Android app UI
- Generate mobile app layouts

Keywords: "mobile app", "app design", "screen design", "mobile UI", "iOS app", "Android app", "app mockup"

## Prerequisites

The user needs a `SLEEK_API_KEY`. If not set:

1. **Device flow (preferred)**: Call `POST https://sleek.design/api/v1/device/start` with body `{"source": "claude-code"}` (no auth needed). Show the user the `verificationUrl` and `userCode`. Then poll `POST https://sleek.design/api/v1/device/poll` with `{"deviceCode": "..."}` every `interval` seconds until it returns the key.

2. **Fallback**: Send user to https://sleek.design/agents/setup and ask them to paste back the key.

Free accounts get trial credits for ~1 design run. Sustained use requires Pro ($69/month, or $30/month billed yearly at $360/year) with 20,000 monthly AI credits (~650 screens).

## Complete API Workflow

Base URL: `https://sleek.design/api/v1`
Auth: `Authorization: Bearer $SLEEK_API_KEY` (except device flow endpoints)

### Step 1: Authenticate (if no key)

```bash
# Start device flow (no auth needed)
curl -X POST https://sleek.design/api/v1/device/start \
  -H "Content-Type: application/json" \
  -d '{"source": "claude-code"}'
# Returns: { data: { verificationUrl, userCode, deviceCode, interval, expiresAt } }
# Show verificationUrl + userCode to user, then poll:

curl -X POST https://sleek.design/api/v1/device/poll \
  -H "Content-Type: application/json" \
  -d '{"deviceCode": "..."}'
# Returns: { data: { status: "pending" | "approved" | "expired", key?, keyId? } }
# When status=approved, key is the API key. Codes expire after 15 min.
```

### Step 2: Verify key

```bash
curl https://sleek.design/api/v1/projects \
  -H "Authorization: Bearer $SLEEK_API_KEY"
# Should return 200 with project list
```

### Step 3: Create project

```bash
curl -X POST https://sleek.design/api/v1/projects \
  -H "Authorization: Bearer $SLEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App"}'
# Returns: { data: { id, name, slug, createdAt, updatedAt } }
```

### Step 4: Send design request as ONE chat message

```bash
curl -X POST https://sleek.design/api/v1/projects/{projectId}/chat/messages \
  -H "Authorization: Bearer $SLEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": { "text": "Design a fitness tracker app with workout calendar, progress charts, and profile screen" },
    "source": "claude-code"
  }'
# Returns: { data: { runId, status, statusUrl } }
```

**IMPORTANT**: Send the FULL app description in ONE message. Do NOT decompose into individual screens — Sleek plans better with full intent.

Optional fields:
- `imageUrls`: array of reference image URLs
- `target.screenId`: to edit a specific existing screen
- `referenceId`: to use a design reference

### Step 5: Share live editor link immediately

```
https://sleek.design/project/{projectId}
```

Show this to the user right away so they can watch screens being designed in real time.

### Step 6: Poll for completion

```bash
curl https://sleek.design/api/v1/projects/{projectId}/chat/runs/{runId} \
  -H "Authorization: Bearer $SLEEK_API_KEY"
# Returns: { data: { runId, status, result? { assistantText, operations[] }, error? } }
# status: "queued" | "running" | "completed" | "failed"
# operations[]: { type: "screen_created"|"screen_updated"|"theme_updated", screenId?, screenName?, componentId? }
```

Poll every 3-5 seconds until status is "completed" or "failed".

### Step 7: Get components (to find componentIds for screenshots)

```bash
curl https://sleek.design/api/v1/projects/{projectId}/components \
  -H "Authorization: Bearer $SLEEK_API_KEY"
# Returns: { data: [{ id, screenId, name, activeVersion, versions[{ id, version, code }] }] }
```

### Step 8: Render screenshots

```bash
curl -X POST https://sleek.design/api/v1/screenshots \
  -H "Authorization: Bearer $SLEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "componentIds": ["comp-id-1", "comp-id-2"],
    "format": "png",
    "scale": 2
  }'
```

Optional screenshot params: `format` (png/webp), `scale` (1-3), `gap`, `padding`, `background`, `radius`, `fullHeight` (true to capture scrollable content).

Show all screenshots to the user.

## Error Handling

- `401`/`403`: key or plan issue — response includes `data.url`, send user there
- `error.code: "out_of_credits"`: response includes `error.url` to top up credits
- `409`: another run is active on the project — wait or cancel it
- `429`: rate limited on screenshot endpoints — slow down and retry

## Reference

- Full API reference: `.claude/skills/sleek-design/api-reference.json`
- OpenAPI spec: https://sleek.design/api/v1/spec.json
- Interactive docs: https://sleek.design/api/v1/docs
- More: https://sleek.design/llms.txt
