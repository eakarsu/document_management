'use client';

import React from 'react';

interface AirForceDocumentHeaderProps {
  byOrderText?: string;
  secretaryText?: string;
  sealImagePath?: string;
  sealAltText?: string;
  organizationName?: string;
  instructionTitle: string;
  date: string;
  subject: string;
  responsibilities: string;
  complianceText?: string;
  accessibility?: {
    text: string;
    websiteUrl?: string;
  };
  releasability?: string;
  opr?: string;
  certifiedBy?: string;
  pages?: number;
}

const AirForceDocumentHeader: React.FC<AirForceDocumentHeaderProps> = ({
  byOrderText = "BY ORDER OF THE",
  secretaryText = "SECRETARY OF THE AIR FORCE", 
  sealImagePath = "/images/air-force-seal.svg",
  sealAltText = "Department of the Air Force Seal",
  organizationName = "DEPARTMENT OF THE AIR FORCE",
  instructionTitle,
  date,
  subject,
  responsibilities,
  complianceText = "COMPLIANCE WITH THIS PUBLICATION IS MANDATORY",
  accessibility = {
    text: "This publication is available for downloading from the e-Publishing website at",
    websiteUrl: "www.e-publishing.af.mil"
  },
  releasability = "There are no releasability restrictions on this publication.",
  opr = "SAF/IG",
  certifiedBy = "AF/CV (General Larry O. Spencer)",
  pages = 6
}) => {
  return (
    <div className="air-force-document-header bg-white p-8 max-w-4xl mx-auto font-serif">
      <style jsx>{`
        .air-force-document-header {
          font-family: Times, serif;
          line-height: 1.4;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .left-section {
          flex: 1;
          text-align: center;
        }
        
        .right-section {
          flex: 1;
          text-align: right;
          font-style: italic;
        }
        
        .seal {
          width: 120px;
          height: 120px;
          margin: 0 auto 1rem auto;
          display: block;
        }
        
        .by-order {
          font-weight: bold;
          font-size: 14pt;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }
        
        .secretary {
          font-weight: bold;
          font-size: 14pt;
          text-transform: uppercase;
        }
        
        .instruction-title {
          font-weight: bold;
          font-size: 14pt;
          margin-bottom: 0.5rem;
        }
        
        .date {
          font-size: 12pt;
          margin-bottom: 1rem;
        }
        
        .subject {
          font-size: 12pt;
          font-style: italic;
          margin-bottom: 0.5rem;
        }
        
        .responsibilities {
          font-weight: bold;
          font-size: 12pt;
          text-transform: uppercase;
        }
        
        .compliance {
          text-align: center;
          font-weight: bold;
          font-size: 12pt;
          text-transform: uppercase;
          margin: 2rem 0 1rem 0;
          border-bottom: 2px solid black;
          padding-bottom: 0.5rem;
        }
        
        .info-section {
          margin: 1rem 0;
        }
        
        .section-label {
          font-weight: bold;
          text-transform: uppercase;
          display: inline-block;
          width: 150px;
        }
        
        .section-content {
          display: inline;
        }
        
        .divider {
          border-bottom: 1px solid black;
          margin: 1rem 0;
        }
        
        .footer-section {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }
        
        .opr {
          font-weight: bold;
        }
        
        .certified {
          text-align: right;
        }
        
        .link {
          color: blue;
          text-decoration: underline;
        }
      `}</style>
      
      <div className="header-section">
        <div className="left-section">
          <div className="by-order">{byOrderText}</div>
          <div className="secretary">{secretaryText}</div>
          <img src={sealImagePath} alt={sealAltText} className="seal" />
        </div>
        <div className="right-section">
          <div className="instruction-title">{instructionTitle}</div>
          <div className="date">{date}</div>
          <div className="subject">{subject}</div>
          <div className="responsibilities">{responsibilities}</div>
        </div>
      </div>
      
      <div className="compliance">
        {complianceText}
      </div>
      
      <div className="info-section">
        <span className="section-label">ACCESSIBILITY:</span>
        <span className="section-content">
          {accessibility.text}{' '}
          {accessibility.websiteUrl && (
            <span className="link">{accessibility.websiteUrl}</span>
          )}.
        </span>
      </div>
      
      <div className="divider"></div>
      
      <div className="info-section">
        <span className="section-label">RELEASABILITY:</span>
        <span className="section-content">{releasability}</span>
      </div>
      
      <div className="divider"></div>
      
      <div className="footer-section">
        <div className="opr">
          <span className="section-label">OPR:</span> {opr}
        </div>
        <div className="certified">
          Certified by: {certifiedBy}<br />
          Pages: {pages}
        </div>
      </div>
    </div>
  );
};

export default AirForceDocumentHeader;