import { test, expect } from '@playwright/test';

test.describe('checkout workflow', () => {
  test('should add an item to the cart and checkout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find a non-sold-out competition's "Get your ticket" link
    const ticketLink = page.getByRole('link', { name: /get your ticket/i }).first();
    await ticketLink.waitFor({ state: 'visible', timeout: 15000 });
    await ticketLink.click();

    //waiting for the page to load
    await page.waitForLoadState();
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page
      .getByRole('button', { name: 'continue to the next step' })
      .click();
    await page.getByRole('button', { name: 'Rolex Hulk' }).click();
    await page
      .getByRole('button', { name: 'Continue to the last step' })
      .click();
    await page.getByLabel('FIRST NAME').click();
    await page.getByLabel('FIRST NAME').fill('iliass');
    await page.getByLabel('FIRST NAME').press('Tab');
    await page.getByLabel('LAST NAME').fill('jabali');
    await page.getByLabel('LAST NAME').press('Tab');
    await page.getByLabel('COUNTRY/REGION').press('Tab');
    await page.getByLabel('ZIP CODE').fill('69000');
    await page.getByLabel('ZIP CODE').press('Tab');
    await page.getByPlaceholder('house number & street name').fill('tes4rtete');
    await page.getByPlaceholder('house number & street name').press('Tab');
    await page.getByLabel('TOWN/CITY').fill('paris');
    await page.getByLabel('PHONE*').click();
    await page.getByLabel('PHONE*').fill('6189234247');
    await page.getByLabel('EMAIL').click();
    await page.getByLabel('EMAIL').fill('email@gmail.com');
    await page.getByRole('button', { name: 'Proceed to check out' }).click();
  });
});
