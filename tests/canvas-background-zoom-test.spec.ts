import { test, expect } from '@playwright/test';

test.describe('Canvas Background and Zoom Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#game-container canvas', { timeout: 10000 });
    
    // Close help modal if present
    const closeButton = page.locator('#close-tooltip').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    await page.waitForTimeout(1000);
  });

  test('Canvas has light background in light mode', async ({ page }) => {
    // Ensure we're in light mode
    await page.evaluate(() => {
      document.body.classList.remove('dark-mode', 'dark');
    });
    await page.waitForTimeout(500);

    const backgroundColor = await page.evaluate(() => {
      const game = (window as any).game;
      if (!game) return null;
      
      return {
        color: game.app.renderer.background.color,
        hex: '#' + game.app.renderer.background.color.toString(16)
      };
    });

    expect(backgroundColor).not.toBeNull();
    expect(backgroundColor!.color).toBe(16316664); // 0xf8f8f8 - light gray
    expect(backgroundColor!.hex).toBe('#f8f8f8');
  });

  test('Canvas has dark background in dark mode', async ({ page }) => {
    // Switch to dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark-mode', 'dark');
    });
    await page.waitForTimeout(500);

    const backgroundColor = await page.evaluate(() => {
      const game = (window as any).game;
      if (!game) return null;
      
      return {
        color: game.app.renderer.background.color,
        hex: '#' + game.app.renderer.background.color.toString(16)
      };
    });

    expect(backgroundColor).not.toBeNull();
    expect(backgroundColor!.color).toBe(1710618); // 0x1a1a1a - dark gray
    expect(backgroundColor!.hex).toBe('#1a1a1a');
  });

  test('Dark mode toggle button changes canvas background', async ({ page }) => {
    // Get initial background
    const initialBg = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.app.renderer.background.color : null;
    });

    // Click dark mode toggle
    const darkModeToggle = page.locator('#dark-mode-toggle');
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    // Get new background
    const newBg = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.app.renderer.background.color : null;
    });

    expect(initialBg).not.toBe(newBg);
  });

  test('Zoom controls are present and have correct icons', async ({ page }) => {
    const zoomIn = page.locator('#zoom-in');
    const zoomOut = page.locator('#zoom-out');

    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();

    // Check icons
    const zoomInIcon = zoomIn.locator('.material-symbols-outlined');
    const zoomOutIcon = zoomOut.locator('.material-symbols-outlined');

    await expect(zoomInIcon).toContainText('zoom_in');
    await expect(zoomOutIcon).toContainText('zoom_out');
  });

  test('Zoom in button increases canvas zoom', async ({ page }) => {
    // Get initial zoom
    const initialZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    // Click zoom in
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await page.waitForTimeout(200);

    // Get new zoom
    const newZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    expect(newZoom).toBeGreaterThan(initialZoom);
    expect(newZoom).toBeCloseTo(1.1, 1); // Should be 1.0 + 0.1
  });

  test('Zoom out button decreases canvas zoom', async ({ page }) => {
    // First zoom in to have room to zoom out
    await page.locator('#zoom-in').click();
    await page.waitForTimeout(200);

    // Get current zoom
    const currentZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    // Click zoom out
    const zoomOutBtn = page.locator('#zoom-out');
    await zoomOutBtn.click();
    await page.waitForTimeout(200);

    // Get new zoom
    const newZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    expect(newZoom).toBeLessThan(currentZoom);
  });

  test('Mouse wheel zoom works', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    
    // Get initial zoom
    const initialZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    // Scroll up to zoom in
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Wheel up
    await page.waitForTimeout(200);

    const zoomedInValue = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    expect(zoomedInValue).toBeGreaterThan(initialZoom);

    // Scroll down to zoom out
    await page.mouse.wheel(0, 100); // Wheel down
    await page.waitForTimeout(200);

    const zoomedOutValue = await page.evaluate(() => {
      const game = window.game;
      return game ? game.getZoom() : null;
    });

    expect(zoomedOutValue).toBeLessThan(zoomedInValue);
  });

  test('Canvas elements scale with zoom', async ({ page }) => {
    // Add an element first
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }

    // Get game container scale
    const initialScale = await page.evaluate(() => {
      const game = window.game;
      return game ? game.gameContainer.scale.x : null;
    });

    // Zoom in
    await page.locator('#zoom-in').click();
    await page.waitForTimeout(200);

    // Check that container scale changed
    const newScale = await page.evaluate(() => {
      const game = window.game;
      return game ? game.gameContainer.scale.x : null;
    });

    expect(newScale).toBeGreaterThan(initialScale);
    expect(newScale).toBeCloseTo(1.1, 1);
  });

  test('Zoom level is persistent in localStorage', async ({ page }) => {
    // Zoom in a few times
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await zoomInBtn.click();
    await page.waitForTimeout(400);

    // Check localStorage
    const storedZoom = await page.evaluate(() => {
      return localStorage.getItem('idle-alchemy-zoom');
    });

    expect(storedZoom).toBe('120'); // Started at 100, clicked twice (+10 each)
  });

  test('Zoom controls show toast messages', async ({ page }) => {
    // Click zoom in and look for toast
    await page.locator('#zoom-in').click();
    
    // Check for toast message
    const toast = page.locator('div:has-text("Canvas zoom:")');
    await expect(toast).toBeVisible({ timeout: 2000 });
    await expect(toast).toContainText('110%');
  });

  test('Zoom respects min and max limits', async ({ page }) => {
    // Test max zoom (try to go beyond 200%)
    const zoomInBtn = page.locator('#zoom-in');
    for (let i = 0; i < 15; i++) { // Click many times
      await zoomInBtn.click();
      await page.waitForTimeout(50);
    }

    const maxZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? Math.round(game.getZoom() * 100) : null;
    });

    expect(maxZoom).toBeLessThanOrEqual(200);

    // Test min zoom
    const zoomOutBtn = page.locator('#zoom-out');
    for (let i = 0; i < 20; i++) { // Click many times  
      await zoomOutBtn.click();
      await page.waitForTimeout(50);
    }

    const minZoom = await page.evaluate(() => {
      const game = window.game;
      return game ? Math.round(game.getZoom() * 100) : null;
    });

    expect(minZoom).toBeGreaterThanOrEqual(50);
  });
}); 