import { Game } from '@/game/Game';
import { UI } from '@/ui/UI';
import { configLoader } from '@/config/ConfigLoader';
import { i18n } from '@/i18n/Translation';

class IdleAlchemy {
  private game: Game | null = null;
  private ui: UI | null = null;
  
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  private async initialize(): Promise<void> {
    const gameContainer = document.getElementById('game-container');
    
    if (!gameContainer) {
      console.error('Game container not found!');
      return;
    }
    
    try {
      // Show loading message
      gameContainer.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: white;
          text-align: center;
          font-family: system-ui, Arial, sans-serif;
        ">
          <div>
            <h2>🧪 Loading Idle Alchemy...</h2>
            <p>Loading element configurations...</p>
          </div>
        </div>
      `;
      
      // Initialize i18n system first
      await i18n.initialize();
      console.log('✅ i18n system loaded successfully');
      
      // Initialize configuration with new API
      await configLoader.loadConfig();
      console.log('✅ Configuration loaded successfully');
      
      // Clear loading message
      gameContainer.innerHTML = '';
      
      // Initialize the game
      this.game = new Game(gameContainer);
      
      // Initialize the UI
      this.ui = new UI(this.game);
      
      // Trigger UI update after both game and UI are ready (fixes page refresh bug)
      // This ensures the discovery panel shows loaded elements
      setTimeout(() => {
        if (this.game) {
          this.game.refreshUI();
        }
      }, 100);
      
      console.log('🧪 Idle Alchemy initialized successfully!');
      
      // Add some helpful console commands for development
      if (typeof window !== 'undefined') {
        (window as any).game = this.game;
        (window as any).config = configLoader;
        console.log('💡 Development tip: Access the game instance via window.game');
        console.log('💡 Development tip: Access the config loader via window.config');
      }
      
    } catch (error) {
      console.error('Failed to initialize Idle Alchemy:', error);
      this.showErrorMessage('Failed to load the game. Please refresh the page.');
    }
  }
  
  private showErrorMessage(message: string): void {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: white;
          text-align: center;
          font-family: system-ui, Arial, sans-serif;
        ">
          <div>
            <h2>⚠️ Oops!</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
              background: rgba(255, 255, 255, 0.1);
              border: 2px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            ">
              🔄 Reload Game
            </button>
          </div>
        </div>
      `;
    }
  }
  
  public destroy(): void {
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    if (this.ui) {
      this.ui = null;
    }
  }
}

// Initialize the game
new IdleAlchemy();

// Handle page unload
window.addEventListener('beforeunload', () => {
  // Game saves automatically, but we can add any cleanup here if needed
});

// Add some fun to the console
console.log(`
🧪 Welcome to Idle Alchemy! 🧪

Combine the four basic elements to discover new ones:
💧 Water + 🔥 Fire = 💨 Steam
🌍 Earth + 💧 Water = 🟫 Mud
🔥 Fire + 🌍 Earth = 🌋 Lava
🌬️ Air + 🌍 Earth = 💨 Dust
🔥 Fire + 🌬️ Air = ⚡ Lightning
💧 Water + 🌬️ Air = ☁️ Cloud

Happy experimenting!
`); 