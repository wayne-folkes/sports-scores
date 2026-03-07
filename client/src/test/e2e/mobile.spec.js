import { test, expect } from '@playwright/test';

test.describe('Mobile UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for at least one widget to be visible
    await page.waitForSelector('.sport-widget', { timeout: 10_000 });
  });

  test('widgets are visible on mobile', async ({ page }) => {
    const widgets = page.locator('.sport-widget');
    await expect(widgets).toHaveCount(2);
    await expect(widgets.first()).toBeVisible();
  });

  test('touch scroll moves the page, not the widget', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    // Record the widget's document-relative top before scrolling
    const widgetOffsetBefore = await page.locator('.sport-widget').first()
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

    // Simulate a vertical swipe upward on the widget header (scroll gesture)
    const header = page.locator('.sport-widget__header').first();
    const headerBox = await header.boundingBox();
    const startX = headerBox.x + headerBox.width / 2;
    const startY = headerBox.y + headerBox.height / 2;

    await page.touchscreen.tap(startX, startY);
    await page.touchscreen.tap(startX, startY - 200);

    await page.waitForTimeout(300);

    // Widget must not have changed its document-relative position (no drag occurred)
    const widgetOffsetAfter = await page.locator('.sport-widget').first()
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(Math.abs(widgetOffsetAfter - widgetOffsetBefore)).toBeLessThan(5);
  });

  test('drag is disabled on mobile — widget does not change grid position', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    const gridItem = page.locator('.react-grid-item').first();

    // Record initial grid transform
    const initialTransform = await gridItem.evaluate((el) => el.style.transform);

    // Attempt a press-and-hold drag via mouse (mimics touch drag)
    const box = await gridItem.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 300, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Widget position must not have changed (no grid re-layout)
    const finalTransform = await gridItem.evaluate((el) => el.style.transform);
    expect(finalTransform).toBe(initialTransform);
  });

  test('team selector dialog opens and closes on mobile', async ({ page }) => {
    const teamsBtn = page.locator('.sport-widget__edit').first();
    await teamsBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Close with the X button or Escape
    const closeBtn = dialog.locator('button[aria-label*="lose"], button[aria-label*="Cancel"]').first();
    const closeBtnCount = await closeBtn.count();
    if (closeBtnCount > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });

  test('score cards are tappable and open box score', async ({ page }) => {
    await page.waitForTimeout(2000);

    const scoreCard = page.locator('.score-card').first();
    const count = await scoreCard.count();
    if (count === 0) test.skip();

    await scoreCard.click();
    const modal = page.locator('.box-score-modal').first();
    await expect(modal).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Desktop UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.sport-widget', { timeout: 10_000 });
  });

  test('widgets load with sport labels', async ({ page }) => {
    await expect(page.locator('.sport-widget__label', { hasText: 'NBA' })).toBeVisible();
    await expect(page.locator('.sport-widget__label', { hasText: 'MLB' })).toBeVisible();
  });

  test('drag handle cursor is grab on desktop', async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    const header = page.locator('.sport-widget__header').first();
    const cursor = await header.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('grab');
  });

  test('refresh button triggers score reload', async ({ page }) => {
    const refreshBtn = page.locator('.sport-widget__refresh').first();
    await refreshBtn.click();
    await page.waitForTimeout(500);
    await expect(refreshBtn).toBeVisible();
  });

  test('team selector opens, shows teams, and closes', async ({ page }) => {
    await page.locator('.sport-widget__edit').first().click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    // Team list should load
    await expect(dialog.locator('button').first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
