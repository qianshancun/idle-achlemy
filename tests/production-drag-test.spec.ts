import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://05d0b747.idle-alchemy.pages.dev';

test.describe('Production - Drag and Auto Arrange Fixes', () => {
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

  test('Production: Drag behavior is zoom-corrected', async ({ page }) => {
    console.log('🎯 Testing zoom-corrected drag on production...');
    
    // Add an element to drag
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    const element = page.locator('#game-container canvas').locator('text=💧').first();
    
    if (await element.isVisible()) {
      // Test at 100% zoom
      const startPos = await element.boundingBox();
      const mouseStartX = startPos!.x + 30;
      const mouseStartY = startPos!.y + 30;
      
      await page.mouse.move(mouseStartX, mouseStartY);
      await page.mouse.down();
      
      // Move mouse 60px right and 60px down
      await page.mouse.move(mouseStartX + 60, mouseStartY + 60);
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await element.boundingBox();
      const actualMoveX = endPos!.x - startPos!.x;
      const actualMoveY = endPos!.y - startPos!.y;
      
      console.log('✅ 100% zoom - Mouse moved 60px, element moved:', 
        `${Math.round(actualMoveX)}px, ${Math.round(actualMoveY)}px`);
      
      // Element should move approximately with mouse (allowing for some tolerance)
      expect(Math.abs(actualMoveX - 60)).toBeLessThan(30);
      expect(Math.abs(actualMoveY - 60)).toBeLessThan(30);
    }
    
    // Zoom in to 150%
    const zoomInBtn = page.locator('#zoom-in');
    for (let i = 0; i < 5; i++) {
      await zoomInBtn.click();
      await page.waitForTimeout(100);
    }
    
    // Test drag at 150% zoom
    const elementZoomed = page.locator('#game-container canvas').locator('text=💧').first();
    if (await elementZoomed.isVisible()) {
      const startPos = await elementZoomed.boundingBox();
      const mouseStartX = startPos!.x + 30;
      const mouseStartY = startPos!.y + 30;
      
      await page.mouse.move(mouseStartX, mouseStartY);
      await page.mouse.down();
      
      // Move mouse 60px right and 60px down
      await page.mouse.move(mouseStartX + 60, mouseStartY + 60);
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await elementZoomed.boundingBox();
      const actualMoveX = endPos!.x - startPos!.x;
      const actualMoveY = endPos!.y - startPos!.y;
      
      console.log('✅ 150% zoom - Mouse moved 60px, element moved:', 
        `${Math.round(actualMoveX)}px, ${Math.round(actualMoveY)}px`);
      
      // Element should move approximately with mouse (allowing for some tolerance)
      expect(Math.abs(actualMoveX - 60)).toBeLessThan(30);
      expect(Math.abs(actualMoveY - 60)).toBeLessThan(30);
    }
  });

  test('Production: Auto Arrange provides better spacing', async ({ page }) => {
    console.log('📋 Testing improved Auto Arrange spacing on production...');
    
    // Add multiple elements
    const elements = ['[data-element-id="0"]', '[data-element-id="1"]', '[data-element-id="2"]', '[data-element-id="3"]'];
    for (const elementSelector of elements) {
      const element = page.locator(elementSelector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Verify elements are added
    const elementCount = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.elements.length : 0;
    });
    expect(elementCount).toBeGreaterThan(1);
    
    // Click Auto Arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000); // Wait for animation
    
    // Get element positions after arrangement
    const positions = await page.evaluate(() => {
      const game = (window as any).game;
      if (!game) return [];
      
      return game.elements.map((el: any) => ({
        id: el.definition.id,
        x: el.x,
        y: el.y
      }));
    });
    
    expect(positions.length).toBeGreaterThan(1);
    
    // Check that elements are not overlapping (minimum distance between any two)
    let minDistance = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const distance = Math.sqrt(
          Math.pow(positions[i].x - positions[j].x, 2) + 
          Math.pow(positions[i].y - positions[j].y, 2)
        );
        minDistance = Math.min(minDistance, distance);
      }
    }
    
    // Elements should be at least 60px apart (element size + spacing)
    expect(minDistance).toBeGreaterThan(60);
    
    console.log('✅ Production Auto Arrange spacing test passed:', 
      `${positions.length} elements arranged`,
      `Minimum distance: ${Math.round(minDistance)}px`);
  });

  test('Production: Drag works correctly at all zoom levels', async ({ page }) => {
    console.log('🔄 Testing drag functionality across zoom levels...');
    
    // Add element
    const waterElement = page.locator('[data-element-id="0"]').first();
    if (await waterElement.isVisible()) {
      await waterElement.click();
      await page.waitForTimeout(1000);
    }
    
    const element = page.locator('#game-container canvas').locator('text=💧').first();
    
    // Test at 100% zoom
    if (await element.isVisible()) {
      const startPos = await element.boundingBox();
      
      await element.hover();
      await page.mouse.down();
      await page.mouse.move(startPos!.x + 80, startPos!.y + 80);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await element.boundingBox();
      const moved = startPos!.x !== endPos!.x || startPos!.y !== endPos!.y;
      
      expect(moved).toBe(true);
      console.log('✅ Element successfully dragged at 100% zoom');
    }
    
    // Zoom in and test
    const zoomInBtn = page.locator('#zoom-in');
    await zoomInBtn.click();
    await zoomInBtn.click();
    await page.waitForTimeout(200);
    
    const elementZoomed = page.locator('#game-container canvas').locator('text=💧').first();
    if (await elementZoomed.isVisible()) {
      const startPos = await elementZoomed.boundingBox();
      
      await elementZoomed.hover();
      await page.mouse.down();
      await page.mouse.move(startPos!.x + 80, startPos!.y + 80);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await elementZoomed.boundingBox();
      const moved = startPos!.x !== endPos!.x || startPos!.y !== endPos!.y;
      
      expect(moved).toBe(true);
      console.log('✅ Element successfully dragged at 120% zoom');
    }
    
    // Zoom out and test
    const zoomOutBtn = page.locator('#zoom-out');
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await page.waitForTimeout(200);
    
    const elementZoomedOut = page.locator('#game-container canvas').locator('text=💧').first();
    if (await elementZoomedOut.isVisible()) {
      const startPos = await elementZoomedOut.boundingBox();
      
      await elementZoomedOut.hover();
      await page.mouse.down();
      await page.mouse.move(startPos!.x + 80, startPos!.y + 80);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await elementZoomedOut.boundingBox();
      const moved = startPos!.x !== endPos!.x || startPos!.y !== endPos!.y;
      
      expect(moved).toBe(true);
      console.log('✅ Element successfully dragged at 90% zoom');
    }
  });

  test('Production: Auto Arrange creates visually pleasing layout', async ({ page }) => {
    console.log('🎨 Testing Auto Arrange visual layout on production...');
    
    // Add 6 elements for a nice grid
    const elements = ['[data-element-id="0"]', '[data-element-id="1"]', '[data-element-id="2"]', 
                     '[data-element-id="3"]', '[data-element-id="4"]', '[data-element-id="5"]'];
    for (const elementSelector of elements) {
      const element = page.locator(elementSelector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Auto Arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot to verify visual layout
    const canvas = page.locator('#game-container canvas');
    const screenshot = await canvas.screenshot({ path: 'production-auto-arrange-layout.png' });
    
    // Get layout information
    const layoutInfo = await page.evaluate(() => {
      const game = (window as any).game;
      if (!game) return null;
      
      const positions = game.elements.map((el: any) => ({ x: el.x, y: el.y }));
      
      // Calculate grid dimensions
      const xs = positions.map(p => p.x).sort((a, b) => a - b);
      const ys = positions.map(p => p.y).sort((a, b) => a - b);
      
      return {
        elementCount: positions.length,
        xRange: xs[xs.length - 1] - xs[0],
        yRange: ys[ys.length - 1] - ys[0],
        positions: positions
      };
    });
    
    expect(layoutInfo!.elementCount).toBeGreaterThan(1);
    expect(layoutInfo!.xRange).toBeGreaterThan(100); // Should be spread out
    expect(layoutInfo!.yRange).toBeGreaterThan(50);  // Should have some height
    
    console.log('✅ Production Auto Arrange layout test passed:', 
      `${layoutInfo!.elementCount} elements`,
      `Spread: ${Math.round(layoutInfo!.xRange)}x${Math.round(layoutInfo!.yRange)}px`,
      'Screenshot saved for visual verification');
  });

  test('Production: Complete drag and auto arrange integration', async ({ page }) => {
    console.log('🎮 Running complete integration test...');
    
    // Add elements
    const elements = ['[data-element-id="0"]', '[data-element-id="1"]', '[data-element-id="2"]'];
    for (const elementSelector of elements) {
      const element = page.locator(elementSelector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Verify elements added
    const elementCount = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.elements.length : 0;
    });
    expect(elementCount).toBeGreaterThan(1);
    
    // Test drag before auto arrange
    const element = page.locator('#game-container canvas').locator('text=💧').first();
    if (await element.isVisible()) {
      const startPos = await element.boundingBox();
      
      await element.hover();
      await page.mouse.down();
      await page.mouse.move(startPos!.x + 50, startPos!.y + 50);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await element.boundingBox();
      const moved = startPos!.x !== endPos!.x || startPos!.y !== endPos!.y;
      expect(moved).toBe(true);
    }
    
    // Auto Arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000);
    
    // Test drag after auto arrange
    const elementAfterArrange = page.locator('#game-container canvas').locator('text=💧').first();
    if (await elementAfterArrange.isVisible()) {
      const startPos = await elementAfterArrange.boundingBox();
      
      await elementAfterArrange.hover();
      await page.mouse.down();
      await page.mouse.move(startPos!.x + 50, startPos!.y + 50);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      const endPos = await elementAfterArrange.boundingBox();
      const moved = startPos!.x !== endPos!.x || startPos!.y !== endPos!.y;
      expect(moved).toBe(true);
    }
    
    // Verify zoom was reset
    const zoomLevel = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getZoom() : null;
    });
    
    expect(zoomLevel).toBeCloseTo(1.0, 1);
    
    console.log('✅ Complete integration test passed:', 
      `${elementCount} elements processed`,
      `Final zoom: ${Math.round(zoomLevel! * 100)}%`);
  });
}); 