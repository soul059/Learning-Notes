# Learning Notes Website

A beautiful, modern React application for viewing and editing your learning notes with markdown support. Features a clean UI/UX design with dark/light theme support, syntax highlighting, and GitHub integration for collaborative editing.

![Learning Notes](https://img.shields.io/badge/React-18.x-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-blue?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.x-purple?logo=vite)

## ✨ Features

### 📝 Markdown Support
- **Beautiful Rendering** with GitHub Flavored Markdown (GFM)
- **Syntax Highlighting** for code blocks using Prism.js
- **Live Preview** with inline editing capabilities
- **Copy Code** functionality with one-click copying
- **Table Support** with responsive design
- **Task Lists** with checkboxes
- **Blockquotes** with custom styling

### 🎨 Modern UI/UX
- **Dark/Light Theme** with system preference detection
- **Responsive Design** that works on all devices
- **Smooth Animations** powered by Framer Motion
- **Accessible Components** using Radix UI primitives
- **Custom Scrollbars** for a polished look
- **Typography** optimized for reading

### 📁 File Management
- **File Tree Navigation** with folder organization
- **Search Functionality** across all notes (coming soon)
- **Create/Edit/Delete** files and folders
- **Drag & Drop** support (coming soon)

### 🔄 GitHub Integration
- **Pull Request Creation** for collaborative editing
- **Version Control** integration
- **Branch Management** (coming soon)
- **Conflict Resolution** (coming soon)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd learning-notes-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application.

### Building for Production

```bash
npm run build
npm run preview
```

## 🛠️ Technology Stack

### Core
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI components
- **Lucide React** - Beautiful icon library
- **Custom CSS Variables** - Theme system implementation

### Markdown & Code
- **react-markdown** - Markdown rendering
- **react-syntax-highlighter** - Code syntax highlighting
- **remark-gfm** - GitHub Flavored Markdown support
- **rehype plugins** - Enhanced markdown processing

### Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **@types/node** - Node.js type definitions

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1200px+) - Full feature set with sidebar
- **Tablet** (768px-1199px) - Collapsible sidebar
- **Mobile** (320px-767px) - Mobile-optimized layout

## 🎯 Usage

### Viewing Notes
1. Navigate through the file tree on the left sidebar
2. Click on any `.md` file to view its content
3. Use the search bar to find specific notes (coming soon)

### Editing Notes
1. Click the "Edit" button on any note
2. Make your changes in the markdown editor
3. Click "Save Changes" to apply your edits
4. Use "Cancel" to discard changes

### Creating Content
1. Right-click on folders to create new files/folders
2. Use the "+" buttons in the file tree
3. Organize your notes in a logical structure

### Theme Switching
- Click the theme button in the sidebar footer
- Cycles through: Light → Dark → System
- Preference is automatically saved

## 🤝 Contributing

### For Content Contributors
1. Edit notes directly in the application
2. Click "Create PR" to submit your changes
3. Fill out the pull request template
4. Wait for review and approval

### For Developers
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── markdown/        # Markdown-related components
├── contexts/            # React contexts (Theme, etc.)
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── App.tsx             # Main application component
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:

```env
VITE_GITHUB_TOKEN=your_github_token
VITE_REPO_OWNER=your_username
VITE_REPO_NAME=your_repo_name
```

### Customization
- Modify `tailwind.config.js` for theme customization
- Update `src/types/index.ts` for type definitions
- Configure GitHub integration in the settings

## 🐛 Troubleshooting

### Common Issues

**Build errors with Tailwind**
- Ensure PostCSS is properly configured
- Check `tailwind.config.js` syntax

**Theme not switching**
- Check localStorage for theme persistence
- Verify CSS variables are loaded

**Markdown not rendering**
- Check for malformed markdown syntax
- Verify all plugins are installed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Lucide](https://lucide.dev/) for the beautiful icon set
- [React Markdown](https://github.com/remarkjs/react-markdown) for markdown rendering
- [Prism.js](https://prismjs.com/) for syntax highlighting

---

**Happy Learning! 📚✨**
