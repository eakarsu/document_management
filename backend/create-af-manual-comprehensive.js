const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAFManualWithFeedback() {
  console.log('=== CREATING AIR FORCE TECHNICAL MANUAL WITH COMPREHENSIVE FEEDBACK ===\n');
  
  const documentId = 'doc_af_manual_' + Date.now().toString(36);
  
  // 4-page Air Force Technical Manual with intentional issues for feedback
  const documentContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <div class="header-info">
      <p>TO 1F-16C-1</p>
      <p>USAF SERIES</p>
      <p>F-16C/D BLOCKS 25, 30, 32</p>
    </div>
    
    <h1>AIR FORCE TECHNICAL MANUAL</h1>
    <p class="subtitle">FLIGHT MANUAL</p>
    <p class="subtitle">USAF SERIES F-16C/D AIRCRAFT</p>
    
    <h2>SECTION I - INTRODUCTION</h2>
    
    <h3>PURPOSE AND SCOPE</h3>
    <p>It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.</p>
    
    <p>Due to the fact that the F-16 is a highly sophisticated fly-by-wire aircraft with advanced avionics systems, it is absolutely essential that all personnel who are involved in the operation, maintenance, or support of these aircraft must thoroughly familiarize themselves with the contents of this manual and must ensure that they have a complete understanding of all procedures before attempting to perform any operations.</p>
    
    <h3>SAFETY CONSIDERATIONS</h3>
    <p>At this point in time, the Air Force has determined through extensive analysis and operational experience that strict adherence to all published procedures and limitations is mandatory for safe operation of the aircraft and that any deviations from these procedures without proper authorization could potentially result in catastrophic consequences.</p>
    
    <p>In the event that an emergency situation develops during flight operations, the pilot should immediately refer to the appropriate emergency procedures section of this manual and should follow all prescribed steps in the exact sequence specified unless the specific nature of the emergency requires deviation from standard procedures in order to ensure the safety of the aircraft and crew.</p>
  </div>
  
  <div class="page" data-page="2">
    <h2>SECTION II - AIRCRAFT SYSTEMS</h2>
    
    <h3>FLIGHT CONTROL SYSTEM</h3>
    <p>The F-16 flight control system consists of a quadruplex digital fly-by-wire system that provides the pilot with excellent handling qualities throughout the entire flight envelope. The system automaticaly compensates for various flight conditions and provides enhanced stability and control.</p>
    
    <p>It should be noted that the flight control computer continuously monitors all system parameters and automatically reconfigures itself in the event of a failure, thereby providing multiple levels of redundancy which ensures that the aircraft remains controllable even in the event of multiple system failures, although handling qualities may be degraded depending on the specific nature and extent of the failures.</p>
    
    <h3>ENGINE SYSTEM</h3>
    <p>The aircraft is powered by a single F100-PW-220 or F110-GE-100 turbofan engine, depending on the specific variant. Maximum thrust ratings vary between models but typicaly range from 23,000 to 29,000 pounds of thrust with afterburner engaged.</p>
    
    <p>For the purpose of ensuring optimal engine performance and longevity, it is critically important that all pilots strictly adhere to the published throttle movement restrictions and temperature limitations, particularly during engine start, taxi, takeoff, and climb phases of flight where rapid throttle movements or exceeding temperature limits could result in compressor stalls, engine damage, or complete engine failure.</p>
    
    <h3>AVIONICS SYSTEMS</h3>
    <p>The avionics suite includes the AN/APG-68 radar system, which provides air-to-air and air-to-ground targeting capabilities. The system is capable of tracking multiple targets simultaneosly and provides the pilot with comprehensive tactical information.</p>
    
    <p>Due to the complexity and sophistication of the avionics systems installed in the F-16, it is absolutely essential that all pilots receive comprehensive training on the operation of these systems and that they maintain proficiency through regular practice and continuation training in order to ensure that they can effectively employ the full capabilities of the aircraft in combat situations.</p>
  </div>
  
  <div class="page" data-page="3">
    <h2>SECTION III - OPERATING PROCEDURES</h2>
    
    <h3>PREFLIGHT INSPECTION</h3>
    <p>Prior to each flight, a thorough preflight inspection must be conducted in accordance with the checklist provided in this manual. The inspection should include a complete walkaround of the aircraft to verify that all panels are secured, no visible damage exists, and all required equipment is properly installed.</p>
    
    <p>It is important to remember that the preflight inspection is the pilot's last opportunity to identify any discrepancies or potential problems before flight, and therefore it should never be rushed or abbreviated regardless of operational pressures or time constraints that may exist, as failure to identify a problem during preflight could lead to an in-flight emergency.</p>
    
    <h3>ENGINE START PROCEDURES</h3>
    <p>The engine start sequence must be performed exactly as specified in the checklist. Any deviation from the prescribed sequence may result in a hot start, hung start, or other malfuntion that could damage the engine.</p>
    
    <p>In order to prevent damage to the engine during the start sequence, it is absolutely critical that the pilot monitors all engine parameters continuously throughout the start process and is prepared to immediately abort the start if any parameter exceeds limits or if any abnormal indications are observed, following which the appropriate abnormal procedures should be executed.</p>
    
    <h3>TAXI AND TAKEOFF</h3>
    <p>During taxi operations, the pilot should maintain a speed of no more than 25 knots on straight sections and should reduce speed to 10 knots or less when making turns in order to prevent tire damage and maintain directional control of the aircraft.</p>
    
    <p>The takeoff procedure requires that the pilot advances the throttle smoothly to military power, checks all engine parameters, releases brakes, and then advances to maximum afterburner if required, while simultaneously monitoring airspeed, engine parameters, and flight control responses to ensure that all systems are functioning normally before committing to flight.</p>
  </div>
  
  <div class="page" data-page="4">
    <h2>SECTION IV - EMERGENCY PROCEDURES</h2>
    
    <h3>ENGINE FAILURE</h3>
    <p>In the event of a complete engine failure, the pilot should immediately establish the best glide speed of 200 KIAS, turn toward the nearest suitable landing field, and attempt an engine restart if altitude and time permit.</p>
    
    <p>It should be understood that the F-16 has limited glide capability due to its design characteristics, and therefore the pilot must be prepared to execute an immediate ejection if it becomes apparent that a safe landing cannot be accomplished, with the decision to eject being made no later than 2,000 feet AGL in order to ensure adequate time for seat-pilot separation and parachute deployment.</p>
    
    <h3>FLIGHT CONTROL MALFUNCTIONS</h3>
    <p>Flight control system failures are extremly rare due to the quadruplex redundancy built into the system. However, if a failure does occur, the pilot should follow the appropriate emergency procedure based on the specific nature of the malfunction.</p>
    
    <p>In situations where the flight control system has experienced multiple failures resulting in significantly degraded handling qualities, the pilot must carefully evaluate whether the aircraft remains controllable enough to attempt a landing or whether ejection is the safest course of action, taking into consideration factors such as altitude, airspeed, proximity to suitable landing areas, and weather conditions.</p>
    
    <h3>HYDRAULIC SYSTEM FAILURES</h3>
    <p>The F-16 has two independent hydraulic systems that provide redundancy for critical flight controls. Loss of one system will not significantly affect aircraft controllability, although some systems may be inoperative.</p>
    
    <p>Complete loss of both hydraulic systems is an extremely serious emergency that will result in loss of all primary flight controls, and in this situation the pilot should immediately execute the controlled ejection procedure as the aircraft will be uncontrollable and attempting to land would be futile and would only serve to unnecessarily endanger the pilot's life.</p>
    
    <h2>CONCLUSION</h2>
    <p>This technical manual provides essential guidance for the safe and effective operation of the F-16C/D aircraft. Pilots must maintain thorough familiarity with all procedures and limitations contained herein.</p>
    
    <p>For additional information or clarification on any procedures contained in this manual, pilots should consult with their squadron training officer or refer to the appropriate supplemental technical orders and directives that provide more detailed information on specific systems and procedures.</p>
  </div>
</div>`;

  // Create 15 feedback items - mostly sentence/paragraph level changes
  const feedbackItems = [
    // Page 1 - Sentence/paragraph rephrasing
    {
      id: 'fb_af_001',
      page: 1,
      paragraphNumber: '1.1.1.1',
      lineNumber: 1,
      changeFrom: 'It is extremely important to understand that this manual has been prepared for the purpose of providing comprehensive flight operating instructions for USAF Series F-16C/D aircraft and contains all of the necessary information that pilots need to know in order to safely and effectively operate these aircraft under all normal and emergency conditions that might be encountered during flight operations.',
      changeTo: 'This manual provides comprehensive flight operating instructions for USAF Series F-16C/D aircraft. It contains essential information for safe and effective operation under all normal and emergency conditions.',
      coordinatorComment: 'Simplify verbose introduction',
      coordinatorJustification: 'Improve clarity and reduce wordiness',
      pocName: 'Lt Col Smith',
      pocEmail: 'smith.j@af.mil',
      pocPhone: '555-1001',
      component: 'Introduction',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_002',
      page: 1,
      paragraphNumber: '1.1.1.2',
      lineNumber: 1,
      changeFrom: 'Due to the fact that the F-16 is a highly sophisticated fly-by-wire aircraft with advanced avionics systems, it is absolutely essential that all personnel who are involved in the operation, maintenance, or support of these aircraft must thoroughly familiarize themselves with the contents of this manual and must ensure that they have a complete understanding of all procedures before attempting to perform any operations.',
      changeTo: 'The F-16 is a sophisticated fly-by-wire aircraft with advanced avionics. All personnel involved in operations, maintenance, or support must thoroughly understand this manual before performing any procedures.',
      coordinatorComment: 'Reduce redundancy and improve readability',
      coordinatorJustification: 'Make instructions more direct',
      pocName: 'Maj Johnson',
      pocEmail: 'johnson.m@af.mil',
      pocPhone: '555-1002',
      component: 'Introduction',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_003',
      page: 1,
      paragraphNumber: '1.1.2.1',
      lineNumber: 1,
      changeFrom: 'At this point in time, the Air Force has determined through extensive analysis and operational experience that strict adherence to all published procedures and limitations is mandatory for safe operation of the aircraft and that any deviations from these procedures without proper authorization could potentially result in catastrophic consequences.',
      changeTo: 'The Air Force requires strict adherence to all published procedures and limitations. Unauthorized deviations may result in catastrophic consequences.',
      coordinatorComment: 'Eliminate bureaucratic language',
      coordinatorJustification: 'Critical safety information must be clear',
      pocName: 'Col Williams',
      pocEmail: 'williams.r@af.mil',
      pocPhone: '555-1003',
      component: 'Safety',
      commentType: 'C',
      severity: 'CRITICAL'
    },
    {
      id: 'fb_af_004',
      page: 1,
      paragraphNumber: '1.1.2.2',
      lineNumber: 1,
      changeFrom: 'In the event that an emergency situation develops during flight operations, the pilot should immediately refer to the appropriate emergency procedures section of this manual and should follow all prescribed steps in the exact sequence specified unless the specific nature of the emergency requires deviation from standard procedures in order to ensure the safety of the aircraft and crew.',
      changeTo: 'During emergencies, immediately refer to the emergency procedures section and follow all steps in sequence. Deviate only when necessary for aircraft and crew safety.',
      coordinatorComment: 'Streamline emergency guidance',
      coordinatorJustification: 'Emergency procedures must be concise',
      pocName: 'Capt Davis',
      pocEmail: 'davis.k@af.mil',
      pocPhone: '555-1004',
      component: 'Safety',
      commentType: 'C',
      severity: 'CRITICAL'
    },
    // Page 2 - Mixed corrections and rephrasing
    {
      id: 'fb_af_005',
      page: 2,
      paragraphNumber: '1.2.1.1',
      lineNumber: 2,
      changeFrom: 'automaticaly',
      changeTo: 'automatically',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling error',
      pocName: 'TSgt Brown',
      pocEmail: 'brown.a@af.mil',
      pocPhone: '555-1005',
      component: 'Systems',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_006',
      page: 2,
      paragraphNumber: '1.2.1.2',
      lineNumber: 1,
      changeFrom: 'It should be noted that the flight control computer continuously monitors all system parameters and automatically reconfigures itself in the event of a failure, thereby providing multiple levels of redundancy which ensures that the aircraft remains controllable even in the event of multiple system failures, although handling qualities may be degraded depending on the specific nature and extent of the failures.',
      changeTo: 'The flight control computer continuously monitors system parameters and automatically reconfigures after failures. This redundancy ensures controllability even with multiple failures, though handling may degrade.',
      coordinatorComment: 'Simplify technical description',
      coordinatorJustification: 'Improve technical clarity',
      pocName: 'Maj Taylor',
      pocEmail: 'taylor.p@af.mil',
      pocPhone: '555-1006',
      component: 'Flight Controls',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_007',
      page: 2,
      paragraphNumber: '1.2.2.1',
      lineNumber: 2,
      changeFrom: 'typicaly',
      changeTo: 'typically',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling error',
      pocName: 'SSgt Miller',
      pocEmail: 'miller.t@af.mil',
      pocPhone: '555-1007',
      component: 'Engine',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_008',
      page: 2,
      paragraphNumber: '1.2.2.2',
      lineNumber: 1,
      changeFrom: 'For the purpose of ensuring optimal engine performance and longevity, it is critically important that all pilots strictly adhere to the published throttle movement restrictions and temperature limitations, particularly during engine start, taxi, takeoff, and climb phases of flight where rapid throttle movements or exceeding temperature limits could result in compressor stalls, engine damage, or complete engine failure.',
      changeTo: 'To ensure optimal engine performance and longevity, strictly follow throttle movement restrictions and temperature limitations. This is critical during start, taxi, takeoff, and climb, where violations may cause compressor stalls, damage, or engine failure.',
      coordinatorComment: 'Reduce wordiness in critical procedure',
      coordinatorJustification: 'Improve clarity of engine operating limits',
      pocName: 'Lt Col Anderson',
      pocEmail: 'anderson.j@af.mil',
      pocPhone: '555-1008',
      component: 'Engine',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_009',
      page: 2,
      paragraphNumber: '1.2.3.1',
      lineNumber: 2,
      changeFrom: 'simultaneosly',
      changeTo: 'simultaneously',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling error',
      pocName: 'A1C Wilson',
      pocEmail: 'wilson.d@af.mil',
      pocPhone: '555-1009',
      component: 'Avionics',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_010',
      page: 2,
      paragraphNumber: '1.2.3.2',
      lineNumber: 1,
      changeFrom: 'Due to the complexity and sophistication of the avionics systems installed in the F-16, it is absolutely essential that all pilots receive comprehensive training on the operation of these systems and that they maintain proficiency through regular practice and continuation training in order to ensure that they can effectively employ the full capabilities of the aircraft in combat situations.',
      changeTo: 'The F-16\'s complex avionics require comprehensive pilot training. Maintain proficiency through regular practice to effectively employ the aircraft\'s full combat capabilities.',
      coordinatorComment: 'Simplify training requirements statement',
      coordinatorJustification: 'Make training requirements clearer',
      pocName: 'Maj White',
      pocEmail: 'white.s@af.mil',
      pocPhone: '555-1010',
      component: 'Avionics',
      commentType: 'S',
      severity: 'MAJOR'
    },
    // Page 3 - Operating procedures
    {
      id: 'fb_af_011',
      page: 3,
      paragraphNumber: '1.3.1.2',
      lineNumber: 1,
      changeFrom: 'It is important to remember that the preflight inspection is the pilot\'s last opportunity to identify any discrepancies or potential problems before flight, and therefore it should never be rushed or abbreviated regardless of operational pressures or time constraints that may exist, as failure to identify a problem during preflight could lead to an in-flight emergency.',
      changeTo: 'The preflight inspection is the pilot\'s last opportunity to identify problems before flight. Never rush or abbreviate it, regardless of operational pressures. Missed problems may cause in-flight emergencies.',
      coordinatorComment: 'Clarify preflight importance',
      coordinatorJustification: 'Emphasize safety criticality',
      pocName: 'Capt Harris',
      pocEmail: 'harris.l@af.mil',
      pocPhone: '555-1011',
      component: 'Preflight',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_012',
      page: 3,
      paragraphNumber: '1.3.2.1',
      lineNumber: 2,
      changeFrom: 'malfuntion',
      changeTo: 'malfunction',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling error',
      pocName: 'TSgt Garcia',
      pocEmail: 'garcia.m@af.mil',
      pocPhone: '555-1012',
      component: 'Engine Start',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_013',
      page: 3,
      paragraphNumber: '1.3.3.2',
      lineNumber: 1,
      changeFrom: 'The takeoff procedure requires that the pilot advances the throttle smoothly to military power, checks all engine parameters, releases brakes, and then advances to maximum afterburner if required, while simultaneously monitoring airspeed, engine parameters, and flight control responses to ensure that all systems are functioning normally before committing to flight.',
      changeTo: 'For takeoff: advance throttle smoothly to military power, check engine parameters, release brakes, then advance to afterburner if required. Continuously monitor airspeed, engine parameters, and flight controls before committing to flight.',
      coordinatorComment: 'Clarify takeoff sequence',
      coordinatorJustification: 'Improve procedural clarity',
      pocName: 'Lt Martin',
      pocEmail: 'martin.r@af.mil',
      pocPhone: '555-1013',
      component: 'Takeoff',
      commentType: 'S',
      severity: 'MAJOR'
    },
    // Page 4 - Emergency procedures
    {
      id: 'fb_af_014',
      page: 4,
      paragraphNumber: '1.4.2.1',
      lineNumber: 1,
      changeFrom: 'extremly',
      changeTo: 'extremely',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling error',
      pocName: 'SrA Thomas',
      pocEmail: 'thomas.j@af.mil',
      pocPhone: '555-1014',
      component: 'Emergency',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_015',
      page: 4,
      paragraphNumber: '1.4.3.2',
      lineNumber: 1,
      changeFrom: 'Complete loss of both hydraulic systems is an extremely serious emergency that will result in loss of all primary flight controls, and in this situation the pilot should immediately execute the controlled ejection procedure as the aircraft will be uncontrollable and attempting to land would be futile and would only serve to unnecessarily endanger the pilot\'s life.',
      changeTo: 'Complete dual hydraulic failure results in total loss of flight controls. Execute immediate controlled ejection—the aircraft is uncontrollable and landing attempts are futile.',
      coordinatorComment: 'Clarify critical emergency procedure',
      coordinatorJustification: 'Life-critical procedure must be unambiguous',
      pocName: 'Col Mitchell',
      pocEmail: 'mitchell.w@af.mil',
      pocPhone: '555-1015',
      component: 'Emergency',
      commentType: 'C',
      severity: 'CRITICAL'
    }
  ];

  // Create document
  const newDoc = await prisma.document.create({
    data: {
      id: documentId,
      title: 'Air Force Technical Manual - F-16C/D Flight Manual',
      fileName: 'af_manual_f16.pdf',
      originalName: 'af_manual_f16.pdf',
      mimeType: 'application/pdf',
      fileSize: 3072000,
      checksum: 'af-manual-' + Date.now(),
      storagePath: '/documents/' + documentId,
      createdBy: { connect: { id: 'cmeys45qj000ojp4izc4fumqb' } },
      organization: { connect: { id: 'cmeys45f10000jp4iccb6f59u' } },
      customFields: {
        content: documentContent,
        draftFeedback: feedbackItems,
        documentType: 'Technical Manual',
        classification: 'UNCLASSIFIED',
        testInfo: {
          totalFeedback: feedbackItems.length,
          spellingFixes: 5,
          sentenceRephrasings: 10,
          criticalChanges: 3,
          pages: 4
        }
      }
    }
  });

  console.log('✅ Air Force Technical Manual created successfully!');
  console.log('\n📄 Document Details:');
  console.log('   ID:', documentId);
  console.log('   Title:', newDoc.title);
  console.log('   Pages: 4');
  console.log('\n📊 Feedback Summary:');
  console.log('   Total feedback items:', feedbackItems.length);
  console.log('   Sentence/paragraph rephrasings:', feedbackItems.filter(f => f.changeFrom.split(' ').length > 10).length);
  console.log('   Spelling corrections:', feedbackItems.filter(f => f.changeFrom.split(' ').length === 1).length);
  console.log('   Critical:', feedbackItems.filter(f => f.severity === 'CRITICAL').length);
  console.log('   Major:', feedbackItems.filter(f => f.severity === 'MAJOR').length);
  console.log('   Minor:', feedbackItems.filter(f => f.severity === 'MINOR').length);
  
  console.log('\n📝 Feedback Types:');
  console.log('   Critical (C):', feedbackItems.filter(f => f.commentType === 'C').length);
  console.log('   Substantive (S):', feedbackItems.filter(f => f.commentType === 'S').length);
  console.log('   Administrative (A):', feedbackItems.filter(f => f.commentType === 'A').length);
  
  console.log('\n🔗 View document at:');
  console.log('   http://localhost:3000/documents/' + documentId);
  console.log('\n🔗 Test with OPR Review at:');
  console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
  
  await prisma.$disconnect();
  
  return documentId;
}

createAFManualWithFeedback().catch(console.error);