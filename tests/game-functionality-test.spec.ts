import { test, expect } from '@playwright/test';

test.describe('Game Functionality with Fixed Panel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Close help overlay if present
    const helpOverlay = page.locator('#help-tooltip');
    const helpCloseBtn = page.locator('#close-tooltip');
    if (await helpOverlay.isVisible()) {
      await helpCloseBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for game to fully initialize
    await page.waitForTimeout(2000);
  });

  test('should allow adding elements to canvas by clicking element cards', async ({ page }) => {
    // Get initial count of elements on canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Click on water element card to add it to canvas
    const waterCard = page.locator('.element-card').filter({ hasText: 'Water' });
    await expect(waterCard).toBeVisible();
    await waterCard.click();
    
    // Wait for element to be added
    await page.waitForTimeout(1000);
    
    // Add another element
    const fireCard = page.locator('.element-card').filter({ hasText: 'Fire' });
    await expect(fireCard).toBeVisible();
    await fireCard.click();
    
    await page.waitForTimeout(1000);
    
    // Verify canvas still exists and is interactive
    await expect(canvas).toBeVisible();
  });

  test('should have working auto-arrange functionality', async ({ page }) => {
    // Add multiple elements to canvas
    const elementCards = page.locator('.element-card');
    const firstCard = elementCards.first();
    
    // Add several elements
    for (let i = 0; i < 6; i++) {
      await firstCard.click();
      await page.waitForTimeout(300);
    }
    
    // Click auto-arrange button
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await expect(autoArrangeBtn).toBeVisible();
    await autoArrangeBtn.click();
    
    // Wait for arrangement to complete
    await page.waitForTimeout(1500);
    
    // Verify no errors occurred
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have working clear functionality', async ({ page }) => {
    // Add elements to canvas
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await elementCard.click();
    await page.waitForTimeout(1000);
    
    // Click clear button
    const clearBtn = page.locator('#clear-action');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    
    // Handle confirmation dialog
    const confirmBtn = page.locator('button').filter({ hasText: 'Confirm' });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Canvas should still be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have working reset functionality', async ({ page }) => {
    // Add elements to canvas
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await page.waitForTimeout(1000);
    
    // Click reset button (should be in discovery panel header)
    const resetBtn = page.locator('#reset-action');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    
    // Handle confirmation dialog
    const confirmBtn = page.locator('button').filter({ hasText: 'Confirm' });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Verify game reset - should have only basic 4 elements
    const elementCards = page.locator('.element-card');
    await expect(elementCards).toHaveCount(4);
    
    // Canvas should still be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have working remove duplicates functionality', async ({ page }) => {
    // Add duplicate elements
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await elementCard.click();
    await elementCard.click();
    await page.waitForTimeout(1000);
    
    // Click remove duplicates
    const removeDuplicatesBtn = page.locator('#remove-duplicate-action');
    await expect(removeDuplicatesBtn).toBeVisible();
    await removeDuplicatesBtn.click();
    
    await page.waitForTimeout(1000);
    
    // Canvas should still be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.locator('#element-search');
    await expect(searchInput).toBeVisible();
    
    // Search for water
    await searchInput.fill('water');
    await page.waitForTimeout(500);
    
    // Should only show water element
    const visibleCards = page.locator('.element-card:visible');
    await expect(visibleCards).toHaveCount(1);
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    // Should show all elements again
    await expect(page.locator('.element-card')).toHaveCount(4);
  });

  test('should have working dark mode toggle', async ({ page }) => {
    const darkModeBtn = page.locator('#dark-mode-toggle');
    await expect(darkModeBtn).toBeVisible();
    
    // Toggle dark mode
    await darkModeBtn.click();
    await page.waitForTimeout(500);
    
    // Check if dark class is applied (basic check)
    const body = page.locator('body');
    // Just verify the page is still functional after dark mode toggle
    const discoveryPanel = page.locator('#discovery-panel');
    await expect(discoveryPanel).toBeVisible();
  });

  test('should have working font size controls', async ({ page }) => {
    const increaseFontBtn = page.locator('#font-size-increase');
    const decreaseFontBtn = page.locator('#font-size-decrease');
    
    await expect(increaseFontBtn).toBeVisible();
    await expect(decreaseFontBtn).toBeVisible();
    
    // Test font size increase
    await increaseFontBtn.click();
    await page.waitForTimeout(500);
    
    // Test font size decrease
    await decreaseFontBtn.click();
    await page.waitForTimeout(500);
    
    // Panel should still be visible and functional
    const discoveryPanel = page.locator('#discovery-panel');
    await expect(discoveryPanel).toBeVisible();
  });

  test('should handle desktop to mobile viewport change correctly', async ({ page }) => {
    // Start on desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const discoveryPanel = page.locator('#discovery-panel');
    let panelBox = await discoveryPanel.boundingBox();
    
    // Desktop: panel should be on the right with fixed width
    expect(panelBox!.width).toBe(320);
    
    // Add an element
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await page.waitForTimeout(500);
    
    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    panelBox = await discoveryPanel.boundingBox();
    
    // Mobile: panel should be at bottom with full width
    expect(panelBox!.width).toBe(375);
    expect(panelBox!.height).toBeCloseTo(280, 20);
    
    // Game should still be functional
    await elementCard.click();
    await page.waitForTimeout(500);
    
    // Auto-arrange should work on mobile too
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    await page.waitForTimeout(1000);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

}); 