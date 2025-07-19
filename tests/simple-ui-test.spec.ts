import { test, expect } from '@playwright/test';

test.describe('Basic UI Structure', () => {
  test('should have Reset button in discovery panel header', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Check that reset button is in the discovery panel header
    const resetButtonInPanel = page.locator('#discovery-panel #reset-action');
    await expect(resetButtonInPanel).toBeVisible();
    
    // Check that reset button is NOT in bottom-actions
    const resetButtonInBottomActions = page.locator('#bottom-actions #reset-action');
    await expect(resetButtonInBottomActions).toHaveCount(0);
  });

  test('should have only arrangement actions in bottom-actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#bottom-actions', { timeout: 10000 });
    
    const bottomActions = page.locator('#bottom-actions');
    
    // Check that only arrangement actions are present
    await expect(bottomActions.locator('#auto-arrange-action')).toBeVisible();
    await expect(bottomActions.locator('#remove-duplicate-action')).toBeVisible();
    await expect(bottomActions.locator('#clear-action')).toBeVisible();
    
    // Check that reset action is NOT in bottom-actions
    await expect(bottomActions.locator('#reset-action')).toHaveCount(0);
  });

  test('should have fixed discovery panel (no resize handle)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    const discoveryPanel = page.locator('#discovery-panel');
    await expect(discoveryPanel).toBeVisible();
    
    // Verify there's no resize handle
    const resizeHandle = page.locator('#panel-resize-handle');
    await expect(resizeHandle).toHaveCount(0);
    
    // Panel should have fixed width on desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    const panelBox = await discoveryPanel.boundingBox();
    expect(panelBox!.width).toBe(320);
  });

});