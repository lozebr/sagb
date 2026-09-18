const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`NAGI Central de Aplicativos — ${viewport.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:4173/smoke-nagi.html', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Aplicativos', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aplicativos', exact: true })).toBeVisible();
    await expect(page.locator('article')).toHaveCount(26);
    await expect(page.getByText('produtos', { exact: true })).toBeVisible();

    const search = page.getByLabel('Buscar aplicativo');
    await search.fill('TaskZei');
    await expect(page.locator('article')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'TaskZei', exact: true })).toBeVisible();

    const taskzeiLink = page.getByRole('link', { name: 'Abrir demonstração de TaskZei' });
    await expect(taskzeiLink).toHaveAttribute(
      'href',
      'https://deploy-preview-3--loze-taskzei-web.netlify.app',
    );

    await search.fill('');
    await page.getByLabel('Filtrar por status').selectOption('not_verified');
    await expect(page.getByRole('heading', { name: 'CRM LOZE', exact: true })).toBeVisible();

    const crmCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'CRM LOZE', exact: true }) });
    await expect(crmCard.getByRole('button', { name: 'Abrir' })).toBeDisabled();

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - window.innerWidth,
      body: document.body.scrollWidth - window.innerWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.body).toBeLessThanOrEqual(1);

    await context.close();
  });
}
