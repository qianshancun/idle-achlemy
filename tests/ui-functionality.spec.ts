import { test, expect } from '@playwright/test';

test.describe('Idle Alchemy Game UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    // Wait for the game to load
    await page.waitForSelector('#discovery-panel');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(1000); // Wait for game initialization
  });

  test('should have Reset button in discovery panel header', async ({ page }) => {
    // Check that reset button is in the discovery panel header, not in bottom-actions
    const resetButtonInPanel = page.locator('#discovery-panel #reset-action');
    await expect(resetButtonInPanel).toBeVisible();
    
    // Check that reset button is NOT in bottom-actions
    const resetButtonInBottomActions = page.locator('#bottom-actions #reset-action');
    await expect(resetButtonInBottomActions).toHaveCount(0);
    
    // Verify reset button is styled as red
    await expect(resetButtonInPanel).toHaveCSS('color', 'rgb(211, 47, 47)');
  });

  test('should have only arrangement actions in bottom-actions', async ({ page }) => {
    const bottomActions = page.locator('#bottom-actions');
    
    // Check that only arrangement actions are present
    await expect(bottomActions.locator('#auto-arrange-action')).toBeVisible();
    await expect(bottomActions.locator('#remove-duplicate-action')).toBeVisible();
    await expect(bottomActions.locator('#clear-action')).toBeVisible();
    
    // Check that reset action is NOT in bottom-actions
    await expect(bottomActions.locator('#reset-action')).toHaveCount(0);
  });

  test('should have resizable discovery panel on desktop', async ({ page }) => {
    // Skip on mobile
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width <= 768) {
      test.skip();
    }

    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check resize handle is present
    await expect(resizeHandle).toBeVisible();
    
    // Check resize handle has correct cursor
    await expect(resizeHandle).toHaveCSS('cursor', 'ew-resize');
    
    // Get initial panel width
    const initialWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    
    // Perform resize action
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x - 50, handleBox.y + handleBox.height / 2); // Drag left to make panel wider
      await page.mouse.up();
    }
    
    // Wait for resize to complete
    await page.waitForTimeout(300);
    
    // Check that panel width changed
    const newWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test('should have resizable discovery panel on mobile', async ({ page, browserName }) => {
    // Skip on webkit (Safari) as it might have touch event issues in testing
    if (browserName === 'webkit') {
      test.skip();
    }

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('#discovery-panel');
    
    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check resize handle is present
    await expect(resizeHandle).toBeVisible();
    
    // Check resize handle has correct cursor for mobile
    await expect(resizeHandle).toHaveCSS('cursor', 'ns-resize');
    
    // Get initial panel height
    const initialHeight = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetHeight);
    
    // Perform resize action with touch
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.touchscreen.tap(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      // Simulate drag up to make panel taller
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y - 50);
      await page.mouse.up();
    }
    
    // Wait for resize to complete
    await page.waitForTimeout(300);
    
    // Check that panel height changed
    const newHeight = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  test('should center auto-arranged elements properly', async ({ page }) => {
    // Add some elements to the canvas first
    const elementCards = page.locator('.element-card');
    
    // Add several elements by clicking on them
    for (let i = 0; i < 6; i++) {
      await elementCards.nth(i % 4).click(); // Click on available elements cyclically
      await page.waitForTimeout(100);
    }
    
    // Wait for elements to be added
    await page.waitForTimeout(500);
    
    // Get canvas and discovery panel dimensions
    const canvas = page.locator('canvas');
    const discoveryPanel = page.locator('#discovery-panel');
    const canvasBox = await canvas.boundingBox();
    const panelBox = await discoveryPanel.boundingBox();
    
    if (!canvasBox || !panelBox) {
      throw new Error('Could not get element dimensions');
    }
    
    // Calculate available canvas area
    const viewportSize = page.viewportSize();
    const isDesktop = viewportSize && viewportSize.width > 768;
    
    let availableWidth = canvasBox.width;
    let availableHeight = canvasBox.height;
    
    if (isDesktop) {
      availableWidth = canvasBox.width - panelBox.width;
    } else {
      availableHeight = canvasBox.height - panelBox.height;
    }
    
    // Click auto-arrange
    await page.locator('#auto-arrange-action').click();
    
    // Wait for animation to complete
    await page.waitForTimeout(1000);
    
    // Get positions of all elements on canvas
    const elementPositions = await page.evaluate(() => {
      const gameElements = document.querySelectorAll('canvas');
      if (gameElements.length === 0) return [];
      
      // Get PIXI elements from the game instance
      const game = (window as any).game;
      if (!game || !game.elements) return [];
      
      return game.elements.map((el: any) => ({
        x: el.x,
        y: el.y
      }));
    });
    
    if (elementPositions.length > 0) {
      // Calculate bounding box of all elements
      const minX = Math.min(...elementPositions.map(pos => pos.x));
      const maxX = Math.max(...elementPositions.map(pos => pos.x));
      const minY = Math.min(...elementPositions.map(pos => pos.y));
      const maxY = Math.max(...elementPositions.map(pos => pos.y));
      
      const gridWidth = maxX - minX;
      const gridHeight = maxY - minY;
      const gridCenterX = (minX + maxX) / 2;
      const gridCenterY = (minY + maxY) / 2;
      
      // Check that the grid is reasonably centered
      // Allow some tolerance for positioning
      const expectedCenterX = availableWidth / 2;
      const expectedCenterY = availableHeight / 2;
      
      // Convert world coordinates to screen coordinates for comparison
      // This is approximate since we don't have exact pan offset
      const tolerance = Math.min(availableWidth, availableHeight) * 0.1; // 10% tolerance
      
      expect(Math.abs(gridCenterX - expectedCenterX)).toBeLessThan(tolerance);
      expect(Math.abs(gridCenterY - expectedCenterY)).toBeLessThan(tolerance);
    }
  });

  test('should have working language selector in header controls', async ({ page }) => {
    const languageSelector = page.locator('#discovery-panel .language-selector');
    const languageButton = page.locator('#language-button');
    
    // Check language selector is in the header controls
    await expect(languageSelector).toBeVisible();
    await expect(languageButton).toBeVisible();
    
    // Click language button to open dropdown
    await languageButton.click();
    
    // Check dropdown appears
    const dropdown = page.locator('#language-dropdown');
    await expect(dropdown).toHaveClass(/show/);
    
    // Check language options are present
    const languageOptions = page.locator('.language-option');
    await expect(languageOptions).toHaveCount(2); // English and Spanish
  });

  test('should confirm reset functionality from header', async ({ page }) => {
    // Add an element first
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await page.waitForTimeout(500);
    
    // Click reset button in header
    const resetButton = page.locator('#discovery-panel #reset-action');
    await resetButton.click();
    
    // Check confirmation dialog appears
    const confirmDialog = page.locator('[role="dialog"], .modal, .confirmation').first();
    await expect(confirmDialog).toBeVisible();
    
    // Cancel the reset
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Cancelar")').first();
    await cancelButton.click();
    
    // Dialog should close
    await expect(confirmDialog).not.toBeVisible();
  });

  test('should show toast messages for actions', async ({ page }) => {
    // Add some elements first
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await elementCard.click(); // Add duplicate
    await page.waitForTimeout(500);
    
    // Test auto arrange
    await page.locator('#auto-arrange-action').click();
    
    // Look for toast message
    const toast = page.locator('.toast, [class*="toast"], [class*="message"]');
    await expect(toast.first()).toBeVisible();
    
    await page.waitForTimeout(2000); // Wait for toast to disappear
    
    // Test remove duplicates
    await page.locator('#remove-duplicate-action').click();
    await expect(toast.first()).toBeVisible();
  });

  test('should maintain panel resize after page interactions', async ({ page }) => {
    // Skip on mobile
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width <= 768) {
      test.skip();
    }

    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Resize panel
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x - 50, handleBox.y + handleBox.height / 2);
      await page.mouse.up();
    }
    
    const resizedWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    
    // Perform other actions
    await page.locator('.element-card').first().click();
    await page.locator('#auto-arrange-action').click();
    await page.waitForTimeout(500);
    
    // Check panel width is maintained
    const currentWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    expect(currentWidth).toBe(resizedWidth);
  });
}); 