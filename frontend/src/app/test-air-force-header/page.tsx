'use client';

import React from 'react';
import AirForceDocumentHeader from '../../components/documents/AirForceDocumentHeader';

export default function TestAirForceHeaderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Air Force Document Header Test</h1>
          <p className="text-gray-600">Testing the AirForceDocumentHeader React component with different configurations.</p>
        </div>

        <div className="space-y-12">
          {/* Test Case 1: Default Air Force Instruction 1-2 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-3">
              <h2 className="text-xl font-semibold">Test Case 1: Air Force Instruction 1-2 (Default)</h2>
            </div>
            <div className="p-6">
              <AirForceDocumentHeader
                instructionTitle="AIR FORCE INSTRUCTION 1-2"
                date="8 MAY 2014"
                subject="Air Force Culture"
                responsibilities="COMMANDER'S RESPONSIBILITIES"
                sealImagePath="/images/air-force-seal.png"
              />
            </div>
          </div>

          {/* Test Case 2: Custom Air Force Manual */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-3">
              <h2 className="text-xl font-semibold">Test Case 2: Custom Air Force Manual</h2>
            </div>
            <div className="p-6">
              <AirForceDocumentHeader
                instructionTitle="AIR FORCE MANUAL 36-2203"
                date="15 JUNE 2023"
                subject="Drill and Ceremonies"
                responsibilities="MILITARY TRAINING STANDARDS"
                sealImagePath="/images/air-force-seal.png"
                opr="SAF/MR"
                certifiedBy="AF/A1 (Lieutenant General Brian T. Kelly)"
                pages={124}
                accessibility={{
                  text: "This publication is available for downloading from the e-Publishing website at",
                  websiteUrl: "www.e-publishing.af.mil"
                }}
                releasability="There are no releasability restrictions on this publication."
              />
            </div>
          </div>

          {/* Test Case 3: Air Force Policy Directive */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-purple-600 text-white px-6 py-3">
              <h2 className="text-xl font-semibold">Test Case 3: Air Force Policy Directive</h2>
            </div>
            <div className="p-6">
              <AirForceDocumentHeader
                byOrderText="BY ORDER OF THE"
                secretaryText="SECRETARY OF THE AIR FORCE"
                instructionTitle="AIR FORCE POLICY DIRECTIVE 10-25"
                date="26 SEPTEMBER 2019"
                subject="Emergency Management"
                responsibilities="OPERATIONAL READINESS"
                sealImagePath="/images/air-force-seal.png"
                complianceText="COMPLIANCE WITH THIS PUBLICATION IS MANDATORY"
                opr="AF/A4"
                certifiedBy="AF/A4 (Lieutenant General John P. Thompson)"
                pages={8}
                accessibility={{
                  text: "This publication is available for downloading from the e-Publishing website at",
                  websiteUrl: "www.e-publishing.af.mil"
                }}
                releasability="There are no releasability restrictions on this publication."
              />
            </div>
          </div>

          {/* Test Case 4: Restricted Document */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-3">
              <h2 className="text-xl font-semibold">Test Case 4: Restricted Access Document</h2>
            </div>
            <div className="p-6">
              <AirForceDocumentHeader
                instructionTitle="AIR FORCE INSTRUCTION 31-401"
                date="1 MAY 2020"
                subject="Information Security Program Management"
                responsibilities="SECURITY CLASSIFICATION GUIDANCE"
                sealImagePath="/images/air-force-seal.png"
                opr="SAF/AA"
                certifiedBy="AF/A6 (Lieutenant General Bradford J. Shwedo)"
                pages={45}
                accessibility={{
                  text: "This publication is available to authorized personnel only through secure channels at",
                  websiteUrl: "portal.af.mil"
                }}
                releasability="Distribution is limited to US Air Force personnel with appropriate security clearance."
              />
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Component Usage:</h3>
          <pre className="bg-blue-100 text-blue-800 p-4 rounded-md text-sm overflow-x-auto">
{`<AirForceDocumentHeader
  instructionTitle="AIR FORCE INSTRUCTION 1-2"
  date="8 MAY 2014"
  subject="Air Force Culture"
  responsibilities="COMMANDER'S RESPONSIBILITIES"
  sealImagePath="/images/air-force-seal.png"
  opr="SAF/IG"
  certifiedBy="AF/CV (General Larry O. Spencer)"
  pages={6}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}