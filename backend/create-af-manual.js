const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAirForceManual() {
  console.log('=== CREATING 3-PAGE AIR FORCE TECHNICAL MANUAL ===\n');
  
  const documentId = 'doc_af_manual_' + Date.now().toString(36);
  
  // Air Force Technical Manual content - 3 pages
  const afManualContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <div class="af-header">
      <h1>AIR FORCE TECHNICAL MANUAL</h1>
      <h2>TO 1F-16C-1</h2>
      <h3>AIRCRAFT MAINTENENCE PROCEDURES</h3>
      <p class="classification">UNCLASSIFIED // FOR OFFICIAL USE ONLY</p>
    </div>
    
    <h2>GENERAL INFORMATION</h2>
    <h3>PURPOSE AND SCOPE</h3>
    <p>This technical manual provides comprehesive maintenance instructions and operational guidelines for F-16C Fighting Falcon aircraft maintainance operations. All personel must comply with established procedures to ensure aircraft readiness and safety.</p>
    
    <h3>SAFETY REQUIREMENTS</h3>
    <p>Safety requirments outlined in AFI 91-203 must be followed without exception. Technicans shall complete required training before performing maintenence tasks. Failure to follow safety protocols may result in equipment damage or personal injury.</p>
    
    <h3>TECHNICAL SPECIFICATIONS</h3>
    <p>The F-16C incorporates advanced avionics with multi-role combat capabilites. Operational paramters include Mach 2.0 capability and 9G manuever limits. All maintenance must ensure these specifications remain within tolerances.</p>
    
    <h2>PRE-FLIGHT INSPECTION</h2>
    <h3>EXTERIOR INSPECTION</h3>
    <p>Conduct visual inspection for structural damage, fluid leaks, and foreign debris. Check control surface movment and verify panel security. Document all discrepencies in maintenance forms.</p>
    
    <h3>LANDING GEAR</h3>
    <p>Verify strut extension per specifications in Section 4-2-1. Check tire pressure and brake wear. Remove safety pins before aircraft movemnt. Tests shall be performed in acordance with procedures.</p>
  </div>
  
  <div class="page" data-page="2">
    <h2>ENGINE MAINTENANCE</h2>
    <h3>INSPECTION INTERVALS</h3>
    <p>Engine inspections are determind by flight hours and operational tempo. Borescope inspections every 200 hours assess internal componets. Document findings in maintainence information system.</p>
    
    <h3>ENGINE START PROCEDURES</h3>
    <p>Coordinate between pilot and ground crew for engine start. Ensure fire suppression is availible. Monitor oil pressure, exhaust temprature, and compressor speeds during start sequence.</p>
    
    <h3>ENGINE SERVICING</h3>
    <p>Use approved lubricants per T.O. 1-1-691. Check oil within 30 minutes after shutdown for acurate readings. Collect oil samples at specified intervals for analysis.</p>
    
    <h2>AVIONICS SYSTEMS</h2>
    <h3>RADAR SYSTEM</h3>
    <p>AN/APG-68 radar requires periodic calibration. Built-in test provides diagnostic capabilty. Verify transmitter power and receiver sensitivity quarterly or after maintainance affecting performance.</p>
    
    <h3>COMMUNICATION SYSTEMS</h3>
    <p>Test UHF/VHF systems across all frequencies. Encryption devices require apropriate clearances. Correct communication failures before flight release.</p>
    
    <h3>NAVIGATION EQUIPMENT</h3>
    <p>Complete inertial navigation alignment before each flight. Update GPS databases for navigational accurracy. Classify navigation discrepancies as mission essential maintenance.</p>
    
    <h2>HYDRAULIC SYSTEMS</h2>
    <h3>PRESSURE CHECKS</h3>
    <p>Maintain 3000 PSI operating pressure. Investigate fluctuations exceeding 10% for malfuctions. Inspect hydraulic componets for leaks and contamination.</p>
  </div>
  
  <div class="page" data-page="3">
    <h2>ELECTRICAL SYSTEMS</h2>
    <h3>POWER GENERATION</h3>
    <p>Integrated power unit provides ground power. Verify generator output at 115/200 VAC, 400 Hz. Test battery capacity monthly for emergancy power availability.</p>
    
    <h3>CIRCUIT PROTECTION</h3>
    <p>Investigate tripped breakers before reseting to prevent damage. Inspect wiring for deterioration during scheduled maintainence.</p>
    
    <h2>FUEL SYSTEM</h2>
    <h3>INSPECTION</h3>
    <p>Inspect fuel components for leaks and structural integrety. Calibrate quantity indicators for accurate fuel managment. Perform maintenance in designated areas with fire suppression.</p>
    
    <h3>CONTAMINATION PREVENTION</h3>
    <p>Verify fuel quality through sampling. Water removal is critical for engine reliablity. Replace filters at specified intervals.</p>
    
    <h2>DOCUMENTATION</h2>
    <h3>MAINTENANCE FORMS</h3>
    <p>Document all actions in AFTO Form 781 series. Accurate records ensure regulatory complience. Supervisory review required for critical tasks.</p>
    
    <h3>TECHNICAL ORDERS</h3>
    <p>Follow procedures per technical orders. Deviations require engineering disposition or waiver aproval. Incorporate updates immediately.</p>
    
    <h2>QUALITY ASSURANCE</h2>
    <h3>INSPECTIONS</h3>
    <p>Quality inspections verify task completion and accuracy. Critical tasks require independant verification. Address findings before aircraft release.</p>
    
    <h3>COMPLIANCE</h3>
    <p>Periodic inspections ensure adherance to standards. Report non-compliance through channels. Develop corrective action plans for deficiencies.</p>
    
    <div class="footer">
      <p>DISTRIBUTION: Approved for public release</p>
      <p>EFFECTIVE DATE: 01 JAN 2024</p>
    </div>
  </div>
</div>`;

  // Create document with minimum required fields
  const newDoc = await prisma.document.create({
    data: {
      id: documentId,
      title: 'Air Force Technical Manual - F-16C Maintenance',
      fileName: 'AF_Manual_F16C.pdf',
      originalName: 'AF_Manual_F16C.pdf',
      mimeType: 'application/pdf',
      fileSize: 1536000,
      checksum: 'af-' + Date.now(),
      storagePath: '/documents/' + documentId,
      createdBy: { connect: { id: 'cmeys45qj000ojp4izc4fumqb' } },
      organization: { connect: { id: 'cmeys45f10000jp4iccb6f59u' } },
      customFields: {
        content: afManualContent,
        documentType: 'Air Force Technical Manual',
        createdMethod: 'Script generated',
        intentionalTypos: [
          'maintenence', 'comprehesive', 'maintainance', 'personel', 
          'requirments', 'Technicans', 'capabilites', 'paramters',
          'movment', 'discrepencies', 'acordance', 'determind',
          'componets', 'availible', 'temprature', 'acurate',
          'capabilty', 'apropriate', 'accurracy', 'malfuctions',
          'emergancy', 'reseting', 'integrety', 'managment',
          'reliablity', 'complience', 'aproval', 'independant', 'adherance'
        ]
      }
    }
  });

  console.log('✅ Air Force Technical Manual created successfully!');
  console.log('\n📄 Document Details:');
  console.log('   ID:', documentId);
  console.log('   Title:', newDoc.title);
  console.log('   Pages: 3');
  console.log('   Sections: 9 (General Info, Pre-flight, Engine, Avionics, Hydraulic, Electrical, Fuel, Documentation, QA)');
  console.log('   Typos: 29 intentional spelling errors for testing');
  
  console.log('\n✈️ Ready for OPR review and merge testing!');
  console.log('\n🔗 View document at:');
  console.log('   http://localhost:3000/documents/' + documentId);
  
  await prisma.$disconnect();
  
  return documentId;
}

createAirForceManual().catch(console.error);