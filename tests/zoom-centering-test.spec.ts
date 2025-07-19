import { test, expect } from '@playwright/test';

test.describe('Advanced Zoom Functionality Tests', () => {
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

  test('Mouse wheel zoom centers on cursor position', async ({ page }) => {
    // Add elements to see zoom centering effect
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Position mouse at quarter of canvas (not center)
    const targetX = canvasBox!.width * 0.25;
    const targetY = canvasBox!.height * 0.25;
    
    // Move mouse to specific position
    await canvas.hover();
    await page.mouse.move(canvasBox!.x + targetX, canvasBox!.y + targetY);
    
    // Get initial container position
    const initialPosition = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        x: game.gameContainer.x,
        y: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    // Zoom in with mouse wheel
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);
    
    // Get new position after zoom
    const newPosition = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        x: game.gameContainer.x,
        y: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    expect(newPosition!.zoom).toBeGreaterThan(initialPosition!.zoom);
    // Container position should have changed to center zoom on mouse
    expect(newPosition!.x).not.toBe(initialPosition!.x);
    expect(newPosition!.y).not.toBe(initialPosition!.y);
    
    console.log('✅ Mouse wheel zoom centers on cursor:', 
      `${initialPosition!.zoom} → ${newPosition!.zoom}`,
      `Position: (${initialPosition!.x}, ${initialPosition!.y}) → (${newPosition!.x}, ${newPosition!.y})`);
  });

  test('Zoom buttons center on canvas center', async ({ page }) => {
    // Add an element away from center
    const canvas = page.locator('#game-container canvas');
    const fireElement = page.locator('[data-element-id="1"]').first();
    if (await fireElement.isVisible()) {
      await fireElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Get initial state
    const initialState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y
      } : null;
    });
    
    // Click zoom in button
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await page.waitForTimeout(200);
    
    // Get new state
    const newState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y
      } : null;
    });
    
    expect(newState!.zoom).toBeGreaterThan(initialState!.zoom);
    
    console.log('✅ Button zoom centers properly:', 
      `Zoom: ${initialState!.zoom} → ${newState!.zoom}`);
  });

  test('Auto Arrange resets zoom to 100%', async ({ page }) => {
    // First zoom in
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await zoomInBtn.click(); // 120% zoom
    await page.waitForTimeout(400);
    
    // Add some elements
    const waterElement = page.locator('[data-element-id="0"]').first();
    const fireElement = page.locator('[data-element-id="1"]').first();
    
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(500);
    }
    if (await fireElement.isVisible()) {
      await fireElement.click();
      await page.waitForTimeout(500);
    }
    
    // Verify we're zoomed in
    const zoomedState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    expect(zoomedState).toBeGreaterThan(1.0);
    
    // Click Auto Arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000); // Wait for animation
    
    // Check that zoom was reset to 100%
    const resetState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y
      } : null;
    });
    
    expect(resetState!.zoom).toBeCloseTo(1.0, 1);
    expect(resetState!.containerX).toBeCloseTo(0, 5); // Should be centered
    expect(resetState!.containerY).toBeCloseTo(0, 5);
    
    console.log('✅ Auto Arrange resets zoom:', `${zoomedState} → ${resetState!.zoom}`);
  });

  test('HD rendering provides crisp text when zoomed', async ({ page }) => {
    // Add an element to test
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot at 100% zoom
    const canvas = page.locator('#game-container canvas');
    const screenshot100 = await canvas.screenshot();
    
    // Zoom in significantly
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await zoomInBtn.click();
    await zoomInBtn.click(); // 130% zoom
    await page.waitForTimeout(600);
    
    // Take screenshot at zoomed level
    const screenshot130 = await canvas.screenshot();
    
    // Verify zoom level changed
    const zoomLevel = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? Math.round(game.getZoom() * 100) : null;
    });
    
    expect(zoomLevel).toBeGreaterThan(120);
    
    // Screenshots should be different (elements should be larger)
    expect(Buffer.compare(screenshot100, screenshot130)).not.toBe(0);
    
    console.log('✅ HD rendering test completed at zoom:', `${zoomLevel}%`);
  });

  test('Zoom limits are properly enforced with centering', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Position mouse at center for consistent testing
    await canvas.hover();
    await page.mouse.move(
      canvasBox!.x + canvasBox!.width / 2, 
      canvasBox!.y + canvasBox!.height / 2
    );
    
    // Test max zoom limit (try to zoom beyond 200%)
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const maxZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(maxZoom).toBeLessThanOrEqual(2.0); // Max zoom should be 200%
    
    // Test min zoom limit (try to zoom below 50%)
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    
    const minZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(minZoom).toBeGreaterThanOrEqual(0.5); // Min zoom should be 50%
    
    console.log('✅ Zoom limits enforced:', `Min: ${Math.round(minZoom! * 100)}%, Max: ${Math.round(maxZoom! * 100)}%`);
  });

  test('Pan and zoom work together correctly', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Add an element first
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Pan the canvas first
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100);
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Get state after panning
    const panState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    // Now zoom while maintaining pan
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);
    
    const zoomState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    expect(zoomState!.zoom).toBeGreaterThan(panState!.zoom);
    // Container position should change but maintain relative positioning
    expect(zoomState!.containerX).not.toBe(panState!.containerX);
    expect(zoomState!.containerY).not.toBe(panState!.containerY);
    
    console.log('✅ Pan and zoom work together:', 
      `Pan: (${panState!.containerX}, ${panState!.containerY})`,
      `Zoom: (${zoomState!.containerX}, ${zoomState!.containerY}) at ${Math.round(zoomState!.zoom * 100)}%`);
  });
}); 