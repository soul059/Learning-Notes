# Quick Start Guide

Get up and running with Learning Notes in just a few minutes!

## 🚀 Installation Options

### Option 1: Clone and Run Locally
```bash
# Clone the repository
git clone https://github.com/soul059/Learning.git
cd Learning/website

# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/soul059/Learning)

### Option 3: Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/soul059/Learning)

## ⚡ First Steps

### 1. **Explore the Interface**
- Browse the file tree in the sidebar
- Try the search function with `Cmd+K` or `Ctrl+K`
- Switch between light and dark themes

### 2. **Add Your Content**
- Create markdown files in `public/welcome/`
- Organize files into folders
- Use rich markdown syntax with code blocks

### 3. **Connect GitHub (Optional)**
- Click "Connect" in the sidebar
- Add your GitHub Personal Access Token
- Create pull requests directly from the editor

## 🎯 Key Features to Try

### **Smart Search**
Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) and start typing to search across all your notes.

### **Live Editing**
Click the edit button on any file to start editing with live preview.

### **Theme Switching**
Toggle between light and dark modes using the theme button in the sidebar.

### **GitHub Integration**
Connect your repository to create pull requests and collaborate with your team.

## 📱 Mobile Support

Learning Notes works great on mobile devices:
- Responsive design adapts to any screen size
- Touch-friendly navigation
- Optimized reading experience

## 🔧 Customization

### **Themes**
Customize the appearance by modifying `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Your custom colors here
      }
    }
  }
}
```

### **Content Structure**
Organize your content in the `public/welcome/` directory:
```
public/
  welcome/
    home.md
    guides/
      setup.md
      features.md
    tutorials/
      first-steps.md
```

## 🆘 Need Help?

- 📖 **Documentation**: Check out the full documentation
- 🐛 **Issues**: Report bugs on GitHub
- 💬 **Discussions**: Join the community discussions
- 📧 **Contact**: Reach out for support

## 🎉 What's Next?

Now that you're set up, explore these features:
- [ ] Create your first note
- [ ] Try the search functionality
- [ ] Connect your GitHub repository
- [ ] Customize the theme
- [ ] Share with your team
