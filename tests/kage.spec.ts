import { test, expect } from '@playwright/test';

test('desktop: scene, navigation, room selection, audio and visit plan', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('keheningan.');
  await expect(page.locator('.temple-scene canvas')).toBeVisible();
  await expect(page.locator('.scene-caption')).toContainText('SENJA DI KAGE');
  const rendered = await page.locator('canvas').evaluate(canvas => {
    const context = canvas.getContext('webgl2');
    return Boolean(context && context.drawingBufferWidth > 0 && context.getError() === context.NO_ERROR);
  });
  expect(rendered).toBe(true);
  await page.getByRole('button', { name: 'Aktifkan suara ambien' }).click();
  await expect(page.getByRole('button', { name: 'Matikan suara ambien' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Matikan suara ambien' }).click();
  await page.getByRole('link', { name: 'Mulai perjalanan' }).click();
  const garden = page.getByRole('tab', { name: /Taman lentera/ });
  await garden.click();
  await expect(garden).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel').getByRole('heading')).toHaveText('Taman lentera');
  await garden.press('ArrowRight');
  await expect(page.getByRole('tabpanel').getByRole('heading')).toHaveText('Paviliun sunyi');
  await page.getByRole('button', { name: 'Rencanakan kunjungan' }).last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Tanggal kunjungan digital').fill('2030-12-01');
  await page.getByLabel('Ruang yang ingin dijelajahi').selectOption('1');
  await page.getByRole('button', { name: 'Catat rencana' }).click();
  await expect(page.getByRole('status')).toContainText('1 Desember 2030');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Kage beranda' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await page.screenshot({ path: '/tmp/kage-desktop-full.png', fullPage: true });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('mobile: navigation, no overflow, reduced motion and context-loss recovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Aktifkan efek gerakan' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.temple-scene canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Jelajahi ruang' }).click();
  await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.getByRole('tab', { name: /Paviliun sunyi/ }).click();
  await expect(page.getByRole('tabpanel').getByRole('heading')).toHaveText('Paviliun sunyi');
  await page.getByRole('link', { name: 'Lihat suasana Paviliun sunyi dalam adegan interaktif' }).click();
  await page.screenshot({ path: '/tmp/kage-mobile.png' });
  await page.locator('canvas').evaluate(canvas => {
    const extension = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable');
    (canvas as HTMLCanvasElement & { recovery: WEBGL_lose_context }).recovery = extension;
    extension.loseContext();
  });
  await expect(page.locator('.scene-caption')).toContainText('LANSKAP SENJA');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('canvas').evaluate(canvas => { (canvas as HTMLCanvasElement & { recovery: WEBGL_lose_context }).recovery.restoreContext(); });
  await expect(page.locator('.scene-caption')).toContainText('SENJA DI KAGE');
});

test('scroll journey keeps the scene pinned, advances through the temple and can be disabled', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const canvas = page.locator('.temple-scene canvas');
  await expect(canvas).toBeVisible();
  const entrance = await canvas.screenshot();
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.1, behavior: 'instant' }));
  await expect(page.locator('.journey-story h2')).toContainText('Ikuti cahaya.');
  await expect(page.locator('.hero-content')).toHaveCSS('opacity', '0');
  expect(Math.abs((await page.locator('.hero').boundingBox())!.y)).toBeLessThan(1);
  await page.screenshot({ path: '/tmp/kage-journey-middle.png' });
  expect((await canvas.screenshot()).equals(entrance)).toBe(false);
  await page.getByRole('button', { name: 'Menuju Paviliun sunyi' }).click();
  await expect(page.locator('.journey-story h2')).toContainText('Anda telah tiba.');
  await expect(page.getByRole('button', { name: 'Menuju Paviliun sunyi' })).toHaveAttribute('aria-current', 'step');
  await page.screenshot({ path: '/tmp/kage-journey-temple.png' });
  await page.getByRole('button', { name: 'Matikan efek gerakan' }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.getByRole('button', { name: 'Aktifkan efek gerakan' })).toHaveAttribute('aria-pressed', 'false');
  expect(Math.abs((await page.locator('.journey').boundingBox())!.height - 900)).toBeLessThan(2);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile users can opt into the journey with reduced motion enabled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.temple-scene canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Aktifkan efek gerakan' }).click();
  await expect(page.getByRole('button', { name: 'Matikan efek gerakan' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Mulai perjalanan' }).click();
  await expect(page.locator('.journey-story h2')).toContainText('Ikuti cahaya.');
  expect(Math.abs((await page.locator('.hero').boundingBox())!.y)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/kage-mobile-journey.png' });
});
