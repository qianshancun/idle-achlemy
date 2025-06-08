import { Game } from '@/game/Game';
import { UI } from '@/ui/UI';

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
  
  private initialize(): void {
    const gameContainer = document.getElementById('game-container');
    
    if (!gameContainer) {
      console.error('Game container not found!');
      return;
    }
    
    try {
      // Initialize the game
      this.game = new Game(gameContainer);
      
      // Initialize the UI
      this.ui = new UI(this.game);
      
      console.log('🧪 Idle Alchemy initialized successfully!');
      
      // Add some helpful console commands for development
      if (typeof window !== 'undefined') {
        (window as any).game = this.game;
        console.log('💡 Development tip: Access the game instance via window.game');
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
          font-family: Arial, sans-serif;
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