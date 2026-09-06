# App Creation Skill

Multi-agent app creation workflow that coordinates architecture, design, and development agents.

## Trigger

Use when the user wants to:
- Create a new app or application
- Build a website or web app
- Generate a fullstack project
- Scaffold an app with design and code

Keywords: "create app", "build app", "new app", "make an app", "erstelle app", "app erstellen"

## Workflow

### Step 1: Understand Requirements

Ask clarifying questions if needed:
- What type of app? (web app, PWA, static site, API)
- Key features?
- Design preferences? (minimal, colorful, dark mode)
- Tech preferences? (or let agents decide)

### Step 2: Spawn Architecture Agent

Use the Agent tool with the app-architect agent definition:

```
Agent({
  description: "App architecture planning",
  prompt: "You are the app-architect agent. Plan the complete architecture for: [USER_DESCRIPTION]. Output: tech stack, component breakdown, data model, file structure, API design. Format as YAML.",
  subagent_type: "claude"
})
```

### Step 3: Spawn Design Agent (parallel with architecture review)

```
Agent({
  description: "UI/UX design system",
  prompt: "You are the ui-designer agent. Create a complete design system for: [USER_DESCRIPTION]. Output: color palette (light + dark), typography scale, spacing scale, component specs (button, input, card, nav, layout), CSS custom properties. Deliver as CSS + component HTML examples.",
  subagent_type: "claude"
})
```

### Step 4: Develop the App

Using the architecture spec and design system, write the code:
- Project setup (package.json, config files)
- Component implementation with design tokens
- Page layouts and routing
- Backend/API if needed
- Tests for key flows

### Step 5: Verify

- Run the dev server
- Check that the app loads
- Verify responsive design
- Test key user flows

## Output

A complete, runnable application in the project directory with:
- All source code
- Design system as CSS custom properties
- Package.json with scripts
- README with setup instructions
