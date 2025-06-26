# 🧪 Idle Alchemy - Manual Testing Guide

## Overview
This guide covers manual testing for the three main improvements implemented:
1. Reset button moved to discovery panel header
2. Resizable discovery panel
3. Fixed auto-arrange centering

## Setup
1. Start the development server: `npm run dev`
2. Open the game in your browser (check console for the actual port, usually http://localhost:3001)
3. Wait for the game to fully load

## 🔴 Test 1: Reset Button Location

### Expected Behavior
- Reset button should be in the discovery panel header (red color)
- Reset button should NOT be in bottom-actions
- Bottom-actions should only contain: Auto Arrange | Remove Duplicate | Clear

### Manual Test Steps
1. **Visual Check**: 
   - ✅ Look at the discovery panel header (top-right on desktop, bottom panel on mobile)
   - ✅ Confirm "Reset" button is visible next to language selector
   - ✅ Confirm reset button is styled in red color
   
2. **Visual Check - Bottom Actions**:
   - ✅ Look at bottom-actions (top-left corner)
   - ✅ Confirm only 3 actions: "Auto Arrange | Remove Duplicate | Clear"
   - ✅ Confirm NO reset button in bottom-actions

3. **Functional Test**:
   - ✅ Add some elements to canvas by clicking element cards
   - ✅ Click the red "Reset" button in the header
   - ✅ Confirm dialog appears asking for confirmation
   - ✅ Click "Cancel" - nothing should happen
   - ✅ Click "Reset" again, then "Confirm" - game should reset

**✅ PASS CRITERIA**: Reset button is in header, styled red, and works correctly

---

## 📏 Test 2: Resizable Discovery Panel

### Desktop Testing (viewport > 768px)

#### Expected Behavior
- Resize handle on left edge of discovery panel
- Horizontal cursor (↔) when hovering over handle
- Panel width changes when dragging
- Game canvas adjusts accordingly

#### Manual Test Steps
1. **Visual Check**:
   - ✅ Hover over the left edge of the discovery panel
   - ✅ Confirm cursor changes to horizontal resize (↔)
   - ✅ Look for subtle blue highlight on hover

2. **Resize Test**:
   - ✅ Click and drag the left edge of the panel toward the center
   - ✅ Panel should get wider, canvas area should get smaller
   - ✅ Drag the edge toward the right side
   - ✅ Panel should get narrower, canvas area should get larger
   - ✅ Test minimum width (shouldn't go below ~200px)
   - ✅ Test maximum width (shouldn't go above ~400px)

3. **Persistence Test**:
   - ✅ Resize the panel to a different width
   - ✅ Add elements, use other features
   - ✅ Confirm panel maintains its resized width

### Mobile Testing (viewport ≤ 768px)

#### Expected Behavior
- Resize handle on top edge of discovery panel (bottom of screen)
- Vertical cursor (↕) when hovering over handle
- Panel height changes when dragging

#### Manual Test Steps
1. **Setup**: Resize browser window to mobile size (≤ 768px width) or use device simulation

2. **Visual Check**:
   - ✅ Discovery panel should be at bottom of screen
   - ✅ Hover over the top edge of the discovery panel
   - ✅ Confirm cursor changes to vertical resize (↕)

3. **Resize Test**:
   - ✅ Click and drag the top edge upward
   - ✅ Panel should get taller, canvas area should get smaller
   - ✅ Drag the edge downward
   - ✅ Panel should get shorter, canvas area should get larger
   - ✅ Test minimum height (shouldn't go below ~120px)
   - ✅ Test maximum height (shouldn't go above ~350px)

**✅ PASS CRITERIA**: Panel resizes smoothly with proper constraints and cursor feedback

---

## 🎯 Test 3: Auto-Arrange Centering

### Expected Behavior
- Elements arrange in a grid centered in the available canvas area
- Grid positioning accounts for current discovery panel size
- Works correctly on both desktop and mobile
- Elements animate smoothly to new positions

### Manual Test Steps

1. **Setup**:
   - ✅ Add 6-12 elements to the canvas by clicking element cards multiple times
   - ✅ Drag elements around to random positions
   - ✅ (Optional) Resize the discovery panel to test dynamic sizing

2. **Desktop Test**:
   - ✅ Click "Auto Arrange" in bottom-actions
   - ✅ Watch elements animate to grid positions
   - ✅ Confirm grid appears centered in the canvas area (left of discovery panel)
   - ✅ Grid should not overlap with discovery panel
   - ✅ Grid should be visually centered with equal spacing on all sides

3. **Mobile Test**:
   - ✅ Resize browser to mobile view (≤ 768px)
   - ✅ Add elements and scatter them around
   - ✅ Click "Auto Arrange"
   - ✅ Confirm grid appears centered in canvas area (above discovery panel)
   - ✅ Grid should not overlap with bottom discovery panel

4. **Dynamic Panel Size Test**:
   - ✅ Resize discovery panel to a different size
   - ✅ Add more elements and click "Auto Arrange"
   - ✅ Confirm grid centers correctly in the new available space
   - ✅ Larger panels = smaller canvas area = tighter grid spacing
   - ✅ Smaller panels = larger canvas area = more spread out grid

5. **Various Element Counts**:
   - ✅ Test with 3 elements (should form small centered group)
   - ✅ Test with 20+ elements (should form larger grid, still centered)
   - ✅ Test with 1 element (should center in available space)

**✅ PASS CRITERIA**: Grid is always visually centered in available canvas space, regardless of panel size

---

## 🎮 Additional Integration Tests

### Test 4: Language Selector in Header
- ✅ Language selector should be next to reset button in header
- ✅ Both should be in the `header-controls` div
- ✅ Language selector should still function correctly

### Test 5: Responsive Behavior
- ✅ Desktop (>768px): Right panel, horizontal resize, reset in top-right
- ✅ Mobile (≤768px): Bottom panel, vertical resize, reset in bottom header
- ✅ Transition between desktop/mobile should work smoothly

### Test 6: Game Functionality Preservation
- ✅ All original game mechanics still work
- ✅ Element discovery, merging, saving/loading intact
- ✅ All other UI features unaffected

---

## 🚨 Common Issues & Troubleshooting

### Issue: Reset button not visible in header
- **Check**: Ensure page is fully loaded
- **Fix**: Refresh the page and wait for complete initialization

### Issue: Resize handle not working
- **Check**: Ensure you're clicking exactly on the panel edge
- **Check**: Look for cursor change to confirm you're on the handle
- **Try**: Different browsers (Chrome, Safari, Firefox)

### Issue: Auto-arrange not centering
- **Check**: Try with different numbers of elements
- **Check**: Try resizing the panel first, then auto-arrange
- **Compare**: Grid center vs. available canvas center

### Issue: Mobile resize not working
- **Check**: Browser window is actually ≤768px wide
- **Try**: Browser developer tools device simulation
- **Check**: Touch vs mouse events

---

## 📋 Test Results Checklist

Use this checklist to verify all functionality:

### Reset Button Location
- [ ] Reset button in discovery panel header
- [ ] Reset button styled in red
- [ ] Reset button NOT in bottom-actions
- [ ] Bottom-actions has only 3 arrangement buttons
- [ ] Reset functionality works correctly

### Resizable Panel - Desktop
- [ ] Resize handle visible on left edge
- [ ] Horizontal cursor on hover
- [ ] Panel resizes when dragging
- [ ] Min/max width constraints work
- [ ] Canvas area adjusts accordingly

### Resizable Panel - Mobile
- [ ] Resize handle visible on top edge
- [ ] Vertical cursor on hover
- [ ] Panel resizes when dragging
- [ ] Min/max height constraints work
- [ ] Canvas area adjusts accordingly

### Auto-Arrange Centering
- [ ] Grid centers in available canvas space
- [ ] Works with different panel sizes
- [ ] Works with different element counts
- [ ] Smooth animation to new positions
- [ ] Desktop and mobile both work

### Integration
- [ ] Language selector still in header
- [ ] All original game features work
- [ ] Responsive design works
- [ ] Performance is acceptable

---

## 🎉 Success Criteria

All features are working correctly if:
1. **Reset button is in the header** (red color, next to language selector)
2. **Discovery panel is resizable** (smooth dragging, proper constraints)
3. **Auto-arrange centers elements** (visually centered in available space)
4. **All features work together** (no conflicts or regressions)

If any test fails, check the browser console for errors and verify the implementation in the source code. 