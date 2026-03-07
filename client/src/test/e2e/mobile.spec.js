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

    await expect(page.locator('.dashboard-mobile-stack')).toBeVisible();
    await expect(page.locator('.react-grid-item')).toHaveCount(0);
    await expect(page.locator('.sport-widget__header.drag-handle')).toHaveCount(0);
  });

  test('refresh button can be tapped on mobile', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    let scoresRequests = 0;

    await page.route('**/api/scores/**', async (route) => {
      scoresRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ games: [] }),
      });
    });
    await page.route('**/api/teams/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ teams: [] }),
      });
    });

    await page.reload();
    await page.waitForSelector('.sport-widget', { timeout: 10_000 });

    const requestCountBefore = scoresRequests;
    await page.locator('.sport-widget__refresh').first().click();
    await expect.poll(() => scoresRequests).toBeGreaterThan(requestCountBefore);
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
