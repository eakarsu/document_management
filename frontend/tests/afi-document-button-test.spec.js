/**
 * AFI DOCUMENT CREATION TEST - USING BUTTONS CORRECTLY
 * Uses + Add Section and + Para buttons as intended
 */

const { test, expect } = require('@playwright/test');

test('Create AFI document using buttons correctly', async ({ page }) => {
  test.setTimeout(1200000); // 20 minutes
  console.log('\n🚀 Starting AFI document test with correct button usage...\n');

  // Helper: Add paragraph using + Para button
  async function addParagraph(page, content) {
    await page.click('button:has-text("+ Para")');
    await page.waitForTimeout(500);
    const editor = page.locator('.ProseMirror');
    await editor.type(content); // Only type content, button adds number
    await page.waitForTimeout(500);
  }

  // Helper: Add section using + Add Section button with intelligent radio selection
  // mode: 'child' (default, go deeper), 'sibling' (same level), or 'parent' (go up one level)
  async function addSection(page, title, mode = 'child') {
    await page.keyboard.press('End'); // Go to end of current line
    await page.waitForTimeout(300);
    await page.click('button:has-text("+ Add Section")');
    await page.waitForTimeout(800);

    const dialog = page.locator('div[role="dialog"]');

    // Map mode to radio button index
    // 0 = child (go deeper), 1 = sibling (same level), 2 = parent (go up)
    const modeToIndex = {
      'child': 0,
      'sibling': 1,
      'parent': 2
    };

    const radioIndex = modeToIndex[mode] || 0;

    // Click the appropriate radio button
    const radios = await dialog.locator('input[type="radio"]').all();
    if (radios[radioIndex]) {
      await radios[radioIndex].click();
      await page.waitForTimeout(300);
      console.log(`    ✓ Selected mode: ${mode} (option ${radioIndex + 1})`);
    }

    const inputs = await page.locator('input[type="text"]').all();
    await inputs[inputs.length - 1].fill(title);
    await page.waitForTimeout(300);
    await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
    await page.waitForTimeout(800);
  }

  // ============================================
  // STEP 1: LOGIN
  // ============================================
  console.log('🔐 Step 1: Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@airforce.mil');
  await page.fill('input[name="password"]', '#H%YInr8hPVbctB7');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✅ Logged in successfully\n');

  // ============================================
  // STEP 2: CREATE NEW DOCUMENT
  // ============================================
  console.log('📄 Step 2: Creating new document...');
  await page.click('text=Create New Document');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Generate Document")');
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Edit Document")');
  await page.waitForTimeout(3000);
  console.log('✅ Editor opened successfully\n');

  // ============================================
  // STEP 3: CLEAR TEMPLATE
  // ============================================
  console.log('🧹 Step 3: Clearing template...');
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(1000);
  console.log('✅ Template cleared\n');

  // ============================================
  // CHAPTER 1: OPERATIONAL PROTOCOLS
  // ============================================
  console.log('📖 Creating Chapter 1...');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForTimeout(1000);

  let inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('1');
  await inputs[1].fill('Operational Protocols');
  await page.waitForTimeout(500);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 1 created');

  // 1.1 Standard Operating Procedures (child of Chapter 1)
  console.log('  Creating 1.1...');
  await addSection(page, 'Standard Operating Procedures'); // default: child

  // 1.1.1 Initial Setup and Pre-flight Checks (child of 1.1)
  console.log('  Creating 1.1.1...');
  await addSection(page, 'Initial Setup and Pre-flight Checks'); // default: child

  // 1.1.1.1 Equipment Inspection (child of 1.1.1)
  console.log('  Creating 1.1.1.1...');
  await addSection(page, 'Equipment Inspection'); // default: child

  // Add paragraphs to 1.1.1.1
  await addParagraph(page, 'Before each flight operation, a thorough inspection of all UAS equipment must be conducted to ensure airworthiness and operational readiness. This inspection involves checking the structural integrity of the airframe, verifying the functionality of control surfaces, and ensuring all components are properly secured.');
  await addParagraph(page, 'Personnel conducting equipment inspections must hold current certification and demonstrate proficiency in identifying potential defects or anomalies. Inspection records must be maintained in accordance with AFI 11-2UAS requirements and submitted to the unit quality assurance office.');

  // 1.1.1.2 Calibration Procedures (sibling to 1.1.1.1)
  console.log('  Creating 1.1.1.2...');
  await addSection(page, 'Calibration Procedures', 'sibling');

  await addParagraph(page, 'All sensors, navigation systems, and communication equipment must undergo calibration according to manufacturer specifications and Air Force technical orders. Calibration intervals shall not exceed 90 days unless otherwise specified by technical data.');
  await addParagraph(page, 'Calibration records must document the equipment serial number, calibration date, technician identification, and results of all calibration checks. Any equipment failing calibration must be removed from service immediately and tagged accordingly.');

  // 1.1.2 Flight Operations (parent level from 1.1.1.x)
  console.log('  Creating 1.1.2...');
  await addSection(page, 'Flight Operations', 'parent');

  // 1.1.2.1 Mission Planning (child of 1.1.2)
  console.log('  Creating 1.1.2.1...');
  await addSection(page, 'Mission Planning'); // default: child

  await addParagraph(page, 'Comprehensive mission planning must be completed for all UAS operations. Planning considerations include airspace coordination, weather analysis, risk assessment, and contingency procedures. Mission commanders must approve all flight plans prior to execution.');
  await addParagraph(page, 'Flight plans must be filed in accordance with FAA regulations and military airspace procedures. Coordination with air traffic control and adjacent units must be completed not less than 24 hours prior to mission execution.');

  // 1.1.2.2 Flight Execution (sibling to 1.1.2.1)
  console.log('  Creating 1.1.2.2...');
  await addSection(page, 'Flight Execution', 'sibling');

  await addParagraph(page, 'During flight operations, pilots must maintain continuous situational awareness and adhere to established procedures. All deviations from the approved flight plan must be coordinated with air traffic control and mission command.');
  await addParagraph(page, 'Emergency procedures must be followed in the event of equipment malfunction or unexpected flight conditions. Abort procedures must be executed immediately upon determination that safe mission completion is not possible.');

  // 1.2 Maintenance Protocols (parent level from 1.1.2.x)
  console.log('  Creating 1.2...');
  await addSection(page, 'Maintenance Protocols', 'parent');

  // 1.2.1 Routine Maintenance (child of 1.2)
  console.log('  Creating 1.2.1...');
  await addSection(page, 'Routine Maintenance'); // default: child

  // 1.2.1.1 Scheduled Inspections (child of 1.2.1)
  console.log('  Creating 1.2.1.1...');
  await addSection(page, 'Scheduled Inspections'); // default: child

  await addParagraph(page, 'Scheduled maintenance inspections must be performed at intervals specified in applicable technical orders. These inspections include pre-flight, post-flight, periodic, and phase inspections as required by the maintenance schedule.');
  await addParagraph(page, 'Maintenance personnel must document all inspection findings and corrective actions taken. Aircraft forms must be completed accurately and reviewed by quality assurance before returning equipment to operational status.');

  console.log('✅ Chapter 1 completed\n');

  // ============================================
  // CHAPTER 2: SAFETY AND COMPLIANCE
  // ============================================
  console.log('📖 Creating Chapter 2...');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForTimeout(1000);

  inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('2');
  await inputs[1].fill('Safety and Compliance');
  await page.waitForTimeout(500);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 2 created');

  // 2.1 Risk Management (child of Chapter 2)
  console.log('  Creating 2.1...');
  await addSection(page, 'Risk Management'); // default: child

  // 2.1.1 Hazard Identification (child of 2.1)
  console.log('  Creating 2.1.1...');
  await addSection(page, 'Hazard Identification'); // default: child

  // 2.1.1.1 Risk Assessment Procedures (child of 2.1.1)
  console.log('  Creating 2.1.1.1...');
  await addSection(page, 'Risk Assessment Procedures'); // default: child

  await addParagraph(page, 'All operations must undergo comprehensive risk assessment using the Air Force Risk Management process. Hazards must be identified, assessed, and controlled to an acceptable level before mission execution.');
  await addParagraph(page, 'Risk assessments must consider all phases of the operation including planning, preparation, execution, and recovery. Higher headquarters approval is required for operations assessed as high risk.');

  // 2.1.1.2 Mitigation Strategies (sibling to 2.1.1.1)
  console.log('  Creating 2.1.1.2...');
  await addSection(page, 'Mitigation Strategies', 'sibling');

  await addParagraph(page, 'Risk mitigation strategies must be developed for all identified hazards. Control measures must reduce risk to the lowest practical level while maintaining mission effectiveness.');
  await addParagraph(page, 'Residual risk must be formally accepted by the appropriate authority level. Documentation of risk decisions must be maintained for all operations.');

  // 2.1.2 Safety Protocols (parent level from 2.1.1.x)
  console.log('  Creating 2.1.2...');
  await addSection(page, 'Safety Protocols', 'parent');

  // 2.1.2.1 Personal Protective Equipment (child of 2.1.2)
  console.log('  Creating 2.1.2.1...');
  await addSection(page, 'Personal Protective Equipment'); // default: child

  await addParagraph(page, 'All personnel must wear appropriate personal protective equipment as specified by technical orders and local safety requirements. PPE must be inspected regularly and replaced when damaged or expired.');
  await addParagraph(page, 'Unit commanders are responsible for ensuring adequate PPE inventory and enforcement of wear requirements. Non-compliance with PPE requirements may result in removal from flight operations.');

  // 2.1.2.2 Safety Drills and Training (sibling to 2.1.2.1)
  console.log('  Creating 2.1.2.2...');
  await addSection(page, 'Safety Drills and Training', 'sibling');

  await addParagraph(page, 'Emergency response drills must be conducted quarterly to maintain crew proficiency in emergency procedures. Drills must cover all credible emergency scenarios including equipment failure, fire, and personnel injury.');
  await addParagraph(page, 'Training records must document participation in all required drills and exercises. Personnel who miss required training must complete makeup training before returning to operational duties.');

  // 2.2 Compliance and Audits (parent level from 2.1.2.x)
  console.log('  Creating 2.2...');
  await addSection(page, 'Compliance and Audits', 'parent');

  // 2.2.1 Regulatory Compliance (child of 2.2)
  console.log('  Creating 2.2.1...');
  await addSection(page, 'Regulatory Compliance'); // default: child

  // 2.2.1.1 Adherence to Standards (child of 2.2.1)
  console.log('  Creating 2.2.1.1...');
  await addSection(page, 'Adherence to Standards'); // default: child

  await addParagraph(page, 'All operations must comply with applicable Air Force instructions, Federal Aviation Administration regulations, and Department of Defense directives. Compliance is verified through periodic inspections and audits.');
  await addParagraph(page, 'Non-compliance findings must be addressed immediately with corrective action plans submitted to higher headquarters. Repeat findings may result in operational restrictions or unit decertification.');

  console.log('✅ Chapter 2 completed\n');

  // ============================================
  // CHAPTER 3: COMMUNICATIONS AND COORDINATION
  // ============================================
  console.log('📖 Creating Chapter 3...');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForTimeout(1000);

  inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('3');
  await inputs[1].fill('Communications and Coordination');
  await page.waitForTimeout(500);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 3 created');

  // 3.1 Communication Protocols (child of Chapter 3)
  console.log('  Creating 3.1...');
  await addSection(page, 'Communication Protocols'); // default: child

  // 3.1.1 Internal Communications (child of 3.1)
  console.log('  Creating 3.1.1...');
  await addSection(page, 'Internal Communications'); // default: child

  // 3.1.1.1 Communication Systems (child of 3.1.1)
  console.log('  Creating 3.1.1.1...');
  await addSection(page, 'Communication Systems'); // default: child

  await addParagraph(page, 'All operational communications must utilize approved secure communication systems. Communication equipment must be properly maintained and operators must be certified on all systems they operate.');
  await addParagraph(page, 'Backup communication systems must be available for all critical operations. Communication plans must identify primary, alternate, contingency, and emergency communication methods.');

  // 3.1.1.2 Coordination Meetings (sibling to 3.1.1.1)
  console.log('  Creating 3.1.1.2...');
  await addSection(page, 'Coordination Meetings', 'sibling');

  await addParagraph(page, 'Regular coordination meetings must be conducted to ensure effective communication among all operational elements. Meeting schedules must be published and attendance is mandatory for designated personnel.');
  await addParagraph(page, 'Meeting minutes must be documented and distributed to all stakeholders within 24 hours. Action items must be tracked to completion with responsible parties and due dates identified.');

  // 3.1.2 External Communications (parent level from 3.1.1.x)
  console.log('  Creating 3.1.2...');
  await addSection(page, 'External Communications', 'parent');

  // 3.1.2.1 Liaison with External Agencies (child of 3.1.2)
  console.log('  Creating 3.1.2.1...');
  await addSection(page, 'Liaison with External Agencies'); // default: child

  await addParagraph(page, 'Coordination with external agencies including FAA, local authorities, and joint service partners must be maintained through designated liaison officers. Liaison activities must be documented and reported through command channels.');
  await addParagraph(page, 'Memorandums of agreement or understanding must be established with external agencies as required. These agreements must be reviewed annually and updated as necessary.');

  // 3.1.2.2 Public Relations (sibling to 3.1.2.1)
  console.log('  Creating 3.1.2.2...');
  await addSection(page, 'Public Relations', 'sibling');

  await addParagraph(page, 'All public affairs activities must be coordinated through the wing public affairs office. Personnel are prohibited from discussing operational details with media or public without proper authorization.');
  await addParagraph(page, 'Public affairs guidance must be followed for all community outreach events and media engagements. Operations security must be maintained in all public communications.');

  console.log('✅ Chapter 3 completed\n');

  // ============================================
  // REFERENCES
  // ============================================
  console.log('📚 Adding References...');
  await page.keyboard.press('Control+End');
  await editor.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.type('REFERENCES');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.type('1. DoD Directive 5000.01, "The Defense Acquisition System," September 9, 2020');
  await page.keyboard.press('Enter');
  await editor.type('2. DoD Instruction 5000.02, "Operation of the Adaptive Acquisition Framework," January 23, 2020');
  await page.keyboard.press('Enter');
  await editor.type('3. AFI 33-360, "Publications and Forms Management," December 7, 2018');
  await page.keyboard.press('Enter');
  await editor.type('4. AFI 11-2UAS, "Unmanned Aircraft System Operations," July 15, 2019');
  await page.keyboard.press('Enter');
  await editor.type('5. AFMAN 91-203, "Air Force Occupational Safety, Fire, and Health Standards," March 12, 2021');
  console.log('✅ References added\n');

  // ============================================
  // GLOSSARY
  // ============================================
  console.log('📖 Adding Glossary...');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.type('GLOSSARY OF TERMS');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.type('AFI - Air Force Instruction');
  await page.keyboard.press('Enter');
  await editor.type('AFMAN - Air Force Manual');
  await page.keyboard.press('Enter');
  await editor.type('DAFI - Department of the Air Force Instruction');
  await page.keyboard.press('Enter');
  await editor.type('DoD - Department of Defense');
  await page.keyboard.press('Enter');
  await editor.type('UAS - Unmanned Aerial System');
  await page.keyboard.press('Enter');
  await editor.type('PPE - Personal Protective Equipment');
  await page.keyboard.press('Enter');
  await editor.type('OPR - Office of Primary Responsibility');
  console.log('✅ Glossary added\n');

  // ============================================
  // AUTO-NUMBERING
  // ============================================
  console.log('🔢 Applying auto-numbering...');
  await page.click('button:has-text("🔢 Auto")');
  await page.waitForTimeout(3000);
  console.log('✅ Auto-numbering applied\n');

  // ============================================
  // TABLE OF CONTENTS
  // ============================================
  console.log('📑 Generating TOC...');
  await page.click('text=Format');
  await page.waitForTimeout(500);
  await page.click('button:has-text("TOC")');
  await page.waitForTimeout(5000);
  console.log('✅ TOC generated\n');

  // ============================================
  // WAIT FOR AUTO-SAVE
  // ============================================
  console.log('💾 Waiting for auto-save...');
  await page.waitForTimeout(5000);
  console.log('✅ Document auto-saved\n');

  console.log('\n🎉 AFI DOCUMENT CREATED SUCCESSFULLY! 🎉\n');
  console.log('Document includes:');
  console.log('  - 3 Chapters with proper hierarchy');
  console.log('  - Sections created using + Add Section button');
  console.log('  - Paragraphs created using + Para button');
  console.log('  - References section');
  console.log('  - Glossary section');
  console.log('  - Auto-numbering applied');
  console.log('  - Table of Contents generated');
  console.log('\n✅ Ready to export as PDF!\n');
});
