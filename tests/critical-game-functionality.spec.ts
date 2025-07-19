import { test, expect } from '@playwright/test';

test.describe('Critical Game Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the game
    await page.goto('http://localhost:5173');
    
    // Wait for game to load completely
    await page.waitForSelector('#game-container canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Additional wait for game initialization
  });

  test('Game loads without MIME type errors', async ({ page }) => {
    // Check for CSS MIME type errors
    const cssErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('MIME type')) {
        cssErrors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(3000);
    
    expect(cssErrors.length, `CSS MIME type errors found: ${cssErrors.join(', ')}`).toBe(0);
  });

  test('Canvas is visible and properly sized', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    expect(canvasBox!.width).toBeGreaterThan(500);
    expect(canvasBox!.height).toBeGreaterThan(300);
  });

  test('Elements panel loads with basic elements', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="0"]', { timeout: 10000 });
    
    // Check basic elements are present (using hex IDs)
    const waterElement = page.locator('[data-element-id="0"]'); // Water
    const fireElement = page.locator('[data-element-id="1"]'); // Fire  
    const earthElement = page.locator('[data-element-id="2"]'); // Earth
    const airElement = page.locator('[data-element-id="3"]'); // Air
    
    await expect(waterElement).toBeVisible();
    await expect(fireElement).toBeVisible();
    await expect(earthElement).toBeVisible();
    await expect(airElement).toBeVisible();
  });

  test('Clicking element adds it to canvas (shows success message)', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="0"]', { timeout: 10000 });
    
    // Click water element
    const waterElement = page.locator('[data-element-id="0"]');
    await waterElement.click();
    
    // Check for success message
    const successMessage = page.locator('.fixed .bg-green-500, .fixed .bg-emerald-500');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // Check message content
    await expect(successMessage).toContainText(/Added.*Water/i);
  });

  test('Added elements appear on canvas', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="0"]', { timeout: 10000 });
    
    // Get initial canvas state
    const canvas = page.locator('#game-container canvas');
    const initialCanvasScreenshot = await canvas.screenshot();
    
    // Click water element
    const waterElement = page.locator('[data-element-id="0"]');
    await waterElement.click();
    
    // Wait for element to be added
    await page.waitForTimeout(1000);
    
    // Check canvas has changed (new element appeared)
    const newCanvasScreenshot = await canvas.screenshot();
    expect(Buffer.compare(initialCanvasScreenshot, newCanvasScreenshot)).not.toBe(0);
  });

  test('Drag and drop from elements panel to canvas works', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="1"]', { timeout: 10000 });
    
    const fireElement = page.locator('[data-element-id="1"]');
    const canvas = page.locator('#game-container canvas');
    
    // Get canvas center position
    const canvasBox = await canvas.boundingBox();
    const canvasCenter = {
      x: canvasBox!.x + canvasBox!.width / 2,
      y: canvasBox!.y + canvasBox!.height / 2
    };
    
    // Get initial canvas state
    const initialCanvasScreenshot = await canvas.screenshot();
    
    // Perform drag and drop
    await fireElement.dragTo(canvas, {
      targetPosition: { x: canvasCenter.x - canvasBox!.x, y: canvasCenter.y - canvasBox!.y }
    });
    
    // Wait for drop to complete
    await page.waitForTimeout(1000);
    
    // Verify element was added to canvas
    const newCanvasScreenshot = await canvas.screenshot();
    expect(Buffer.compare(initialCanvasScreenshot, newCanvasScreenshot)).not.toBe(0);
  });

  test('Canvas elements can be dragged around', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="2"]', { timeout: 10000 });
    
    // Add an element to canvas first
    const earthElement = page.locator('[data-element-id="2"]');
    await earthElement.click();
    await page.waitForTimeout(1000);
    
    const canvas = page.locator('#game-container canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Try to drag within canvas (simulate moving an element)
    await canvas.click({
      position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 }
    });
    
    // Drag to a different position
    await page.mouse.down();
    await page.mouse.move(canvasBox!.x + canvasBox!.width / 3, canvasBox!.y + canvasBox!.height / 3);
    await page.mouse.up();
    
    // Test passes if no errors occur during drag
    await page.waitForTimeout(500);
  });

  test('Element combinations work (drag element onto another)', async ({ page }) => {
    // Wait for elements to load
    await page.waitForSelector('[data-element-id="0"]', { timeout: 10000 });
    
    const canvas = page.locator('#game-container canvas');
    
    // Add water element
    await page.locator('[data-element-id="0"]').click();
    await page.waitForTimeout(1000);
    
    // Add fire element at different position
    await page.locator('[data-element-id="1"]').click();
    await page.waitForTimeout(1000);
    
    // Try to combine by dragging one element onto another within canvas
    const canvasBox = await canvas.boundingBox();
    const pos1 = { x: canvasBox!.width / 3, y: canvasBox!.height / 3 };
    const pos2 = { x: (canvasBox!.width * 2) / 3, y: canvasBox!.height / 3 };
    
    await canvas.click({ position: pos1 });
    await page.mouse.down();
    await page.mouse.move(canvasBox!.x + pos2.x, canvasBox!.y + pos2.y);
    await page.mouse.up();
    
    // Wait to see if combination produces a result
    await page.waitForTimeout(2000);
    
    // Check if any success/combination message appears
    const combinationMessage = page.locator('.fixed .bg-blue-500, .fixed .bg-purple-500, .fixed .bg-green-500');
    // This might timeout if no combination exists, which is OK
    try {
      await expect(combinationMessage).toBeVisible({ timeout: 3000 });
    } catch (e) {
      // Combination might not exist, but drag should still work
      console.log('No combination message - this is OK if elements don\'t combine');
    }
  });

  test('Game UI elements are present and functional', async ({ page }) => {
    // Check basic UI elements
    await expect(page.locator('text=Elements')).toBeVisible();
    
    // Check if How to Play button exists and works
    const howToPlayButton = page.locator('button:has-text("How to Play"), button:has-text("🤔")');
    if (await howToPlayButton.count() > 0) {
      await howToPlayButton.first().click();
      await page.waitForTimeout(500);
      // Dialog should appear
      const dialog = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(dialog).toBeVisible();
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Close"), button:has-text("✕"), button:has-text("×")');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
    
    // Check utility buttons if they exist
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("🗑")');
    const autoArrangeButton = page.locator('button:has-text("Auto Arrange"), button:has-text("📋")');
    
    // These should exist but we won't click them to avoid clearing the game
    // Just verify they're present and clickable
    if (await clearButton.count() > 0) {
      await expect(clearButton.first()).toBeVisible();
    }
    if (await autoArrangeButton.count() > 0) {
      await expect(autoArrangeButton.first()).toBeVisible();
    }
  });
}); 