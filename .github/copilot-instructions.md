<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Learning Notes Website - Copilot Instructions

This is a React TypeScript project for displaying and editing learning notes with markdown support.

## Project Architecture
- **Framework**: React 18 with TypeScript and Vite for optimal performance
- **Styling**: Tailwind CSS with custom design system and dark/light theme support
- **UI Components**: Radix UI primitives for accessibility and consistency
- **Markdown**: react-markdown with syntax highlighting, GFM support, and raw HTML
- **Routing**: React Router for navigation between notes
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Icons**: Lucide React for consistent iconography

## Key Features to Implement
1. **Markdown Viewer**: Beautiful rendering with syntax highlighting
2. **Editor**: Inline editing with live preview
3. **Navigation**: Sidebar with file tree and search
4. **GitHub Integration**: Pull request creation for contributions
5. **Responsive Design**: Mobile-first approach
6. **Theme System**: Dark/light mode with system preference detection
7. **Search**: Full-text search across all notes
8. **File Management**: Create, edit, delete, and organize notes

## Code Standards
- Use TypeScript strict mode
- Implement proper error boundaries
- Follow React best practices (hooks, context, etc.)
- Use Tailwind's utility classes with semantic naming
- Implement proper loading states and error handling
- Ensure accessibility with ARIA labels and keyboard navigation
- Use Radix UI components for complex interactions

## File Structure
- `/src/components` - Reusable UI components
- `/src/pages` - Route components
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions
- `/src/types` - TypeScript type definitions
- `/src/lib` - External library configurations
- `/public/notes` - Markdown note files

## Styling Guidelines
- Use Tailwind's design tokens for consistency
- Implement dark mode with `dark:` prefixes
- Use CSS Grid and Flexbox for layouts
- Follow mobile-first responsive design
- Use the custom brand colors defined in tailwind.config.js
