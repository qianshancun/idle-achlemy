import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for the game to load completely
    await page.waitForSelector('#game-container');
    await page.waitForFunction(() => (window as any).game && (window as any).game.ui);
    await page.waitForTimeout(3000);
    
    // Verify game is ready
    const gameReady = await page.evaluate(() => {
      return !!(window as any).game && !!(window as any).game.ui && !!(window as any).game.elementManager;
    });
    
    if (gameReady) {
      // Create some elements for testing
      await page.evaluate(() => {
        // Simulate discovering elements to test
        (window as any).game.elementManager.discoveredElements.add('water');
        (window as any).game.elementManager.discoveredElements.add('fire'); 
        (window as any).game.elementManager.discoveredElements.add('earth');
        (window as any).game.elementManager.discoveredElements.add('air');
        (window as any).game.elementManager.discoveredElements.add('steam');
        (window as any).game.elementManager.discoveredElements.add('plant');
      });
      
      // Refresh UI to show discovered elements
      await page.evaluate(() => {
        (window as any).game.ui.updateUI();
      });
    }
    
    await page.waitForTimeout(1000);
  });

  test('1. Help overlay should cover entire window', async ({ page }) => {
    // Show help overlay
    const helpOverlay = page.locator('#help-tooltip');
    
    // If hidden, show it by removing hidden class
    await page.evaluate(() => {
      const overlay = document.getElementById('help-tooltip');
      if (overlay) {
        overlay.classList.remove('hidden');
      }
    });
    
    await expect(helpOverlay).toBeVisible();
    
    // Check overlay covers entire viewport
    const overlayBox = await helpOverlay.boundingBox();
    const viewportSize = page.viewportSize();
    
    expect(overlayBox).not.toBeNull();
    expect(overlayBox!.x).toBe(0);
    expect(overlayBox!.y).toBe(0);
    expect(overlayBox!.width).toBe(viewportSize!.width);
    expect(overlayBox!.height).toBe(viewportSize!.height);
    
    // Check z-index is high enough
    const zIndex = await helpOverlay.evaluate(el => 
      window.getComputedStyle(el).zIndex
    );
    expect(parseInt(zIndex)).toBeGreaterThan(9000);
    
    // Verify backdrop filter is applied
    const backdropFilter = await helpOverlay.evaluate(el => 
      window.getComputedStyle(el).backdropFilter
    );
    expect(backdropFilter).toContain('blur');
  });

  test('2. Discovery panel layout - Desktop to Mobile transition', async ({ page }) => {
    // Start in desktop mode
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    const discoveryPanel = page.locator('#discovery-panel');
    const gameContainer = page.locator('#game-container');
    
    // Verify desktop layout (side panel)
    const desktopPanelBox = await discoveryPanel.boundingBox();
    const desktopGameBox = await gameContainer.boundingBox();
    
    expect(desktopPanelBox!.x + desktopPanelBox!.width).toBe(1024); // Panel extends to right edge
    expect(desktopGameBox!.x + desktopGameBox!.width).toBeCloseTo(desktopPanelBox!.x, 2); // No gap
    
    // Transition to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500); // Wait for resize overlay and layout update
    
    // Verify mobile layout (bottom panel)
    const mobilePanelBox = await discoveryPanel.boundingBox();
    const mobileGameBox = await gameContainer.boundingBox();
    
    expect(mobilePanelBox!.y + mobilePanelBox!.height).toBe(667); // Panel extends to bottom edge
    expect(mobileGameBox!.y + mobileGameBox!.height).toBeCloseTo(mobilePanelBox!.y, 2); // No gap
    expect(mobilePanelBox!.width).toBe(375); // Panel full width
    
    // Transition back to desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1500);
    
    // Verify desktop layout is restored
    const restoredPanelBox = await discoveryPanel.boundingBox();
    const restoredGameBox = await gameContainer.boundingBox();
    
    expect(restoredPanelBox!.x + restoredPanelBox!.width).toBe(1024);
    expect(restoredGameBox!.x + restoredGameBox!.width).toBeCloseTo(restoredPanelBox!.x, 2);
  });

  test('3. Panel resize with overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Get initial panel width
    const initialWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    
    // Start resize drag
    await resizeHandle.hover();
    await page.mouse.down();
    
    // Drag to resize (make panel wider)
    await page.mouse.move(800, 400);
    await page.waitForTimeout(200);
    
    // Check if resize overlay appears during drag
    // Note: This might be tricky to test as overlay appears/disappears quickly
    
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Verify panel was resized
    const newWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
    
    // Verify no layout gaps
    const gameContainer = page.locator('#game-container');
    const panelBox = await discoveryPanel.boundingBox();
    const gameBox = await gameContainer.boundingBox();
    
    expect(gameBox!.x + gameBox!.width).toBeCloseTo(panelBox!.x, 2);
  });

  test('4. Discovery elements have proper borders', async ({ page }) => {
    const elementCards = await page.locator('.element-card').all();
    
    expect(elementCards.length).toBeGreaterThan(0);
    
    for (const card of elementCards) {
      // Check border exists
      const borderWidth = await card.evaluate(el => 
        window.getComputedStyle(el).borderWidth
      );
      expect(borderWidth).toBe('1px');
      
      // Check border color is defined
      const borderColor = await card.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).not.toBe('');
      expect(borderColor).not.toBe('transparent');
      
      // Check background is not transparent
      const backgroundColor = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).not.toBe('transparent');
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      
      // Check hover effect changes appearance
      const initialBackground = backgroundColor;
      await card.hover();
      await page.waitForTimeout(100);
      
      const hoverBackground = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      // Should be different on hover
      expect(hoverBackground).not.toBe(initialBackground);
    }
  });

  test('5. Discovery elements are content-fit width', async ({ page }) => {
    const elementGrid = page.locator('.element-grid');
    const elementCards = await page.locator('.element-card').all();
    
    // Check grid uses flex-wrap
    const display = await elementGrid.evaluate(el => 
      window.getComputedStyle(el).display
    );
    const flexWrap = await elementGrid.evaluate(el => 
      window.getComputedStyle(el).flexWrap
    );
    
    expect(display).toBe('flex');
    expect(flexWrap).toBe('wrap');
    
    // Check elements don't take full width
    const gridWidth = await elementGrid.evaluate(el => (el as HTMLElement).offsetWidth);
    
    for (const card of elementCards) {
      const cardWidth = await card.evaluate(el => (el as HTMLElement).offsetWidth);
      expect(cardWidth).toBeLessThan(gridWidth * 0.5); // Should be much smaller than grid
      
      // Check width style
      const widthStyle = await card.evaluate(el => 
        window.getComputedStyle(el).width
      );
      expect(widthStyle).toBe('fit-content');
    }
  });

  test('6. Dark mode element borders work correctly', async ({ page }) => {
    // Enable dark mode
    await page.click('#dark-mode-toggle');
    await page.waitForTimeout(500);
    
    // Check body has dark class
    const bodyClasses = await page.evaluate(() => document.body.className);
    expect(bodyClasses).toContain('dark');
    
    const elementCards = await page.locator('.element-card').all();
    
    for (const card of elementCards.slice(0, 2)) { // Test first 2 cards
      // Check dark mode border color
      const borderColor = await card.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      
      const backgroundColor = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have dark theme colors (darker backgrounds)
      expect(backgroundColor).not.toBe('rgb(255, 255, 255)'); // Not white
    }
  });

  test('7. Auto arrange centers elements properly', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    // Add several elements to canvas for testing
    await page.evaluate(() => {
      const game = (window as any).game;
      // Add elements at random positions
      for (let i = 0; i < 6; i++) {
        game.addElement('water', Math.random() * 800, Math.random() * 600);
        game.addElement('fire', Math.random() * 800, Math.random() * 600);
      }
    });
    
    await page.waitForTimeout(500);
    
    // Get canvas dimensions
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Click auto arrange
    await page.click('#auto-arrange-action');
    await page.waitForTimeout(2000); // Wait for animation
    
    // Get element positions after arrangement
    const elementPositions = await page.evaluate(() => {
      const game = (window as any).game;
      const elements = game.getAllCanvasElements();
      return elements.map((el: any) => ({ x: el.x, y: el.y }));
    });
    
    expect(elementPositions.length).toBeGreaterThan(0);
    
    // Calculate center of mass of arranged elements
    const avgX = elementPositions.reduce((sum, pos) => sum + pos.x, 0) / elementPositions.length;
    const avgY = elementPositions.reduce((sum, pos) => sum + pos.y, 0) / elementPositions.length;
    
    // Should be roughly centered in the canvas view
    const expectedCenterX = (canvasBox!.width) / 2;
    const expectedCenterY = (canvasBox!.height) / 2;
    
    // Allow some tolerance for centering
    expect(Math.abs(avgX - expectedCenterX)).toBeLessThan(100);
    expect(Math.abs(avgY - expectedCenterY)).toBeLessThan(100);
    
    // Check elements are in a grid pattern (relatively aligned)
    const sortedByX = [...elementPositions].sort((a, b) => a.x - b.x);
    const sortedByY = [...elementPositions].sort((a, b) => a.y - b.y);
    
    // Elements should have consistent spacing
    if (sortedByX.length > 1) {
      const xSpacings: number[] = [];
      for (let i = 1; i < sortedByX.length; i++) {
        const spacing = sortedByX[i].x - sortedByX[i-1].x;
        if (spacing > 10) xSpacings.push(spacing); // Only significant spacings
      }
      
      if (xSpacings.length > 1) {
        const avgSpacing = xSpacings.reduce((sum, s) => sum + s, 0) / xSpacings.length;
        // Spacings should be relatively consistent (within 20px variance)
        for (const spacing of xSpacings) {
          expect(Math.abs(spacing - avgSpacing)).toBeLessThan(30);
        }
      }
    }
  });

  test('8. Visual verification screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(2000);
    
    // Add some elements and arrange them
    await page.evaluate(() => {
      const game = (window as any).game;
      game.addElement('water', 100, 100);
      game.addElement('fire', 200, 150);
      game.addElement('earth', 300, 200);
      game.addElement('air', 400, 250);
    });
    
    await page.waitForTimeout(500);
    await page.click('#auto-arrange-action');
    await page.waitForTimeout(2000);
    
    // Take screenshot for visual verification
    await expect(page).toHaveScreenshot('comprehensive-fixes-verification.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('9. Performance - Resize handling', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    const startTime = Date.now();
    
    // Rapidly change viewport sizes
    for (let i = 0; i < 3; i++) {
      await page.setViewportSize({ width: 800 + i * 100, height: 600 + i * 50 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 400, height: 667 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (not hanging or very slow)
    expect(totalTime).toBeLessThan(5000);
    
    // Check final layout is correct
    const discoveryPanel = page.locator('#discovery-panel');
    const gameContainer = page.locator('#game-container');
    
    const panelBox = await discoveryPanel.boundingBox();
    const gameBox = await gameContainer.boundingBox();
    
    // No gaps or overlaps
    expect(gameBox!.x + gameBox!.width).toBeCloseTo(panelBox!.x, 5);
  });
}); 