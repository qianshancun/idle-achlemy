import { test, expect } from '@playwright/test';

test.describe('UI Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for the game to load
    await page.waitForSelector('#game-container');
    await page.waitForTimeout(2000);
    
    // Create some elements for testing
    await page.evaluate(() => {
      // Simulate discovering elements to test
      (window as any).game.elementManager.discoveredElements.add('water');
      (window as any).game.elementManager.discoveredElements.add('fire'); 
      (window as any).game.elementManager.discoveredElements.add('steam');
      (window as any).game.elementManager.discoveredElements.add('plant');
    });
    
    // Refresh UI to show discovered elements
    await page.evaluate(() => {
      (window as any).game.ui.updateUI();
    });
    
    await page.waitForTimeout(1000);
  });

  test('1. Element cards should be content-fit width', async ({ page }) => {
    // Check that elements don't take full row width
    const elementCards = await page.locator('.element-card').all();
    
    for (const card of elementCards) {
      const cardWidth = await card.evaluate(el => el.getBoundingClientRect().width);
      const parentWidth = await card.evaluate(el => el.parentElement!.getBoundingClientRect().width);
      
      // Element should be much smaller than parent (content-fit)
      expect(cardWidth).toBeLessThan(parentWidth * 0.8);
    }
    
    // Check that multiple elements can fit on same row
    const elementGrid = await page.locator('.element-grid');
    const gridComputedStyle = await elementGrid.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(gridComputedStyle).toBe('flex');
    
    const flexWrap = await elementGrid.evaluate(el => 
      window.getComputedStyle(el).flexWrap
    );
    expect(flexWrap).toBe('wrap');
  });

  test('2. Sort buttons should show proper arrows', async ({ page }) => {
    const sortAlphabetical = page.locator('#sort-alphabetical');
    const sortDiscovery = page.locator('#sort-discovery-time');
    
    // Check initial state (discovery-asc should be active)
    await expect(sortDiscovery).toHaveAttribute('data-direction', 'asc');
    await expect(sortDiscovery).toHaveClass(/active/);
    
    // Check arrow styling
    const discoveryArrow = await sortDiscovery.evaluate(el => 
      window.getComputedStyle(el, '::after').content
    );
    expect(discoveryArrow).toBe('"↑"');
    
    // Click to change direction
    await sortDiscovery.click();
    await page.waitForTimeout(500);
    
    // Should now be desc
    await expect(sortDiscovery).toHaveAttribute('data-direction', 'desc');
    const discoveryArrowDesc = await sortDiscovery.evaluate(el => 
      window.getComputedStyle(el, '::after').content
    );
    expect(discoveryArrowDesc).toBe('"↓"');
    
    // Test alphabetical sort
    await sortAlphabetical.click();
    await page.waitForTimeout(500);
    
    await expect(sortAlphabetical).toHaveAttribute('data-direction', 'asc');
    await expect(sortAlphabetical).toHaveClass(/active/);
    
    const alphaArrow = await sortAlphabetical.evaluate(el => 
      window.getComputedStyle(el, '::after').content
    );
    expect(alphaArrow).toBe('"↑"');
  });

  test('3. Game actions should have reduced padding', async ({ page }) => {
    const actionGroups = await page.locator('.action-group').all();
    
    for (const group of actionGroups) {
      const padding = await group.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      
      // Should be 6px 10px (reduced from 8px 12px)
      expect(padding).toBe('6px 10px');
    }
  });

  test('4. Discovery order should be tracked correctly', async ({ page }) => {
    // Clear storage and create fresh order
    await page.evaluate(() => {
      localStorage.removeItem('idle-alchemy-discovery-order');
    });
    
    await page.reload();
    await page.waitForSelector('#game-container');
    await page.waitForTimeout(2000);
    
    // Simulate discovering elements in specific order
    await page.evaluate(() => {
      const ui = (window as any).game.ui;
      const elementManager = (window as any).game.elementManager;
      
      // Clear existing
      ui.discoveryOrder = [];
      
      // Add elements in specific order: fire, water, steam, plant
      elementManager.discoveredElements.add('fire');
      ui.addToDiscoveryOrder('fire');
      
      elementManager.discoveredElements.add('water'); 
      ui.addToDiscoveryOrder('water');
      
      elementManager.discoveredElements.add('steam');
      ui.addToDiscoveryOrder('steam');
      
      elementManager.discoveredElements.add('plant');
      ui.addToDiscoveryOrder('plant');
      
      ui.updateUI();
    });
    
    await page.waitForTimeout(1000);
    
    // Click discovery sort to ensure proper order
    await page.click('#sort-discovery-time');
    await page.waitForTimeout(500);
    
    // Check order matches discovery sequence
    const elementNames = await page.locator('.element-card .element-name').allTextContents();
    
    // Verify the order follows discovery sequence
    const expectedOrder = ['Fire', 'Water', 'Steam', 'Plant'];
    const actualOrder = elementNames.slice(0, 4); // Take first 4
    
    expect(actualOrder).toEqual(expectedOrder);
    
    // Test reverse order
    await page.click('#sort-discovery-time'); // Should toggle to desc
    await page.waitForTimeout(500);
    
    const reversedNames = await page.locator('.element-card .element-name').allTextContents();
    const actualReversed = reversedNames.slice(0, 4);
    const expectedReversed = [...expectedOrder].reverse();
    
    expect(actualReversed).toEqual(expectedReversed);
  });

  test('5.1 Panel resize should not create blank areas - Desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    const resizeHandle = page.locator('#panel-resize-handle');
    const gameContainer = page.locator('#game-container');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Get initial positions
    const initialGameRect = await gameContainer.boundingBox();
    const initialPanelRect = await discoveryPanel.boundingBox();
    
    expect(initialGameRect).not.toBeNull();
    expect(initialPanelRect).not.toBeNull();
    
    // Verify no gap initially
    expect(initialGameRect!.x + initialGameRect!.width).toBeCloseTo(initialPanelRect!.x, 1);
    
    // Perform resize drag (make panel wider)
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(initialPanelRect!.x - 50, initialPanelRect!.y + 100);
    await page.waitForTimeout(100);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Check no blank areas after resize
    const newGameRect = await gameContainer.boundingBox();
    const newPanelRect = await discoveryPanel.boundingBox();
    
    expect(newGameRect).not.toBeNull();
    expect(newPanelRect).not.toBeNull();
    
    // Game container should end exactly where panel begins
    expect(newGameRect!.x + newGameRect!.width).toBeCloseTo(newPanelRect!.x, 1);
    
    // Panel should extend to edge
    expect(newPanelRect!.x + newPanelRect!.width).toBe(1024);
  });

  test('5.2 Panel resize should not create blank areas - Mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const resizeHandle = page.locator('#panel-resize-handle');
    const gameContainer = page.locator('#game-container');
    const discoveryPanel = page.locator('#discovery-panel');
    
    // Get initial positions
    const initialGameRect = await gameContainer.boundingBox();
    const initialPanelRect = await discoveryPanel.boundingBox();
    
    expect(initialGameRect).not.toBeNull();
    expect(initialPanelRect).not.toBeNull();
    
    // Verify no gap initially (vertical layout)
    expect(initialGameRect!.y + initialGameRect!.height).toBeCloseTo(initialPanelRect!.y, 1);
    
    // Perform resize drag (make panel taller)
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(initialPanelRect!.x + 100, initialPanelRect!.y - 30);
    await page.waitForTimeout(100);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Check no blank areas after resize
    const newGameRect = await gameContainer.boundingBox();
    const newPanelRect = await discoveryPanel.boundingBox();
    
    expect(newGameRect).not.toBeNull();
    expect(newPanelRect).not.toBeNull();
    
    // Game container should end exactly where panel begins
    expect(newGameRect!.y + newGameRect!.height).toBeCloseTo(newPanelRect!.y, 1);
    
    // Panel should extend to edge
    expect(newPanelRect!.y + newPanelRect!.height).toBe(667);
  });

  test('6. Visual verification screenshot', async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(2000);
    
    // Click sort buttons to show arrows
    await page.click('#sort-alphabetical');
    await page.waitForTimeout(300);
    
    // Take screenshot for visual verification
    await expect(page).toHaveScreenshot('ui-fixes-verification.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('7. Sort functionality works correctly', async ({ page }) => {
    // Test alphabetical sorting
    await page.click('#sort-alphabetical');
    await page.waitForTimeout(500);
    
    let elementNames = await page.locator('.element-card .element-name').allTextContents();
    let sortedNames = [...elementNames].sort();
    expect(elementNames).toEqual(sortedNames);
    
    // Test reverse alphabetical
    await page.click('#sort-alphabetical');
    await page.waitForTimeout(500);
    
    elementNames = await page.locator('.element-card .element-name').allTextContents();
    sortedNames = [...elementNames].sort().reverse();
    expect(elementNames).toEqual(sortedNames);
  });
}); 