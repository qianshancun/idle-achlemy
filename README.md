# 🧪 Idle Alchemy

A web-based idle alchemy game where players combine basic elements to discover new ones. Built with TypeScript, Vite, and PixiJS.

## 🎮 Game Features

- **Four Basic Elements**: Start with Water 💧, Fire 🔥, Earth 🌍, and Air 🌬️
- **Element Combination**: Drag and drop elements to combine them
- **Discovery System**: Unlock new elements by experimenting with combinations
- **Mobile Friendly**: Responsive design optimized for touch devices
- **Progress Tracking**: Visual progress bar and element collection
- **Auto-Save**: Automatic progress saving to localStorage
- **Hint System**: Get hints when you're stuck

## 🎯 Basic Combinations

- 💧 Water + 🔥 Fire = 💨 Steam
- 🌍 Earth + 💧 Water = 🟫 Mud  
- 🔥 Fire + 🌍 Earth = 🌋 Lava
- 🌬️ Air + 🌍 Earth = 💨 Dust
- 🔥 Fire + 🌬️ Air = ⚡ Lightning
- 💧 Water + 🌬️ Air = ☁️ Cloud

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd idle-alchemy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The game will auto-reload when you make changes

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📁 Project Structure

```
idle-alchemy/
├── src/
│   ├── config/          # Game configuration
│   │   ├── elements.ts  # Element definitions
│   │   └── recipes.ts   # Merge recipes
│   ├── game/           # Core game logic
│   │   ├── Element.ts  # Individual element class
│   │   ├── ElementManager.ts # Element creation & merging
│   │   └── Game.ts     # Main game controller
│   ├── ui/             # User interface
│   │   └── UI.ts       # UI manager and styling
│   └── main.ts         # Application entry point
├── public/             # Static assets
├── index.html          # Main HTML file
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
└── README.md           # This file
```

## 🛠️ Technology Stack

- **TypeScript**: Type-safe JavaScript with modern ES features
- **Vite**: Fast build tool and development server
- **PixiJS**: High-performance 2D graphics rendering
- **Vanilla HTML/CSS**: Clean, dependency-free UI layer

## 🎨 Architecture Highlights

### Modular Configuration
- **Extensible Elements**: Add new elements in `src/config/elements.ts`
- **Recipe System**: Define combinations in `src/config/recipes.ts`
- **Separation of Concerns**: Game logic separated from UI and configuration

### Mobile-First Design
- Touch-optimized drag and drop
- Responsive layout that works on all screen sizes
- Gesture-friendly interface elements

### Performance Optimized
- PixiJS for smooth 60fps animations
- Efficient collision detection for element merging
- Minimal DOM manipulation for better performance

## 🔧 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run type-check` | Run TypeScript type checking |

## 🎮 How to Play

1. **Start with the Basics**: You begin with four basic elements arranged in a circle
2. **Drag to Combine**: Click and drag one element onto another to attempt a combination
3. **Discover New Elements**: Valid combinations will create new elements with visual effects
4. **Track Progress**: Watch your progress bar fill as you discover more elements
5. **Use Hints**: Click the hint button if you need inspiration
6. **Experiment**: Try different combinations to unlock the complete element collection

## 🔮 Future Enhancements

The game is designed to be easily extensible. Some potential additions:

- **More Element Categories**: Human-made, abstract, advanced elements
- **Achievement System**: Unlock badges for specific discoveries
- **Sound Effects**: Audio feedback for successful combinations
- **Particle Effects**: Enhanced visual effects for rare discoveries
- **Element Information**: Detailed descriptions and lore for each element
- **Multiplayer Features**: Share discoveries with friends

## 🐛 Troubleshooting

### Game Won't Load
- Ensure you have Node.js 16+ installed
- Try deleting `node_modules` and running `npm install` again
- Check browser console for error messages

### Performance Issues
- Try closing other browser tabs
- Ensure hardware acceleration is enabled in your browser
- The game is optimized for modern browsers (Chrome, Firefox, Safari, Edge)

### Save Data Issues
- Game data is stored in browser localStorage
- Clear browser data if you want to reset completely
- Use the in-game reset button for a clean restart

## 📜 License

MIT License - feel free to use this project as a starting point for your own games!

---

**Happy Experimenting!** 🧪✨ 