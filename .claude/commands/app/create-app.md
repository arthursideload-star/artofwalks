# Create App

Create a new application using coordinated agents for architecture, design, and development.

## Usage

```
/app create-app <description>
```

## Workflow

This command orchestrates three specialized agents to build your app:

### Phase 1: Architecture (app-architect agent)
- Analyze your app description
- Select the optimal tech stack
- Define component breakdown and data model
- Plan file structure and API design

### Phase 2: Design (ui-designer agent)
- Create the design system (colors, typography, spacing)
- Design component specifications with all states
- Define responsive layouts and breakpoints
- Generate CSS custom properties and design tokens
- Use Figma integration if available

### Phase 3: Development (fullstack-developer agent)
- Set up project structure and dependencies
- Implement all components and pages
- Build backend API and data layer
- Add authentication if needed
- Write tests for critical paths
- Configure build and deployment

## Agent Coordination

The agents work in a pipeline:
1. **Architect** produces the app spec → feeds into Designer and Developer
2. **Designer** produces design tokens and component specs → feeds into Developer
3. **Developer** writes the code using both the architecture spec and design system

## Examples

```
/app create-app A task management app with kanban boards, user auth, and dark mode
/app create-app A portfolio website with project gallery, blog, and contact form
/app create-app An e-commerce storefront with product catalog, cart, and checkout
```

## What Happens

When you run this command, Claude will:
1. Spawn an **architect agent** to plan the app structure
2. Spawn a **designer agent** to create the visual design system
3. Spawn a **developer agent** to write all the code
4. Coordinate between agents so design informs code
5. Deliver a working app you can run with `npm run dev`
