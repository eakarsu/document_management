import { TemplateDefaults } from '../../types/ai-document';

/**
 * Gets default configuration for different document templates
 * @param template - The template type
 * @returns Template defaults configuration
 */
export function getTemplateDefaults(template: string): TemplateDefaults {
  const templateMap: Record<string, TemplateDefaults> = {
    'af-manual': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE INSTRUCTION 36-2903',
      subject: 'DRESS AND APPEARANCE STANDARDS',
      category: 'PERSONNEL'
    },
    'afi': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE INSTRUCTION',
      subject: 'OPERATIONAL PROCEDURES',
      category: 'OPERATIONS'
    },
    'afpd': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE POLICY DIRECTIVE',
      subject: 'POLICY IMPLEMENTATION',
      category: 'POLICY'
    },
    'afman': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE MANUAL',
      subject: 'PROCEDURES AND GUIDELINES',
      category: 'OPERATIONS'
    },
    'dafi': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE INSTRUCTION',
      subject: 'DEPARTMENTAL PROCEDURES',
      category: 'ADMINISTRATION'
    },
    'army': {
      organization: 'DEPARTMENT OF THE ARMY',
      secretary: 'SECRETARY OF THE ARMY',
      documentType: 'ARMY REGULATION 670-1',
      subject: 'WEAR AND APPEARANCE OF ARMY UNIFORMS',
      category: 'PERSONNEL'
    },
    'navy': {
      organization: 'DEPARTMENT OF THE NAVY',
      secretary: 'SECRETARY OF THE NAVY',
      documentType: 'OPNAVINST 3500.39',
      subject: 'OPERATIONAL RISK MANAGEMENT',
      category: 'OPERATIONS'
    },
    'marine': {
      organization: 'UNITED STATES MARINE CORPS',
      secretary: 'COMMANDANT OF THE MARINE CORPS',
      documentType: 'MARINE CORPS ORDER 1020.34',
      subject: 'MARINE CORPS UNIFORM REGULATIONS',
      category: 'PERSONNEL'
    },
    'spaceforce': {
      organization: 'UNITED STATES SPACE FORCE',
      secretary: 'CHIEF OF SPACE OPERATIONS',
      documentType: 'SPACE FORCE INSTRUCTION 36-2903',
      subject: 'SPACE OPERATIONS AND PROCEDURES',
      category: 'SPACE OPERATIONS'
    },
    'dodd': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'DOD DIRECTIVE 5000.01',
      subject: 'THE DEFENSE ACQUISITION SYSTEM',
      category: 'ACQUISITION'
    },
    'dodi': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'DOD INSTRUCTION 5000.02',
      subject: 'OPERATION OF THE DEFENSE ACQUISITION SYSTEM',
      category: 'ACQUISITION'
    },
    'cjcs': {
      organization: 'JOINT CHIEFS OF STAFF',
      secretary: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF',
      documentType: 'CJCS INSTRUCTION 3170.01',
      subject: 'JOINT CAPABILITIES INTEGRATION',
      category: 'JOINT OPERATIONS'
    },
    'technical': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'TECHNICAL MANUAL',
      subject: 'System Architecture & Implementation',
      category: 'TECHNICAL DOCUMENTATION'
    },
    'policy': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'POLICY DIRECTIVE 13-6',
      subject: 'Nuclear, Space, Missile, Command and Control Operations',
      category: 'SPACE POLICY'
    },
    'training': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'TRAINING GUIDE',
      subject: 'Personnel Development',
      category: 'TRAINING AND EDUCATION'
    },
    'sop': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'STANDARD OPERATING PROCEDURE',
      subject: 'Operational Guidelines',
      category: 'OPERATIONS'
    },
    'oplan': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'OPERATION PLAN',
      subject: 'Strategic Operations Planning',
      category: 'STRATEGIC PLANNING'
    },
    'opord': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'OPERATION ORDER',
      subject: 'Tactical Operations',
      category: 'TACTICAL OPERATIONS'
    },
    'conops': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'CONCEPT OF OPERATIONS',
      subject: 'Operational Concepts',
      category: 'STRATEGIC PLANNING'
    },
    'ttp': {
      organization: 'DEPARTMENT OF DEFENSE',
      secretary: 'SECRETARY OF DEFENSE',
      documentType: 'TACTICS, TECHNIQUES, AND PROCEDURES',
      subject: 'Tactical Employment',
      category: 'TACTICAL OPERATIONS'
    },
    'afjqs': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE JOB QUALIFICATION STANDARD',
      subject: 'Job Qualification Requirements',
      category: 'TRAINING'
    },
    'afto': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE TECHNICAL ORDER',
      subject: 'Technical Procedures',
      category: 'TECHNICAL'
    },
    'afva': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE VISUAL AID',
      subject: 'Visual Training Materials',
      category: 'TRAINING'
    },
    'afh': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE HANDBOOK',
      subject: 'Reference Materials',
      category: 'REFERENCE'
    },
    'afgm': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE GUIDANCE MEMORANDUM',
      subject: 'Interim Guidance',
      category: 'POLICY'
    },
    'afmd': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'AIR FORCE MISSION DIRECTIVE',
      subject: 'Mission Requirements',
      category: 'OPERATIONS'
    },
    'dafman': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE MANUAL',
      subject: 'Departmental Procedures',
      category: 'ADMINISTRATION'
    },
    'dafpd': {
      organization: 'DEPARTMENT OF THE AIR FORCE',
      secretary: 'SECRETARY OF THE AIR FORCE',
      documentType: 'DEPARTMENT OF THE AIR FORCE POLICY DIRECTIVE',
      subject: 'Departmental Policy',
      category: 'POLICY'
    }
  };

  return templateMap[template] || templateMap['technical'];
}