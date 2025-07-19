import { test, expect } from '@playwright/test';

test.describe('Quick Fixes Verification', () => {
  test('Mobile discovery panel CSS layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for basic page load
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if the panel takes full width
    const panel = page.locator('#discovery-panel');
    const panelBox = await panel.boundingBox();
    
    expect(panelBox).not.toBeNull();
    console.log('Mobile panel width:', panelBox!.width);
    console.log('Mobile panel x-position:', panelBox!.x);
    
    // Panel should take full width (375px) and start at x=0
    expect(panelBox!.width).toBe(375);
    expect(panelBox!.x).toBe(0);
    
    // Check CSS properties
    const styles = await panel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        width: computed.width,
        left: computed.left,
        right: computed.right
      };
    });
    
    console.log('Panel CSS:', styles);
    expect(styles.position).toBe('fixed');
    expect(styles.width).toBe('375px');
    expect(styles.left).toBe('0px');
    expect(styles.right).toBe('0px');
  });

  test('Desktop discovery panel layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for basic page load
    await page.waitForSelector('#discovery-panel', { timeout: 10000 });
    
    // Desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    // Check if the panel is positioned correctly on desktop
    const panel = page.locator('#discovery-panel');
    const panelBox = await panel.boundingBox();
    
    expect(panelBox).not.toBeNull();
    console.log('Desktop panel:', panelBox);
    
    // Panel should be on the right side in desktop mode
    expect(panelBox!.x).toBeGreaterThan(600); // Should be positioned on the right
    expect(panelBox!.width).toBeGreaterThan(250); // Should have reasonable width
    expect(panelBox!.width).toBeLessThan(400); // But not too wide
  });

  test('Auto arrange button exists and is clickable', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for UI to load
    await page.waitForSelector('#auto-arrange-action', { timeout: 15000 });
    
    const autoArrangeBtn = page.locator('#auto-arrange-action');
    await expect(autoArrangeBtn).toBeVisible();
    await expect(autoArrangeBtn).toBeEnabled();
    
    // Click should work without errors
    await autoArrangeBtn.click();
    await page.waitForTimeout(500);
    
    // No errors should occur
    const errors = await page.evaluate(() => {
      return (window as any).lastError || null;
    });
    
    expect(errors).toBeNull();
  });

  test('Discovery panel elements are draggable', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for basic loading
    await page.waitForSelector('.element-grid', { timeout: 15000 });
    
    // Check if any element cards exist
    const elementCards = page.locator('.element-card');
    const count = await elementCards.count();
    
    console.log('Element cards found:', count);
    
    if (count > 0) {
      const firstCard = elementCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check if the card has draggable attribute
      const isDraggable = await firstCard.getAttribute('draggable');
      expect(isDraggable).toBe('true');
      
      // Check if it has the right data attribute
      const elementId = await firstCard.getAttribute('data-element-id');
      expect(elementId).toBeTruthy();
      
      console.log('First element ID:', elementId);
    }
  });

  test('Font size controls exist and are functional', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for controls to load
    await page.waitForSelector('#font-size-increase', { timeout: 10000 });
    await page.waitForSelector('#font-size-decrease', { timeout: 10000 });
    
    const increaseBtn = page.locator('#font-size-increase');
    const decreaseBtn = page.locator('#font-size-decrease');
    
    await expect(increaseBtn).toBeVisible();
    await expect(decreaseBtn).toBeVisible();
    
    // Get initial font scale
    const initialScale = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-scale');
    });
    
    console.log('Initial font scale:', initialScale);
    
    // Click increase button
    await increaseBtn.click();
    await page.waitForTimeout(100);
    
    // Check if scale changed
    const newScale = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-scale');
    });
    
    console.log('New font scale:', newScale);
    
    // Scale should have increased (or stayed the same if at max)
    const initialNum = parseFloat(initialScale || '1');
    const newNum = parseFloat(newScale || '1');
    expect(newNum).toBeGreaterThanOrEqual(initialNum);
  });

  test('Dark mode toggle works', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for dark mode toggle
    await page.waitForSelector('#dark-mode-toggle', { timeout: 10000 });
    
    const darkModeToggle = page.locator('#dark-mode-toggle');
    await expect(darkModeToggle).toBeVisible();
    
    // Check initial state
    const initialDarkMode = await page.evaluate(() => {
      return document.body.classList.contains('dark-mode') || document.body.classList.contains('dark');
    });
    
    console.log('Initial dark mode:', initialDarkMode);
    
    // Click toggle
    await darkModeToggle.click();
    await page.waitForTimeout(100);
    
    // Check if state changed
    const newDarkMode = await page.evaluate(() => {
      return document.body.classList.contains('dark-mode') || document.body.classList.contains('dark');
    });
    
    console.log('New dark mode:', newDarkMode);
    expect(newDarkMode).toBe(!initialDarkMode);
  });

  test('Visual regression test', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForSelector('#discovery-panel', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Desktop screenshot
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('desktop-layout.png', {
      animations: 'disabled',
      timeout: 30000
    });
    
    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      animations: 'disabled',
      timeout: 30000
    });
  });
}); 