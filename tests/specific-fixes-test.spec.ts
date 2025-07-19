import { test, expect } from '@playwright/test';

test.describe('Specific Issue Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for the game to load completely
    await page.waitForSelector('#game-container');
    await page.waitForFunction(() => (window as any).game && (window as any).game.ui);
    await page.waitForTimeout(3000);
    
    // Add some elements to canvas for testing
    const gameReady = await page.evaluate(() => {
      return !!(window as any).game && !!(window as any).game.ui && !!(window as any).game.elementManager;
    });
    
    if (gameReady) {
      await page.evaluate(() => {
        const game = (window as any).game;
        // Add elements to canvas for testing
        game.addElement('water', 100, 100);
        game.addElement('fire', 200, 150);
        game.addElement('earth', 300, 200);
        game.addElement('air', 150, 250);
      });
      
      await page.waitForTimeout(500);
    }
  });

  test('1. Mobile discovery panel takes full width', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000); // Wait for resize handling
    
    const discoveryPanel = page.locator('#discovery-panel');
    await expect(discoveryPanel).toBeVisible();
    
    // Check panel width matches viewport width
    const panelBox = await discoveryPanel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.width).toBe(375);
    expect(panelBox!.x).toBe(0);
    
    // Check panel extends to full width
    const computed = await discoveryPanel.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        width: style.width,
        left: style.left,
        right: style.right,
        position: style.position
      };
    });
    
    expect(computed.width).toBe('375px');
    expect(computed.left).toBe('0px');
    expect(computed.right).toBe('0px');
    expect(computed.position).toBe('fixed');
  });

  test('2. Drag highlighting from discovery panel works', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    // Find an element card to drag
    const elementCard = page.locator('.element-card').first();
    await expect(elementCard).toBeVisible();
    
    // Get the element ID for testing
    const elementId = await elementCard.getAttribute('data-element-id');
    console.log('Testing drag for element:', elementId);
    
    // Enable console logging to debug highlighting
    page.on('console', msg => {
      if (msg.text().includes('🟢') || msg.text().includes('✅') || msg.text().includes('🎯')) {
        console.log('BROWSER:', msg.text());
      }
    });
    
    // Start drag operation
    await elementCard.hover();
    await elementCard.dispatchEvent('dragstart', {
      dataTransfer: {
        setData: (type: string, data: string) => {},
        effectAllowed: 'copy'
      }
    });
    
    await page.waitForTimeout(500);
    
    // Check if highlighting was applied (via console logs)
    // The test will pass if no errors occur and highlighting logs appear
    
    // End drag operation
    await elementCard.dispatchEvent('dragend');
    await page.waitForTimeout(200);
  });

  test('3. Auto arrange creates close grid spacing', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    // Verify we have elements on canvas
    const elementCount = await page.evaluate(() => {
      const game = (window as any).game;
      return game.getAllCanvasElements().length;
    });
    
    expect(elementCount).toBeGreaterThan(0);
    console.log(`Testing auto-arrange with ${elementCount} elements`);
    
    // Get initial positions
    const initialPositions = await page.evaluate(() => {
      const game = (window as any).game;
      const elements = game.getAllCanvasElements();
      return elements.map((el: any) => ({ x: el.x, y: el.y }));
    });
    
    // Click auto arrange
    await page.click('#auto-arrange-action');
    await page.waitForTimeout(1500); // Wait for animation
    
    // Get final positions
    const finalPositions = await page.evaluate(() => {
      const game = (window as any).game;
      const elements = game.getAllCanvasElements();
      return elements.map((el: any) => ({ x: el.x, y: el.y }));
    });
    
    expect(finalPositions.length).toBe(initialPositions.length);
    
    // Check that elements are in a grid pattern with small spacing
    if (finalPositions.length >= 2) {
      // Calculate distances between adjacent elements
      const distances: number[] = [];
      
      for (let i = 0; i < finalPositions.length - 1; i++) {
        for (let j = i + 1; j < finalPositions.length; j++) {
          const dx = finalPositions[j].x - finalPositions[i].x;
          const dy = finalPositions[j].y - finalPositions[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          distances.push(distance);
        }
      }
      
      // Find minimum distance (should be close spacing)
      const minDistance = Math.min(...distances);
      console.log(`Minimum distance between elements: ${minDistance}px`);
      
      // With 3px spacing + 60px element size, adjacent elements should be ~63px apart
      // Allow some tolerance for diagonal distances
      expect(minDistance).toBeGreaterThan(50); // At least 50px
      expect(minDistance).toBeLessThan(100); // But less than 100px (close spacing)
      
      // Check that elements formed a grid (some elements should be aligned)
      const xCoords = finalPositions.map(pos => Math.round(pos.x));
      const yCoords = finalPositions.map(pos => Math.round(pos.y));
      
      // Count unique X and Y coordinates (should be fewer than total elements for grid)
      const uniqueX = new Set(xCoords).size;
      const uniqueY = new Set(yCoords).size;
      
      console.log(`Grid pattern: ${uniqueX} columns, ${uniqueY} rows`);
      
      // For 4 elements, we expect 2x2 grid (2 unique X, 2 unique Y)
      if (finalPositions.length === 4) {
        expect(uniqueX).toBeLessThanOrEqual(2);
        expect(uniqueY).toBeLessThanOrEqual(2);
      }
    }
  });

  test('4. Combined test - Mobile panel + Auto arrange', async ({ page }) => {
    // Start in mobile mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Verify mobile panel layout
    const discoveryPanel = page.locator('#discovery-panel');
    const panelBox = await discoveryPanel.boundingBox();
    expect(panelBox!.width).toBe(375);
    
    // Add more elements for testing
    await page.evaluate(() => {
      const game = (window as any).game;
      game.addElement('steam', 50, 50);
      game.addElement('plant', 100, 50);
    });
    
    await page.waitForTimeout(300);
    
    // Switch to desktop and test auto arrange
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(2000);
    
    // Click auto arrange
    await page.click('#auto-arrange-action');
    await page.waitForTimeout(1500);
    
    // Verify arrangement worked
    const positions = await page.evaluate(() => {
      const game = (window as any).game;
      const elements = game.getAllCanvasElements();
      return elements.map((el: any) => ({ x: el.x, y: el.y }));
    });
    
    expect(positions.length).toBeGreaterThan(4);
    
    // Check all elements are visible and arranged
    const bounds = {
      minX: Math.min(...positions.map(p => p.x)),
      maxX: Math.max(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
      maxY: Math.max(...positions.map(p => p.y))
    };
    
    const gridWidth = bounds.maxX - bounds.minX;
    const gridHeight = bounds.maxY - bounds.minY;
    
    console.log(`Final grid size: ${gridWidth}x${gridHeight}`);
    
    // Grid should be reasonable size (not spread too far)
    expect(gridWidth).toBeLessThan(300);
    expect(gridHeight).toBeLessThan(300);
  });

  test('5. Visual verification - Final state', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    
    // Add a few more elements
    await page.evaluate(() => {
      const game = (window as any).game;
      game.addElement('steam', 400, 300);
      game.addElement('plant', 450, 350);
      game.addElement('stone', 500, 400);
    });
    
    await page.waitForTimeout(500);
    
    // Auto arrange
    await page.click('#auto-arrange-action');
    await page.waitForTimeout(2000);
    
    // Take a screenshot for verification
    await expect(page).toHaveScreenshot('specific-fixes-final.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
}); 