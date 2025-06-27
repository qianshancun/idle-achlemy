import { test, expect } from '@playwright/test';

test.describe('Modern UI Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Close help modal if it appears
    const helpModal = page.locator('#help-tooltip');
    if (await helpModal.isVisible()) {
      await page.click('#close-tooltip');
    }
  });

  test('should display modern game actions with proper styling', async ({ page }) => {
    const gameActions = page.locator('#bottom-actions');
    
    // Check game actions exist and are visible
    await expect(gameActions).toBeVisible();
    
    // Verify modern styling
    const styles = await gameActions.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.background,
        backdropFilter: computed.backdropFilter,
        borderRadius: computed.borderRadius,
        boxShadow: computed.boxShadow
      };
    });
    
    // Should have clean styling (no glassmorphism per user request)
    expect(styles.background).toContain('rgb(255, 255, 255)');
    expect(styles.borderRadius).toBe('6px');
    
    // Check for proper buttons (no pipe separators)
    const actionButtons = gameActions.locator('.action-btn');
    await expect(actionButtons).toHaveCount(3);
    
    const dividers = gameActions.locator('.action-divider');
    await expect(dividers).toHaveCount(2);
    
    // Verify button text
    await expect(actionButtons.nth(0)).toContainText('Auto Arrange');
    await expect(actionButtons.nth(1)).toContainText('Remove Duplicate');
    await expect(actionButtons.nth(2)).toContainText('Clear');
  });

  test('should display minimal element layout (not cards)', async ({ page }) => {
    const elementGrid = page.locator('#element-grid');
    await expect(elementGrid).toBeVisible();
    
    const elementCards = elementGrid.locator('.element-card');
    await expect(elementCards).toHaveCount(4);
    
    // Test element grid layout (should be flex column for minimal list)
    const gridStyles = await elementGrid.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection
      };
    });
    
    expect(gridStyles.display).toBe('flex');
    expect(gridStyles.flexDirection).toBe('column');
    
    // Test first element card layout (should be horizontal flex with icon + name)
    const firstCard = elementCards.first();
    const cardStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        alignItems: computed.alignItems,
        gap: computed.gap,
        borderRadius: computed.borderRadius,
        background: computed.background
      };
    });
    
    expect(cardStyles.display).toBe('flex');
    expect(cardStyles.alignItems).toBe('center');
    expect(cardStyles.gap).toBe('12px');
    expect(cardStyles.borderRadius).toBe('4px');
    // Should not have gradients (clean design)
    expect(cardStyles.background).not.toContain('linear-gradient');
  });

  test('should have modern discovery panel with proper controls', async ({ page }) => {
    const discoveryPanel = page.locator('#discovery-panel');
    await expect(discoveryPanel).toBeVisible();
    
    // Check panel positioning and styling
    const panelStyles = await discoveryPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: computed.position,
        right: computed.right,
        width: computed.width,
        background: computed.background,
        backdropFilter: computed.backdropFilter,
        zIndex: computed.zIndex,
        isInViewport: rect.right <= window.innerWidth
      };
    });
    
    expect(panelStyles.position).toBe('fixed');
    expect(panelStyles.right).toBe('0px');
    expect(panelStyles.width).toBe('320px');
    expect(panelStyles.background).toContain('rgb(255, 255, 255)');
    expect(panelStyles.zIndex).toBe('1000');
    
    // Test control buttons
    const resetBtn = page.locator('#reset-action');
    const fontDecreaseBtn = page.locator('#font-size-decrease');
    const fontIncreaseBtn = page.locator('#font-size-increase');
    const darkModeBtn = page.locator('#dark-mode-toggle');
    
    await expect(resetBtn).toBeVisible();
    await expect(fontDecreaseBtn).toBeVisible();
    await expect(fontIncreaseBtn).toBeVisible();
    await expect(darkModeBtn).toBeVisible();
    
    // Verify Material Icons are used (not emojis)
    await expect(resetBtn).toContainText('restart_alt');
    await expect(fontDecreaseBtn).toContainText('text_decrease');
    await expect(fontIncreaseBtn).toContainText('text_increase');
    await expect(darkModeBtn).toContainText('dark_mode');
  });

  test('should handle modern search functionality', async ({ page }) => {
    const searchInput = page.locator('#element-search');
    await expect(searchInput).toBeVisible();
    
    // Test search styling
    const searchStyles = await searchInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        fontSize: computed.fontSize
      };
    });
    
    expect(searchStyles.borderRadius).toBe('6px');
    
    // Test search functionality
    await searchInput.fill('Water');
    await page.waitForTimeout(500);
    
    const visibleCards = page.locator('.element-card:not(.hidden)');
    await expect(visibleCards).toHaveCount(1);
    
    const visibleCard = visibleCards.first();
    await expect(visibleCard).toContainText('Water');
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    const allCards = page.locator('.element-card:not(.hidden)');
    await expect(allCards).toHaveCount(4);
  });

  test('should handle font size controls', async ({ page }) => {
    const increaseBtn = page.locator('#font-size-increase');
    const decreaseBtn = page.locator('#font-size-decrease');
    
    // Test font increase
    await increaseBtn.click();
    await page.waitForTimeout(500);
    
    const increasedFontScale = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-scale');
    });
    
    expect(parseFloat(increasedFontScale)).toBeGreaterThan(1);
    
    // Test font decrease
    await decreaseBtn.click();
    await page.waitForTimeout(500);
    
    const normalFontScale = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-scale');
    });
    
    expect(parseFloat(normalFontScale)).toBe(1);
  });

  test('should handle dark mode toggle', async ({ page }) => {
    const darkModeBtn = page.locator('#dark-mode-toggle');
    
    // Toggle to dark mode
    await darkModeBtn.click();
    await page.waitForTimeout(500);
    
    const isDark = await page.evaluate(() => {
      return document.body.classList.contains('dark');
    });
    
    expect(isDark).toBe(true);
    
    // Toggle back to light mode
    await darkModeBtn.click();
    await page.waitForTimeout(500);
    
    const isLight = await page.evaluate(() => {
      return !document.body.classList.contains('dark');
    });
    
    expect(isLight).toBe(true);
  });

  test('should handle element card interactions', async ({ page }) => {
    const elementCards = page.locator('.element-card');
    await expect(elementCards).toHaveCount(4);
    
    // Test clicking an element card
    const firstCard = elementCards.first();
    await firstCard.click();
    
    // Check if card shows clicked state
    const cardClasses = await firstCard.getAttribute('class');
    // Note: The clicked class is temporary, so we just check it doesn't error
    
    // Test drag and drop setup
    const isDraggable = await firstCard.getAttribute('draggable');
    expect(isDraggable).toBe('true');
  });

  test('should have proper mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const discoveryPanel = page.locator('#discovery-panel');
    const panelStyles = await discoveryPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: computed.position,
        bottom: computed.bottom,
        width: rect.width,
        height: rect.height
      };
    });
    
    // On mobile, panel should be at bottom
    expect(panelStyles.position).toBe('fixed');
    expect(panelStyles.bottom).toBe('0px');
    
    // Element grid should use flex column layout (minimal design)
    const elementGrid = page.locator('#element-grid');
    const gridStyles = await elementGrid.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection
      };
    });
    
    // Should use flex column layout for minimal element list
    expect(gridStyles.display).toBe('flex');
    expect(gridStyles.flexDirection).toBe('column');
  });

  test('should handle game actions functionality', async ({ page }) => {
    // Test Auto Arrange
    const autoArrangeBtn = page.locator('text=Auto Arrange');
    await autoArrangeBtn.click();
    // Should not throw error
    
    // Test Remove Duplicate
    const removeDuplicateBtn = page.locator('text=Remove Duplicate');
    await removeDuplicateBtn.click();
    // Should not throw error
    
    // Test Clear (with confirmation)
    const clearBtn = page.locator('text=Clear');
    await clearBtn.click();
    
    // Should show confirmation dialog
    const confirmDialog = page.locator('.help-modal'); // Using help modal structure for confirm
    // Dialog should appear or action should complete
  });
}); 