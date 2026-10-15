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
