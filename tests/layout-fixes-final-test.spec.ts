import { test, expect } from '@playwright/test';

test.describe('Layout Fixes - Final Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Force-close the initial help dialog for consistent test runs
    await page.evaluate(() => {
      const help = document.getElementById('help-tooltip');
      if (help) help.style.display = 'none';
    });
  });

  test('Desktop layout (2000x940) should be correct', async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 940 });
    await page.waitForTimeout(500);

    const discoveryPanel = page.locator('#discovery-panel');
    const gameContainer = page.locator('#game-container');
    
    await expect(discoveryPanel).toBeVisible();
    await expect(gameContainer).toBeVisible();

    const discoveryBox = await discoveryPanel.boundingBox();
    const gameBox = await gameContainer.boundingBox();

    expect(discoveryBox).toBeDefined();
    expect(gameBox).toBeDefined();
    
    // Panel should be on the right
    expect(discoveryBox!.x).toBeGreaterThan(gameBox!.x + gameBox!.width - 5);
    // Game container should be on the left
    expect(gameBox!.width).toBeGreaterThan(1000);
    // They should not overlap
    expect(gameBox!.x + gameBox!.width).toBeLessThanOrEqual(discoveryBox!.x + 5);

    await page.screenshot({ path: 'test-results/final-desktop-layout.png' });
  });

  test('Mobile layout (447x600) should be correct', async ({ page }) => {
    await page.setViewportSize({ width: 447, height: 600 });
    await page.waitForTimeout(1000);

    const discoveryPanel = page.locator('#discovery-panel');
    const gameContainer = page.locator('#game-container');
    
    await expect(discoveryPanel).toBeVisible();
    await expect(gameContainer).toBeVisible();

    const gameBox = await gameContainer.boundingBox();
    expect(gameBox).toBeDefined();

    // The game container should fill the space above the panel.
    // Viewport height (600) - default panel height (280) = 320.
    expect(gameBox!.height).toBeCloseTo(320, 1);

    await page.screenshot({ path: 'test-results/final-mobile-layout.png' });
  });

  test('Resize should work correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');

    const initialWidth = (await discoveryPanel.boundingBox())!.width;
    
    const handleBox = await resizeHandle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x - 100, handleBox!.y, { steps: 5 });
    await page.mouse.up();

    const finalWidth = (await discoveryPanel.boundingBox())!.width;
    expect(finalWidth).toBeGreaterThan(initialWidth);
  });

   test('Resize should work correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 447, height: 600 });
    const resizeHandle = page.locator('#panel-resize-handle');
    const discoveryPanel = page.locator('#discovery-panel');

    const initialHeight = (await discoveryPanel.boundingBox())!.height;
    
    const handleBox = await resizeHandle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x, handleBox!.y - 50, { steps: 5 });
    await page.mouse.up();

    const finalHeight = (await discoveryPanel.boundingBox())!.height;
    expect(finalHeight).toBeGreaterThan(initialHeight);
  });
}); 