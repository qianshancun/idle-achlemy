import { test, expect } from '@playwright/test';

test.describe('Basic UI Structure', () => {
  test('should have Reset button in discovery panel header', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
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
    await page.goto('http://localhost:3001');
    await page.waitForSelector('#bottom-actions', { timeout: 10000 });
    
    const bottomActions = page.locator('#bottom-actions');
    
    // Check that only arrangement actions are present
    await expect(bottomActions.locator('#auto-arrange-action')).toBeVisible();
    await expect(bottomActions.locator('#remove-duplicate-action')).toBeVisible();
    await expect(bottomActions.locator('#clear-action')).toBeVisible();
    
    // Check that reset action is NOT in bottom-actions
    await expect(bottomActions.locator('#reset-action')).toHaveCount(0);
  });

  test('should have resizable discovery panel', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    const resizeHandle = page.locator('#panel-resize-handle');
    
    // Check resize handle is present
    await expect(resizeHandle).toBeVisible();
    
    // Check resize handle has correct cursor on desktop
    if (page.viewportSize()!.width > 768) {
      await expect(resizeHandle).toHaveCSS('cursor', 'ew-resize');
    } else {
      await expect(resizeHandle).toHaveCSS('cursor', 'ns-resize');
    }
  });

  test('should have working language selector in header', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    const languageSelector = page.locator('#discovery-panel .language-selector');
    const languageButton = page.locator('#language-button');
    
    // Check language selector is in the header controls
    await expect(languageSelector).toBeVisible();
    await expect(languageButton).toBeVisible();
  });
}); 