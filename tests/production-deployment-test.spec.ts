import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://b546b19e.idle-alchemy.pages.dev';

test.describe('Production Deployment - Canvas & Zoom Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForSelector('#game-container canvas', { timeout: 10000 });
    
    // Close help modal if present
    const closeButton = page.locator('#close-tooltip').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    await page.waitForTimeout(1000);
  });

  test('Production: Canvas has light background in light mode', async ({ page }) => {
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
    console.log('✅ Production canvas background in light mode:', backgroundColor!.hex);
  });

  test('Production: Canvas has dark background in dark mode', async ({ page }) => {
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
    console.log('✅ Production canvas background in dark mode:', backgroundColor!.hex);
  });

  test('Production: Dark mode toggle changes canvas background', async ({ page }) => {
    const initialBg = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.app.renderer.background.color : null;
    });

    // Click dark mode toggle
    const darkModeToggle = page.locator('#dark-mode-toggle');
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    const newBg = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.app.renderer.background.color : null;
    });

    expect(initialBg).not.toBe(newBg);
    console.log('✅ Dark mode toggle changes background:', initialBg, '→', newBg);
  });

  test('Production: Zoom controls work correctly', async ({ page }) => {
    const zoomIn = page.locator('#zoom-in');
    const zoomOut = page.locator('#zoom-out');

    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();

    // Test zoom in
    const initialZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });

    await zoomIn.click();
    await page.waitForTimeout(200);

    const newZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });

    expect(newZoom).toBeGreaterThan(initialZoom!);
    console.log('✅ Zoom in works:', initialZoom, '→', newZoom);
  });

  test('Production: Mouse wheel zoom functionality', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    
    const initialZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });

    // Scroll to zoom in
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);

    const zoomedIn = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });

    expect(zoomedIn).toBeGreaterThan(initialZoom!);
    console.log('✅ Mouse wheel zoom works:', initialZoom, '→', zoomedIn);
  });

  test('Production: Elements are visible on canvas', async ({ page }) => {
    // Add water element
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);

      // Verify element was added and is visible
      const elementsCount = await page.evaluate(() => {
        const game = (window as any).game;
        return game ? game.elements.length : 0;
      });

      expect(elementsCount).toBeGreaterThan(0);
      console.log('✅ Elements visible on canvas. Count:', elementsCount);

      // Take a screenshot to verify visual appearance
      const canvas = page.locator('#game-container canvas');
      await canvas.screenshot({ path: 'production-canvas-test.png' });
      console.log('✅ Canvas screenshot saved for visual verification');
    }
  });

  test('Production: Game functionality comprehensive test', async ({ page }) => {
    console.log('🎮 Testing comprehensive game functionality on production...');
    
    // Test canvas background
    const bgColor = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.app.renderer.background.color : null;
    });
    expect(bgColor).toBeTruthy();
    
    // Test zoom
    const zoomLevel = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    expect(zoomLevel).toBe(1.0); // Should start at 100%
    
    // Test element addition
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Test zoom with elements
    await page.locator('#zoom-in').click();
    await page.waitForTimeout(200);
    
    const newZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    expect(newZoom).toBeCloseTo(1.1, 1);
    
    console.log('✅ All production functionality tests passed!');
  });
}); 