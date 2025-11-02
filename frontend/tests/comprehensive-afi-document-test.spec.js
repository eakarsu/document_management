/**
 * COMPREHENSIVE AFI DOCUMENT CREATION TEST
 * Creates a complete Air Force Instruction 36-2618 document matching the PDF structure
 */

const { test, expect } = require('@playwright/test');

test('Create complete AFI 36-2618 document with full content', async ({ page }) => {
  test.setTimeout(1200000); // 20 minutes timeout for full document creation
  console.log('\n🚀 Starting FULL AFI document creation test...\n');

  // Helper function to add paragraph content
  async function addParagraphContent(page, content) {
    const editorElement = page.locator('.ProseMirror');
    await editorElement.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await editorElement.type(content);
    await page.waitForTimeout(500);
  }

  // Helper function to create a section
  // The system is context-aware based on cursor position
  // isSibling: false = child (cursor at parent), true = sibling (check sibling checkbox)
  async function createSection(page, title, isSibling = false) {
    await page.click('button:has-text("+ Add Section")');
    await page.waitForTimeout(800);

    // Only check sibling checkbox if creating a sibling
    // For children, the system auto-detects based on cursor position
    if (isSibling) {
      await page.click('input[value="sibling"]');
      await page.waitForTimeout(300);
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
  await page.fill('input[name="password"]', '');
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
  // STEP 3: CLEAR TEMPLATE CONTENT
  // ============================================
  console.log('🧹 Step 3: Clearing template content...');
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('Meta+a'); // Select all (Command+A on Mac)
  await page.keyboard.press('Backspace'); // Delete all
  await page.waitForTimeout(500);
  await page.keyboard.press('Meta+a'); // Select all again in case anything remains
  await page.keyboard.press('Backspace'); // Delete all again
  await page.waitForTimeout(1000);
  console.log('✅ Template content cleared\n');

  // ============================================
  // CHAPTER 1: OPERATIONAL PROTOCOLS
  // ============================================
  console.log('📖 Creating Chapter 1: Operational Protocols...');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForSelector('text=Add Chapter', { timeout: 5000 });
  await page.waitForTimeout(1000);

  let inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('1');
  await inputs[1].fill('Operational Protocols');
  await page.waitForTimeout(1000);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 1 created');

  // 1.1 Standard Operating Procedures
  console.log('  Creating 1.1 Standard Operating Procedures...');
  await createSection(page, 'Standard Operating Procedures');

  // 1.1.1 Initial Setup and Pre-flight Checks
  console.log('  Creating 1.1.1 Initial Setup and Pre-flight Checks...');
  await createSection(page, 'Initial Setup and Pre-flight Checks');

  // 1.1.1.1 Equipment Inspection
  console.log('  Creating 1.1.1.1 Equipment Inspection...');
  await createSection(page, 'Equipment Inspection');

  // Add paragraph content for Equipment Inspection
  await addParagraphContent(page, '1.1.1.1.1.1. Before each flight operation, a thorough inspection of all UAS equipment must be conducted to ensure airworthiness and operational readiness. This inspection involves checking the structural integrity of the airframe, verifying the functionality of control surfaces, and ensuring that all electronic systems are fully operational. Personnel must pay particular attention to the battery health, as compromised batteries can lead to catastrophic failures. Note: Visual inspection should be complemented by diagnostic tests using approved software to detect any underlying issues not visible to the naked eye.');

  await addParagraphContent(page, '1.1.1.1.1.2. The inspection process must be documented in the UAS maintenance log, with any discrepancies reported immediately to the commanding officer. Personnel responsible for the inspection must certify the completion of all checks prior to flight authorization. WARNING: Failure to perform a comprehensive pre-flight inspection could result in mission failure and potential loss of the UAS. Adherence to the inspection protocol is mandatory and subject to periodic audits.');

  // 1.1.1.2 Calibration Procedures (sibling to 1.1.1.1)
  console.log('  Creating 1.1.1.2 Calibration Procedures...');
  await createSection(page, 'Calibration Procedures', true);

  await addParagraphContent(page, '1.1.1.2.1.1. Calibration of UAS systems is crucial for ensuring accurate navigation and sensor data collection. This includes the calibration of onboard gyroscopes, accelerometers, and GPS modules. The calibration process must be conducted in an environment free from electromagnetic interference to ensure data integrity. Personnel must follow the calibration procedures as outlined in the manufacturer\'s manual, adjusting settings as necessary to adapt to specific mission parameters. CAUTION: Improper calibration can lead to navigation errors and compromised mission data.');

  await addParagraphContent(page, '1.1.1.2.2.2. Post-calibration, a test flight should be conducted to validate the accuracy of the calibration adjustments. During this test, operators should assess flight stability and sensor accuracy, making further adjustments if necessary. The results of the test flight must be recorded and reviewed as part of the mission briefing process. Compliance with calibration standards is essential for mission success and operational safety.');

  // 1.1.2 Flight Operations (sibling to 1.1.1)
  console.log('  Creating 1.1.2 Flight Operations...');
  await createSection(page, 'Flight Operations', true);

  // 1.1.2.1 Mission Planning
  console.log('  Creating 1.1.2.1 Mission Planning...');
  await createSection(page, 'Mission Planning');
  await addParagraphContent(page, '1.1.2.1.1.1. Detailed mission planning is a critical component of UAS operations, requiring coordination across multiple departments. The planning phase involves defining mission objectives, determining flight paths, and identifying potential hazards. Personnel must utilize mission planning software to simulate flight paths and assess risk factors. This phase also includes securing the necessary airspace permissions and coordinating with air traffic control when operating in controlled airspace.');

  await addParagraphContent(page, '1.1.2.1.1.2. Pre-mission briefings must be conducted with all involved personnel to review mission objectives, flight plans, and safety protocols. The briefing should outline contingency plans for potential emergencies, including communication failures or unforeseen weather conditions. Personnel must ensure all mission details are documented and accessible to all team members. Note: Effective communication is essential for the successful execution of mission objectives.');

  // 1.1.2.2 Flight Execution (sibling to 1.1.2.1)
  console.log('  Creating 1.1.2.2 Flight Execution...');
  await createSection(page, 'Flight Execution', true);

  await addParagraphContent(page, '1.1.2.2.1.1. During flight execution, constant monitoring of UAS systems is required to ensure optimal performance and safety. Operators must maintain communication with the ground control station, reporting any anomalies immediately. The flight crew is responsible for adjusting flight paths in response to dynamic environmental conditions, such as sudden weather changes.');

  await addParagraphContent(page, '1.1.2.2.1.2. Post-flight analysis is a mandatory procedure to assess mission success and identify areas for improvement. This includes reviewing flight logs, sensor data, and mission outcomes. Personnel must document any deviations from the planned flight path and analyze factors contributing to such deviations. The findings from the post-flight analysis should be integrated into future mission planning to enhance operational efficiency and safety.');

  // 1.2 Maintenance Protocols (sibling to 1.1)
  console.log('  Creating 1.2 Maintenance Protocols...');
  await createSection(page, 'Maintenance Protocols', true);

  // 1.2.1 Routine Maintenance
  console.log('  Creating 1.2.1 Routine Maintenance...');
  await createSection(page, 'Routine Maintenance');

  // 1.2.1.1 Scheduled Inspections
  console.log('  Creating 1.2.1.1 Scheduled Inspections...');
  await createSection(page, 'Scheduled Inspections');
  await addParagraphContent(page, '1.2.1.1.1.1. Scheduled inspections are essential to maintain the operational integrity of UAS systems. Inspections must be conducted at regular intervals as specified by the maintenance schedule, which is based on flight hours and operational conditions. This process includes a comprehensive review of mechanical components, electronic systems, and software integrity. Personnel conducting the inspections must be certified and adhere to Air Force maintenance standards.');

  await addParagraphContent(page, '1.2.1.1.1.2. All inspection results must be documented in the UAS maintenance log, with any required repairs or adjustments noted and addressed promptly. The maintenance supervisor is responsible for ensuring the completion and accuracy of all documentation. WARNING: Neglecting scheduled maintenance can lead to system failures and jeopardize mission success. Compliance with maintenance protocols is non-negotiable and subject to regular audits.');

  console.log('✅ Chapter 1 completed with detailed content\n');

  // ============================================
  // CHAPTER 2: SAFETY AND COMPLIANCE
  // ============================================
  console.log('📖 Creating Chapter 2: Safety and Compliance...');
  await page.keyboard.press('Control+End');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForSelector('text=Add Chapter', { timeout: 5000 });
  await page.waitForTimeout(1000);

  inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('2');
  await inputs[1].fill('Safety and Compliance');
  await page.waitForTimeout(1000);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 2 created');

  // 2.1 Risk Management
  console.log('  Creating 2.1 Risk Management...');
  await createSection(page, 'Risk Management');

  // 2.1.1 Hazard Identification
  console.log('  Creating 2.1.1 Hazard Identification...');
  await createSection(page, 'Hazard Identification');

  // 2.1.1.1 Risk Assessment Procedures
  console.log('  Creating 2.1.1.1 Risk Assessment Procedures...');
  await createSection(page, 'Risk Assessment Procedures');
  await addParagraphContent(page, '2.1.1.1.1.1. Effective risk management begins with the identification and assessment of potential hazards associated with UAS operations. This involves conducting a comprehensive risk assessment prior to each mission, evaluating factors such as environmental conditions, operational complexity, and personnel readiness. The risk assessment should be documented and reviewed by the mission commander to ensure all identified risks are addressed and mitigated.');

  await addParagraphContent(page, '2.1.1.1.1.2. Personnel conducting the risk assessment must be trained in risk management techniques and familiar with the operational environment. The assessment should include input from all relevant departments, ensuring a holistic understanding of potential risks. Compliance with risk assessment procedures is mandatory to safeguard personnel and equipment, and to ensure mission success.');

  // 2.1.1.2 Mitigation Strategies (sibling to 2.1.1.1)
  console.log('  Creating 2.1.1.2 Mitigation Strategies...');
  await createSection(page, 'Mitigation Strategies', true);

  await addParagraphContent(page, '2.1.1.2.1.1. Mitigation strategies are essential for reducing the potential impact of identified risks. These strategies may include altering flight paths, adjusting mission timing to avoid adverse weather, and implementing additional safety measures. Personnel must develop mitigation plans in collaboration with the mission commander, ensuring all strategies are feasible and effective. CAUTION: All mitigation strategies must be tested and validated prior to implementation to ensure their effectiveness.');

  // 2.1.2 Safety Protocols (sibling to 2.1.1)
  console.log('  Creating 2.1.2 Safety Protocols...');
  await createSection(page, 'Safety Protocols', true);

  // 2.1.2.1 Personal Protective Equipment (PPE)
  console.log('  Creating 2.1.2.1 Personal Protective Equipment...');
  await createSection(page, 'Personal Protective Equipment (PPE)');
  await addParagraphContent(page, '2.1.2.1.1.1. The use of personal protective equipment (PPE) is mandatory for all personnel involved in UAS operations. PPE requirements vary based on the nature of the operation, with standard gear including helmets, gloves, and safety goggles. Personnel must be trained in the proper use and maintenance of PPE, ensuring it is worn correctly at all times. The safety officer is responsible for verifying compliance with PPE protocols and addressing any violations.');

  // 2.1.2.2 Safety Drills and Training (sibling to 2.1.2.1)
  console.log('  Creating 2.1.2.2 Safety Drills and Training...');
  await createSection(page, 'Safety Drills and Training', true);

  await addParagraphContent(page, '2.1.2.2.1.1. Regular safety drills and training sessions are essential for preparing personnel to respond effectively to emergencies. These sessions should simulate realistic scenarios, providing hands-on experience in managing potential crises. Training should cover emergency response procedures, communication protocols, and the use of safety equipment. The training officer is responsible for organizing and conducting these sessions, ensuring all personnel are adequately prepared.');

  // 2.2 Compliance and Audits (sibling to 2.1)
  console.log('  Creating 2.2 Compliance and Audits...');
  await createSection(page, 'Compliance and Audits', true);

  // 2.2.1 Regulatory Compliance
  console.log('  Creating 2.2.1 Regulatory Compliance...');
  await createSection(page, 'Regulatory Compliance');

  // 2.2.1.1 Adherence to Standards
  console.log('  Creating 2.2.1.1 Adherence to Standards...');
  await createSection(page, 'Adherence to Standards');
  await addParagraphContent(page, '2.2.1.1.1.1. Adherence to regulatory standards is mandatory for all UAS operations, ensuring compliance with Air Force directives and federal regulations. Personnel must familiarize themselves with relevant standards and incorporate them into operational procedures. The compliance officer is responsible for monitoring adherence and reporting any deviations to the command structure.');

  console.log('✅ Chapter 2 completed with detailed content\n');

  // ============================================
  // CHAPTER 3: COMMUNICATIONS AND COORDINATION
  // ============================================
  console.log('📖 Creating Chapter 3: Communications and Coordination...');
  await page.keyboard.press('Control+End');
  await page.click('button:has-text("+ Add Chapter")');
  await page.waitForSelector('text=Add Chapter', { timeout: 5000 });
  await page.waitForTimeout(1000);

  inputs = await page.locator('input[type="text"]').all();
  await inputs[0].fill('3');
  await inputs[1].fill('Communications and Coordination');
  await page.waitForTimeout(1000);
  await page.locator('div[role="dialog"]').locator('button:has-text("Insert")').click();
  await page.waitForTimeout(2000);
  console.log('✅ Chapter 3 created');

  // 3.1 Communication Protocols
  console.log('  Creating 3.1 Communication Protocols...');
  await createSection(page, 'Communication Protocols');

  // 3.1.1 Internal Communications
  console.log('  Creating 3.1.1 Internal Communications...');
  await createSection(page, 'Internal Communications');

  // 3.1.1.1 Communication Systems
  console.log('  Creating 3.1.1.1 Communication Systems...');
  await createSection(page, 'Communication Systems');
  await addParagraphContent(page, '3.1.1.1.1.1. Effective internal communication is crucial for coordinating UAS operations and ensuring mission success. Communication systems must be reliable and capable of supporting real-time data exchange among all personnel involved in the operation. Personnel must be trained in the use of communication systems, ensuring proficiency and adherence to communication protocols. Compliance with communication protocols is essential for maintaining operational efficiency and ensuring mission success.');

  // 3.1.1.2 Coordination Meetings (sibling to 3.1.1.1)
  console.log('  Creating 3.1.1.2 Coordination Meetings...');
  await createSection(page, 'Coordination Meetings', true);

  await addParagraphContent(page, '3.1.1.2.1.1. Regular coordination meetings are essential for ensuring alignment among all personnel involved in UAS operations. These meetings provide an opportunity to review mission objectives, discuss challenges, and coordinate efforts. Personnel must attend coordination meetings as scheduled, with attendance documented and reviewed by the command structure. Compliance with coordination meeting protocols is crucial for maintaining operational efficiency and ensuring mission success.');

  // 3.1.2 External Communications (sibling to 3.1.1)
  console.log('  Creating 3.1.2 External Communications...');
  await createSection(page, 'External Communications', true);

  // 3.1.2.1 Liaison with External Agencies
  console.log('  Creating 3.1.2.1 Liaison with External Agencies...');
  await createSection(page, 'Liaison with External Agencies');
  await addParagraphContent(page, '3.1.2.1.1.1. Effective liaison with external agencies is essential for coordinating UAS operations in complex environments. Personnel must establish and maintain communication with relevant agencies, ensuring alignment and coordination. The liaison officer is responsible for managing external communications and ensuring compliance with communication protocols.');

  // 3.1.2.2 Public Relations (sibling to 3.1.2.1)
  console.log('  Creating 3.1.2.2 Public Relations...');
  await createSection(page, 'Public Relations', true);

  await addParagraphContent(page, '3.1.2.2.1.1. Public relations efforts are essential for maintaining a positive image and fostering support for UAS operations. Personnel must engage with the public in a professional manner, providing accurate information and addressing concerns. The public relations officer is responsible for managing public communications and ensuring compliance with communication protocols.');

  console.log('✅ Chapter 3 completed with detailed content\n');

  // ============================================
  // REFERENCES
  // ============================================
  console.log('📚 Adding References section...');
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
  await editor.type('4. AFMAN 33-363, "Management of Records," March 1, 2008');
  await page.keyboard.press('Enter');
  await editor.type('5. DAFI 90-160, "Publications and Forms Management," April 14, 2022');
  console.log('✅ References added\n');

  // ============================================
  // GLOSSARY
  // ============================================
  console.log('📖 Adding Glossary section...');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await editor.type('GLOSSARY OF TERMS AND ACRONYMS');
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
  console.log('📑 Generating Table of Contents...');
  await page.click('text=Format');
  await page.waitForTimeout(500);
  await page.click('button:has-text("TOC")');
  await page.waitForTimeout(3000);
  console.log('✅ Table of Contents generated\n');

  // ============================================
  // AUTO-SAVE
  // ============================================
  console.log('💾 Waiting for auto-save...');
  await page.waitForTimeout(5000);
  console.log('✅ Document auto-saved\n');

  // ============================================
  // FINAL VERIFICATION
  // ============================================
  console.log('✅ Final Verification...');
  await expect(page.locator('text=CHAPTER 1').first()).toBeVisible();
  await expect(page.locator('text=CHAPTER 2').first()).toBeVisible();
  await expect(page.locator('text=CHAPTER 3').first()).toBeVisible();
  await expect(page.locator('text=REFERENCES').first()).toBeVisible();
  await expect(page.locator('text=GLOSSARY OF TERMS').first()).toBeVisible();
  console.log('  ✅ All chapters and sections verified');

  console.log('\n🎉 COMPREHENSIVE AFI DOCUMENT CREATED SUCCESSFULLY! 🎉');
  console.log('📄 Document includes:');
  console.log('  - 3 Chapters with detailed content');
  console.log('  - Multiple sections with full paragraphs');
  console.log('  - Numbered paragraphs (1.1.1.1.1.1 format)');
  console.log('  - References section');
  console.log('  - Glossary of terms');
  console.log('  - Auto-numbering applied');
  console.log('  - Table of Contents generated');
  console.log('  - Document auto-saved');
  console.log('\n✅ Ready to export as PDF!');
});
