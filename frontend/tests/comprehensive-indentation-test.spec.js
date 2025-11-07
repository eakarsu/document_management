const { test, expect } = require('@playwright/test');

test('Comprehensive indentation test - all levels', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@airforce.mil');
  await page.fill('input[name="password"]', '#H%YInr8hPVbctB7');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Go to document
  await page.goto('http://localhost:3000/editor/cmgs9kp2w000dvpuu4uy07w7f');
  await page.waitForTimeout(3000);

  console.log('\n=== Testing + Add Section button at different levels ===\n');

  // Test 1: Click on section 1.1 (level 2) → should create 1.1.1 (level 3, 40px)
  console.log('Test 1: Click on section 1.1 → create 1.1.1');
  const section11 = page.locator('h3:has-text("1.1")').first();
  await section11.click();
  await page.waitForTimeout(500);

  const addSectionBtn = page.locator('button:has-text("+ Add Section")');
  await addSectionBtn.click();
  await page.waitForTimeout(500);

  const dialog = page.locator('[role="dialog"]');
  let titleInput = dialog.locator('input').last();
  await titleInput.fill('Test Level 3');
  await page.waitForTimeout(300);

  let insertBtn = dialog.locator('button:has-text("Insert")');
  await insertBtn.click();
  await page.waitForTimeout(1000);

  let newSection = page.locator('h4:has-text("1.1.1 Test Level 3")').first();
  await expect(newSection).toBeVisible();
  let marginLeft = await newSection.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Section 1.1.1 margin-left: ${marginLeft}`);
  expect(marginLeft).toBe('40px'); // level 3: (3-1)*20 = 40px

  // Test 2: Click on section 1.1.1 (level 3) → should create 1.1.1.1 (level 4, 60px)
  console.log('Test 2: Click on section 1.1.1 → create 1.1.1.1');
  await newSection.click();
  await page.waitForTimeout(500);

  await addSectionBtn.click();
  await page.waitForTimeout(500);

  titleInput = dialog.locator('input').last();
  await titleInput.fill('Test Level 4');
  await page.waitForTimeout(300);

  insertBtn = dialog.locator('button:has-text("Insert")');
  await insertBtn.click();
  await page.waitForTimeout(1000);

  newSection = page.locator('h5:has-text("1.1.1.1 Test Level 4")').first();
  await expect(newSection).toBeVisible();
  marginLeft = await newSection.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Section 1.1.1.1 margin-left: ${marginLeft}`);
  expect(marginLeft).toBe('60px'); // level 4: (4-1)*20 = 60px

  // Test 3: Click on section 1.1.1.1 (level 4) → should create 1.1.1.1.1 (level 5, 80px)
  console.log('Test 3: Click on section 1.1.1.1 → create 1.1.1.1.1');
  await newSection.click();
  await page.waitForTimeout(500);

  await addSectionBtn.click();
  await page.waitForTimeout(500);

  titleInput = dialog.locator('input').last();
  await titleInput.fill('Test Level 5');
  await page.waitForTimeout(300);

  insertBtn = dialog.locator('button:has-text("Insert")');
  await insertBtn.click();
  await page.waitForTimeout(1000);

  newSection = page.locator('h6:has-text("1.1.1.1.1 Test Level 5")').first();
  await expect(newSection).toBeVisible();
  marginLeft = await newSection.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Section 1.1.1.1.1 margin-left: ${marginLeft}`);
  expect(marginLeft).toBe('80px'); // level 5: (5-1)*20 = 80px

  console.log('\n=== Testing + Para button at different levels ===\n');

  // Test 4: Click on section 1.1.1.1.1 (level 5) → create paragraph 1.1.1.1.1.1 (level 6, 100px)
  console.log('Test 4: Click + Para at section 1.1.1.1.1 → create 1.1.1.1.1.1');
  await newSection.click();
  await page.waitForTimeout(500);

  const addParaBtn = page.locator('button:has-text("+ Para")');
  await addParaBtn.click();
  await page.waitForTimeout(1000);

  let newPara = page.locator('p strong').filter({ hasText: /^1\.1\.1\.1\.1\.1\.$/ }).locator('..').first();
  await expect(newPara).toBeVisible();
  let paraMarginLeft = await newPara.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Paragraph 1.1.1.1.1.1 margin-left: ${paraMarginLeft}`);
  expect(paraMarginLeft).toBe('100px'); // level 6: (6-1)*20 = 100px

  // Test 5: Click on paragraph 1.1.1.1.1.1 → create sibling 1.1.1.1.1.2 (level 6, 100px)
  console.log('Test 5: Click + Para at paragraph 1.1.1.1.1.1 → create sibling 1.1.1.1.1.2');
  await newPara.click();
  await page.waitForTimeout(500);

  await addParaBtn.click();
  await page.waitForTimeout(1000);

  newPara = page.locator('p strong').filter({ hasText: /^1\.1\.1\.1\.1\.2\.$/ }).locator('..').first();
  await expect(newPara).toBeVisible();
  paraMarginLeft = await newPara.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Paragraph 1.1.1.1.1.2 margin-left: ${paraMarginLeft}`);
  expect(paraMarginLeft).toBe('100px'); // level 6: (6-1)*20 = 100px

  // Test 6: Test at a different branch - click on section 2.1
  console.log('Test 6: Click on section 2.1 → create 2.1.1');
  const section21 = page.locator('h3').filter({ hasText: /^2\.1\s/ }).first();
  await section21.click();
  await page.waitForTimeout(500);

  await addSectionBtn.click();
  await page.waitForTimeout(500);

  titleInput = dialog.locator('input').last();
  await titleInput.fill('Test Branch 2');
  await page.waitForTimeout(300);

  insertBtn = dialog.locator('button:has-text("Insert")');
  await insertBtn.click();
  await page.waitForTimeout(1000);

  newSection = page.locator('h4:has-text("2.1.1 Test Branch 2")').first();
  await expect(newSection).toBeVisible();
  marginLeft = await newSection.evaluate(el => window.getComputedStyle(el).marginLeft);
  console.log(`   Section 2.1.1 margin-left: ${marginLeft}`);
  expect(marginLeft).toBe('40px'); // level 3: (3-1)*20 = 40px

  console.log('\n✅ ✅ ✅ ALL COMPREHENSIVE TESTS PASSED! ✅ ✅ ✅\n');
  console.log('Summary:');
  console.log('  - Level 3 (1.1.1): 40px ✓');
  console.log('  - Level 4 (1.1.1.1): 60px ✓');
  console.log('  - Level 5 (1.1.1.1.1): 80px ✓');
  console.log('  - Level 6 paragraph (1.1.1.1.1.1): 100px ✓');
  console.log('  - Level 6 sibling paragraph (1.1.1.1.1.2): 100px ✓');
  console.log('  - Different branch (2.1.1): 40px ✓');
});
