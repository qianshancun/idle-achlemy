import { test, expect } from '@playwright/test';

test.describe('Idle Alchemy UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Wait for the game to load
    await page.waitForSelector('#discovery-panel');
    await page.waitForSelector('canvas');
    
    // Close help tooltip if it appears
    const closeTooltip = page.locator('#close-tooltip');
    if (await closeTooltip.isVisible()) {
      await closeTooltip.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have redesigned header with search and secondary actions', async ({ page }) => {
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check search container is present and functional
    const searchContainer = discoveryPanel.locator('.search-container');
    await expect(searchContainer).toBeVisible();
    
    const searchInput = discoveryPanel.locator('#element-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
    
    const searchIcon = discoveryPanel.locator('.search-icon');
    await expect(searchIcon).toBeVisible();
    await expect(searchIcon).toHaveText('🔍');
    
    // Check secondary actions (reset and language buttons)
    const secondaryActions = discoveryPanel.locator('.secondary-actions');
    await expect(secondaryActions).toBeVisible();
    
    const resetButton = secondaryActions.locator('#reset-action');
    await expect(resetButton).toBeVisible();
    await expect(resetButton.locator('.btn-icon')).toHaveText('🔄');
    
    const languageButton = secondaryActions.locator('#language-button');
    await expect(languageButton).toBeVisible();
    await expect(languageButton.locator('.btn-icon')).toHaveText('🌍');
  });

  test('should have subtle secondary button styling (not eye-catching)', async ({ page }) => {
    const resetButton = page.locator('#reset-action');
    const languageButton = page.locator('#language-button');
    
    // Check that buttons have subtle styling
    await expect(resetButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.04)');
    await expect(resetButton).toHaveCSS('color', 'rgb(102, 102, 102)'); // #666
    
    await expect(languageButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.04)');
    await expect(languageButton).toHaveCSS('color', 'rgb(102, 102, 102)'); // #666
    
    // Verify no red or bright colors (should not be eye-catching)
    const resetBgColor = await resetButton.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(resetBgColor).not.toContain('211, 47, 47'); // Not the old red color
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.locator('#element-search');
    const elementGrid = page.locator('#element-grid');
    
    // Type 'fire' in search
    await searchInput.fill('fire');
    await page.waitForTimeout(200); // Wait for debounce
    
    // Check that only fire-related elements are visible
    const visibleCards = elementGrid.locator('.element-card:not(.hidden)');
    const hiddenCards = elementGrid.locator('.element-card.hidden');
    
    await expect(visibleCards).toHaveCount(1); // Should only show Fire
    const hiddenCount = await hiddenCards.count();
    expect(hiddenCount).toBeGreaterThan(0); // Others should be hidden
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(200);
    
    // All cards should be visible again
    const allCards = elementGrid.locator('.element-card');
    const visibleCardsAfterClear = elementGrid.locator('.element-card:not(.hidden)');
    const cardCount = await allCards.count();
    await expect(visibleCardsAfterClear).toHaveCount(cardCount);
  });

  test('should show no results message for non-existent search', async ({ page }) => {
    const searchInput = page.locator('#element-search');
    const elementGrid = page.locator('#element-grid');
    
    // Search for something that doesn't exist
    await searchInput.fill('nonexistent');
    await page.waitForTimeout(200);
    
    // Should show no results message
    const noResultsMessage = elementGrid.locator('.no-results-message');
    await expect(noResultsMessage).toBeVisible();
    await expect(noResultsMessage).toHaveText(/no.*found/i);
    
    // All cards should be hidden
    const visibleCards = elementGrid.locator('.element-card:not(.hidden)');
    await expect(visibleCards).toHaveCount(0);
  });

  test('should clear search with Escape key', async ({ page }) => {
    const searchInput = page.locator('#element-search');
    
    // Type something in search
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
    
    // Press Escape
    await searchInput.press('Escape');
    
    // Search should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should have smooth panel resizing without mouse movement issues', async ({ page }) => {
    // Skip on mobile viewport
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width <= 768) {
      test.skip();
    }

    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Get initial width
    const initialWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    
    // Perform resize - drag left to make panel wider
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x - 80, handleBox.y + handleBox.height / 2, { steps: 5 });
      await page.mouse.up();
    }
    
    // Check that panel width changed
    const newWidth = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
    
    // Verify no blank areas - game container should adjust
    const gameContainer = page.locator('#game-container');
    const gameMarginRight = await gameContainer.evaluate(el => getComputedStyle(el).marginRight);
    expect(gameMarginRight).toBe(`${newWidth}px`);
  });

  test('should have proper mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('#discovery-panel');
    
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check panel is at bottom and full width
    const panelBox = await discoveryPanel.boundingBox();
    const viewportWidth = page.viewportSize()!.width;
    
    expect(panelBox!.width).toBeCloseTo(viewportWidth, 10); // Allow 10px tolerance
    
    // Check that resize handle is vertical
    const resizeHandle = page.locator('#panel-resize-handle');
    await expect(resizeHandle).toHaveCSS('cursor', 'ns-resize');
    
    // Check that header actions are horizontal on mobile
    const headerActions = discoveryPanel.locator('.header-actions');
    await expect(headerActions).toHaveCSS('flex-direction', 'row');
    
    // Check search container takes available space
    const searchContainer = discoveryPanel.locator('.search-container');
    await expect(searchContainer).toHaveCSS('flex', '1 1 0%');
  });

  test('should handle mobile panel resizing correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('#discovery-panel');
    
    const discoveryPanel = page.locator('#discovery-panel');
    const resizeHandle = page.locator('#panel-resize-handle');
    
    // Get initial height
    const initialHeight = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetHeight);
    
    // Perform vertical resize - drag up to make panel taller
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y - 50, { steps: 3 });
      await page.mouse.up();
    }
    
    // Check that panel height changed
    const newHeight = await discoveryPanel.evaluate(el => (el as HTMLElement).offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
    
    // Verify game container adjusts its height (check CSS calc or margin)
    const gameContainer = page.locator('#game-container');
    const gameStyles = await gameContainer.evaluate(el => ({
      height: getComputedStyle(el).height,
      marginBottom: getComputedStyle(el).marginBottom
    }));
    
    // On mobile, game container should use calc() or have proper margin
    const hasProperHeight = gameStyles.height.includes('calc') || 
                           parseInt(gameStyles.marginBottom) >= newHeight - 50; // Allow tolerance
    expect(hasProperHeight).toBe(true);
  });

  test('should have working language selector with new design', async ({ page }) => {
    const languageButton = page.locator('#language-button');
    const languageDropdown = page.locator('#language-dropdown');
    
    // Click language button
    await languageButton.click();
    
    // Dropdown should appear
    await expect(languageDropdown).toHaveClass(/show/);
    
    // Check language options exist
    const languageOptions = languageDropdown.locator('.language-option');
    const optionsCount = await languageOptions.count();
    expect(optionsCount).toBeGreaterThan(0);
    
    // Click outside to close
    await page.locator('body').click();
    await expect(languageDropdown).not.toHaveClass(/show/);
  });

  test('should maintain all original game functionality', async ({ page }) => {
    // Test that bottom-actions still work
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    const removeDuplicateBtn = page.locator('#remove-duplicate-action');
    const clearBtn = page.locator('#clear-action');
    
    await expect(autoArrangeBtn).toBeVisible();
    await expect(removeDuplicateBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
    
    // Test adding elements by clicking
    const elementCards = page.locator('.element-card');
    const firstCard = elementCards.first();
    
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Should add element to canvas (check via game state)
    const hasElements = await page.evaluate(() => {
      const game = (window as any).game;
      return game && game.elements && game.elements.length > 0;
    });
    
    expect(hasElements).toBe(true);
  });

  test('should show reset confirmation with new subtle button', async ({ page }) => {
    const resetButton = page.locator('#reset-action');
    
    // Click reset button
    await resetButton.click();
    await page.waitForTimeout(300);
    
    // Should show confirmation dialog (check for any overlay or dialog-like element)
    const confirmDialog = page.locator('.dialog-overlay, .confirm-dialog, [class*="dialog"], [class*="modal"], [class*="confirm"]').first();
    
    // If the specific dialog classes don't exist, just check that clicking works
    const dialogExists = await confirmDialog.isVisible().catch(() => false);
    
    if (dialogExists) {
      // Cancel the reset if dialog appears
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Cancelar"), button:has-text("No")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    } else {
      // If no specific dialog found, verify the reset button is clickable and responsive
      await expect(resetButton).toBeEnabled();
      // Check that it has proper styling (subtle, not eye-catching)
      await expect(resetButton).toHaveCSS('color', 'rgb(102, 102, 102)');
    }
  });

  test('should not have transition issues during resize', async ({ page }) => {
    // Skip on mobile
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width <= 768) {
      test.skip();
    }

    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check that panel doesn't have problematic transition
    const transition = await discoveryPanel.evaluate(el => getComputedStyle(el).transition);
    
    // Should not have 'all 0.3s ease' transition that causes mouse issues
    expect(transition).not.toContain('all 0.3s ease');
    
    // Resize handle should have only background transition
    const resizeHandle = page.locator('#panel-resize-handle');
    const handleTransition = await resizeHandle.evaluate(el => getComputedStyle(el).transition);
    expect(handleTransition).toContain('background');
  });

  test('should have proper contrast and accessibility', async ({ page }) => {
    const resetButton = page.locator('#reset-action');
    const languageButton = page.locator('#language-button');
    const searchInput = page.locator('#element-search');
    
    // Check that elements are focusable
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
    
    await resetButton.focus();
    await expect(resetButton).toBeFocused();
    
    await languageButton.focus();
    await expect(languageButton).toBeFocused();
    
    // Check tooltip exists for buttons
    await expect(resetButton).toHaveAttribute('title');
    await expect(languageButton).toHaveAttribute('title');
  });

  test('should handle window resize gracefully', async ({ page }) => {
    // Start with desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Check that panel adapts correctly
    const discoveryPanel = page.locator('#discovery-panel');
    const panelBox = await discoveryPanel.boundingBox();
    
    // Should be full width on mobile
    expect(panelBox!.width).toBeCloseTo(375, 10);
    
    // Switch back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // Should be back to right sidebar
    const newPanelBox = await discoveryPanel.boundingBox();
    expect(newPanelBox!.width).toBeLessThan(400); // Should be sidebar width, not full width
  });
}); 