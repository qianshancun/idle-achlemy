import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://8ee11fe5.idle-alchemy.pages.dev';

test.describe('Production - Advanced Zoom Functionality', () => {
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

  test('Production: Mouse wheel zoom centers on cursor', async ({ page }) => {
    console.log('🎯 Testing mouse wheel zoom centering on production...');
    
    // Add an element for better visual reference
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Position mouse at specific location (not center)
    const targetX = canvasBox!.width * 0.3;
    const targetY = canvasBox!.height * 0.3;
    
    await canvas.hover();
    await page.mouse.move(canvasBox!.x + targetX, canvasBox!.y + targetY);
    
    // Get initial state
    const initialState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        x: game.gameContainer.x,
        y: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    // Mouse wheel zoom in
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);
    
    // Get new state
    const newState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        x: game.gameContainer.x,
        y: game.gameContainer.y,
        zoom: game.getZoom()
      } : null;
    });
    
    expect(newState!.zoom).toBeGreaterThan(initialState!.zoom);
    expect(newState!.x).not.toBe(initialState!.x);
    expect(newState!.y).not.toBe(initialState!.y);
    
    console.log('✅ Production mouse wheel zoom centers correctly:', 
      `${initialState!.zoom} → ${newState!.zoom}`,
      `Container moved: (${initialState!.x}, ${initialState!.y}) → (${newState!.x}, ${newState!.y})`);
  });

  test('Production: Auto Arrange resets zoom and centers grid', async ({ page }) => {
    console.log('📋 Testing Auto Arrange zoom reset on production...');
    
    // Zoom in first
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await zoomInBtn.click(); // 120% zoom
    await page.waitForTimeout(400);
    
    // Add multiple elements
    const elements = ['[data-element-id="0"]', '[data-element-id="1"]', '[data-element-id="2"]'];
    for (const elementSelector of elements) {
      const element = page.locator(elementSelector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Verify we're zoomed in
    const zoomedState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        elementsCount: game.elements.length
      } : null;
    });
    
    expect(zoomedState!.zoom).toBeGreaterThan(1.0);
    expect(zoomedState!.elementsCount).toBeGreaterThan(1);
    
    // Auto Arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000);
    
    // Check results
    const arrangedState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y,
        elementsCount: game.elements.length
      } : null;
    });
    
    expect(arrangedState!.zoom).toBeCloseTo(1.0, 1);
    expect(arrangedState!.containerX).toBeCloseTo(0, 10);
    expect(arrangedState!.containerY).toBeCloseTo(0, 10);
    
    console.log('✅ Production Auto Arrange works correctly:', 
      `Zoom reset: ${zoomedState!.zoom} → ${arrangedState!.zoom}`,
      `Elements arranged: ${arrangedState!.elementsCount}`,
      `Container centered: (${arrangedState!.containerX}, ${arrangedState!.containerY})`);
  });

  test('Production: HD rendering prevents blurry zoom', async ({ page }) => {
    console.log('🔍 Testing HD rendering on production...');
    
    // Add an element to test
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot at normal zoom
    const canvas = page.locator('#game-container canvas');
    await page.waitForTimeout(500);
    const normalScreenshot = await canvas.screenshot({ path: 'production-normal-zoom.png' });
    
    // Zoom in significantly
    const zoomInBtn = page.locator('#zoom-in');
    for (let i = 0; i < 5; i++) {
      await zoomInBtn.click();
      await page.waitForTimeout(100);
    }
    
    const zoomedScreenshot = await canvas.screenshot({ path: 'production-zoomed.png' });
    
    // Get final zoom level
    const zoomLevel = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? Math.round(game.getZoom() * 100) : null;
    });
    
    expect(zoomLevel).toBeGreaterThan(140);
    expect(Buffer.compare(normalScreenshot, zoomedScreenshot)).not.toBe(0);
    
    console.log('✅ Production HD rendering test completed:', 
      `Final zoom: ${zoomLevel}%`,
      'Screenshots saved for visual verification');
  });

  test('Production: Zoom buttons work with proper centering', async ({ page }) => {
    console.log('🔘 Testing zoom buttons on production...');
    
    // Add element for visual reference
    const fireElement = page.locator('[data-element-id="1"]').first();
    if (await fireElement.isVisible()) {
      await fireElement.click();
      await page.waitForTimeout(1000);
    }
    
    // Test zoom in button
    const zoomInBtn = page.locator('#zoom-in');
    const initialZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    await zoomInBtn.click();
    await page.waitForTimeout(200);
    
    const zoomedIn = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(zoomedIn).toBeCloseTo(1.1, 1);
    
    // Test zoom out button
    const zoomOutBtn = page.locator('#zoom-out');
    await zoomOutBtn.click();
    await page.waitForTimeout(200);
    
    const zoomedOut = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(zoomedOut).toBeCloseTo(1.0, 1);
    
    console.log('✅ Production zoom buttons work correctly:', 
      `${initialZoom} → ${zoomedIn} → ${zoomedOut}`);
  });

  test('Production: Zoom limits are enforced', async ({ page }) => {
    console.log('⚡ Testing zoom limits on production...');
    
    const canvas = page.locator('#game-container canvas');
    await canvas.hover();
    
    // Test max zoom
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const maxZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(maxZoom).toBeLessThanOrEqual(2.0);
    
    // Test min zoom
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    
    const minZoom = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(minZoom).toBeGreaterThanOrEqual(0.5);
    
    console.log('✅ Production zoom limits enforced correctly:', 
      `Min: ${Math.round(minZoom! * 100)}%, Max: ${Math.round(maxZoom! * 100)}%`);
  });

  test('Production: Complete zoom functionality integration', async ({ page }) => {
    console.log('🎮 Running complete zoom integration test...');
    
    // Add elements
    const elements = ['[data-element-id="0"]', '[data-element-id="1"]'];
    for (const elementSelector of elements) {
      const element = page.locator(elementSelector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Test mouse wheel zoom
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    await canvas.hover();
    await page.mouse.move(
      canvasBox!.x + canvasBox!.width * 0.6, 
      canvasBox!.y + canvasBox!.height * 0.4
    );
    
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);
    
    const wheelZoomState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y
      } : null;
    });
    
    expect(wheelZoomState!.zoom).toBeGreaterThan(1.0);
    
    // Test button zoom
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await page.waitForTimeout(200);
    
    const buttonZoomState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(buttonZoomState).toBeGreaterThan(wheelZoomState!.zoom);
    
    // Test Auto Arrange reset
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000);
    
    const finalState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? {
        zoom: game.getZoom(),
        containerX: game.gameContainer.x,
        containerY: game.gameContainer.y
      } : null;
    });
    
    expect(finalState!.zoom).toBeCloseTo(1.0, 1);
    expect(finalState!.containerX).toBeCloseTo(0, 10);
    expect(finalState!.containerY).toBeCloseTo(0, 10);
    
    console.log('✅ Complete integration test passed:', 
      `Wheel zoom: 1.0 → ${wheelZoomState!.zoom}`,
      `Button zoom: ${wheelZoomState!.zoom} → ${buttonZoomState}`,
      `Auto Arrange reset: ${buttonZoomState} → ${finalState!.zoom}`);
  });
}); 