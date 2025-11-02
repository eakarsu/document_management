const { test, expect } = require('@playwright/test');

test('Section indentation test - verify margin-left is correct', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@airforce.mil');
  await page.fill('input[name="password"]', '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Go to document
  await page.goto('http://localhost:3000/editor/cmgs9kp2w000dvpuu4uy07w7f');
  await page.waitForTimeout(3000);

  console.log('✅ Opened document editor');

  // Find and click on section "2.1" to position cursor
  const section21 = page.locator('h3:has-text("2.1")').first();
  await section21.click();
  await page.waitForTimeout(500);

  console.log('✅ Clicked on section 2.1');

  // Click the "+ Add Section" button
  const addSectionBtn = page.locator('button:has-text("+ Add Section")');
  await addSectionBtn.click();
  await page.waitForTimeout(500);

  console.log('✅ Clicked + Add Section button');

  // Type section title - find the "Section Title" input in the dialog
  const dialog = page.locator('[role="dialog"]');
  const titleInput = dialog.locator('input').last(); // The second input is the title
  await titleInput.fill('TEST INDENTATION');
  await page.waitForTimeout(300);

  // Click Insert button in the dialog
  const insertBtn = dialog.locator('button:has-text("Insert")');
  await insertBtn.click();
  await page.waitForTimeout(1000);

  console.log('✅ Inserted new section');

  // Find the newly created section (should be 2.1.1)
  const newSection = page.locator('h4:has-text("2.1.1 TEST INDENTATION")').first();

  // Check if it exists
  await expect(newSection).toBeVisible();
  console.log('✅ New section 2.1.1 is visible');

  // Get the computed style
  const marginLeft = await newSection.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.marginLeft;
  });

  console.log(`📊 Section 2.1.1 margin-left: ${marginLeft}`);

  // Verify margin-left is 40px (level 3: (3-1)*20 = 40px)
  expect(marginLeft).toBe('40px');

  console.log('✅ ✅ ✅ SUCCESS! Section has correct margin-left: 40px');

  // Test another level - click on the new section and add a child
  await newSection.click();
  await page.waitForTimeout(500);

  await addSectionBtn.click();
  await page.waitForTimeout(500);

  const titleInput2 = dialog.locator('input').last();
  await titleInput2.fill('DEEPER TEST');
  await page.waitForTimeout(300);

  const insertBtn2 = dialog.locator('button:has-text("Insert")');
  await insertBtn2.click();
  await page.waitForTimeout(1000);

  console.log('✅ Inserted deeper section');

  // Find the level 4 section (should be 2.1.1.1)
  const deeperSection = page.locator('h5:has-text("2.1.1.1 DEEPER TEST")').first();
  await expect(deeperSection).toBeVisible();

  const deeperMarginLeft = await deeperSection.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.marginLeft;
  });

  console.log(`📊 Section 2.1.1.1 margin-left: ${deeperMarginLeft}`);

  // Verify margin-left is 60px (level 4: (4-1)*20 = 60px)
  expect(deeperMarginLeft).toBe('60px');

  console.log('✅ ✅ ✅ SUCCESS! Deeper section has correct margin-left: 60px');

  // Test +Para button at the deepest section (2.1.1.1, level 4)
  await deeperSection.click();
  await page.waitForTimeout(500);

  const addParaBtn = page.locator('button:has-text("+ Para")');
  await addParaBtn.click();
  await page.waitForTimeout(1000);

  console.log('✅ Clicked + Para button at level 4 (section 2.1.1.1)');

  // Debug: List all paragraphs to see what was created
  const allParas = await page.locator('p strong').allTextContents();
  console.log('📊 All paragraph numbers found:', allParas);

  // Find the newly added paragraph (should be numbered 2.1.1.1.1.)
  const newPara = page.locator('p strong').filter({ hasText: /^2\.1\.1\.1\.1\.$/ }).locator('..').first();
  await expect(newPara).toBeVisible();
  console.log('✅ Found paragraph 2.1.1.1.1');

  const paraMarginLeft = await newPara.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.marginLeft;
  });

  console.log(`📊 Paragraph 2.1.1.1.1 margin-left: ${paraMarginLeft}`);
  // Para after 2.1.1.1 (level 4) should be indented like 2.1.1.1.1 content (80px = (5 levels - 1) * 20)
  expect(paraMarginLeft).toBe('80px');

  console.log('✅ ✅ ✅ SUCCESS! Paragraph has correct margin-left: 80px');
  console.log('🎉🎉🎉 ALL TESTS PASSED - INDENTATION FIX IS WORKING! 🎉🎉🎉');
});
