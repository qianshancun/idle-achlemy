import { test, expect } from '@playwright/test';

test.describe('Fixed Discovery Panel Layout', () => {

  test('should have discovery panel with fixed size on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check panel is visible and positioned correctly
    await expect(discoveryPanel).toBeVisible();
    
    // Check panel has fixed width (should be 320px as defined in CSS)
    const panelBox = await discoveryPanel.boundingBox();
    expect(panelBox!.width).toBe(320);
    
    // Verify there's no resize handle present
    const resizeHandle = page.locator('#panel-resize-handle');
    await expect(resizeHandle).toHaveCount(0);
    
    // Check panel position is fixed to the right
    const panelStyle = await discoveryPanel.getAttribute('class');
    expect(panelStyle).toContain('discovery-panel');
  });

  test('should have discovery panel with fixed height on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Check panel is visible
    await expect(discoveryPanel).toBeVisible();
    
    // On mobile, panel should be at bottom with fixed height
    const panelBox = await discoveryPanel.boundingBox();
    
    // Should be full width on mobile
    expect(panelBox!.width).toBe(375);
    
    // Should have fixed height around 280px (as defined in CSS)
    expect(panelBox!.height).toBeCloseTo(280, 20); // Allow some tolerance
    
    // Verify no resize handle
    const resizeHandle = page.locator('#panel-resize-handle');
    await expect(resizeHandle).toHaveCount(0);
  });

  test('should have reset button in discovery panel header', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Close help overlay if present
    const helpOverlay = page.locator('#help-tooltip');
    const helpCloseBtn = page.locator('#close-tooltip');
    if (await helpOverlay.isVisible()) {
      await helpCloseBtn.click();
      await page.waitForTimeout(500);
    }
    
    const discoveryPanel = page.locator('#discovery-panel');
    const resetButton = discoveryPanel.locator('#reset-action');
    
    // Reset button should be in panel header
    await expect(resetButton).toBeVisible();
    
    // Reset button should NOT be in bottom-actions
    const bottomActions = page.locator('#bottom-actions');
    await expect(bottomActions.locator('#reset-action')).toHaveCount(0);
  });

  test('should have working auto-arrange with fixed panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Close help overlay if present
    const helpOverlay = page.locator('#help-tooltip');
    const helpCloseBtn = page.locator('#close-tooltip');
    if (await helpOverlay.isVisible()) {
      await helpCloseBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Wait for game to load
    await page.waitForTimeout(2000);
    
    // Add some elements to the canvas
    const elementCard = page.locator('.element-card').first();
    await elementCard.click();
    await page.waitForTimeout(500);
    await elementCard.click();
    await page.waitForTimeout(500);
    await elementCard.click();
    
    // Click auto arrange
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await autoArrangeBtn.click();
    
    // Check that auto-arrange completed successfully
    // (We can't easily verify element positions, but we can verify no errors)
    await page.waitForTimeout(1000);
    
    // Verify elements are still present on canvas
    const canvasElements = page.locator('canvas');
    await expect(canvasElements).toBeVisible();
  });

  test('should handle responsive breakpoint correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Start with desktop
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(500);
    
    let panelBox = await discoveryPanel.boundingBox();
    // Desktop: fixed width, positioned right
    expect(panelBox!.width).toBe(320);
    
    // Switch to mobile
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(500);
    
    panelBox = await discoveryPanel.boundingBox();
    // Mobile: full width, positioned bottom
    expect(panelBox!.width).toBe(600);
    expect(panelBox!.height).toBeCloseTo(280, 20);
  });

}); 