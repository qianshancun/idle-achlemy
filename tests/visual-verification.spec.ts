import { test, expect } from '@playwright/test';

test.describe('Visual Layout Verification', () => {
  test('Layout verification at different sizes', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for basic loading
    await page.waitForSelector('#discovery-panel', { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // 1. Desktop layout (1200px)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('layout-desktop-1200px.png', {
      animations: 'disabled',
      timeout: 20000
    });
    
    // 2. Problematic 528px width  
    await page.setViewportSize({ width: 528, height: 700 });
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('layout-mobile-528px.png', {
      animations: 'disabled',
      timeout: 20000
    });
    
    // 3. Standard mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('layout-mobile-375px.png', {
      animations: 'disabled',
      timeout: 20000
    });
    
    // 4. Tablet size (768px)
    await page.setViewportSize({ width: 768, height: 600 });
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('layout-tablet-768px.png', {
      animations: 'disabled',
      timeout: 20000
    });
    
    console.log('✅ All layout screenshots captured successfully');
  });
}); 