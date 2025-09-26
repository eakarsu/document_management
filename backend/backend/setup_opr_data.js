const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupOPRData() {
  try {
    // First, find or create OPR role
    let oprRole = await prisma.role.findFirst({
      where: { name: 'OPR' }
    });

    if (!oprRole) {
      oprRole = await prisma.role.create({
        data: {
          name: 'OPR',
          permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE_DOCUMENTS', 'REVIEW', 'APPROVE']
        }
      });
      console.log('Created OPR role:', oprRole);
    } else {
      console.log('Found existing OPR role:', oprRole);
    }

    // Update the OPR user's role
    const updatedUser = await prisma.user.update({
      where: {
        email: 'opr1@airforce.mil'
      },
      data: {
        roleId: oprRole.id
      },
      include: {
        role: true
      }
    });

    console.log('Updated OPR user role:', {
      email: updatedUser.email,
      roleName: updatedUser.role.name,
      roleId: updatedUser.roleId
    });

    // Now add some sample feedback to the document to simulate reviewer submissions
    const document = await prisma.document.findUnique({
      where: {
        id: 'cmfxbop8i0001etah0w5qxkf2'
      }
    });

    if (document) {
      const sampleFeedback = [
        {
          id: "feedback-1",
          component: "Introduction",
          pocName: "Reviewer One",
          pocPhone: "555-0001",
          pocEmail: "reviewer1@airforce.mil",
          commentType: "S",
          page: "1",
          paragraphNumber: "1",
          lineNumber: "5",
          coordinatorComment: "The introduction needs to clearly state the document's purpose and scope.",
          changeFrom: "This technical manual provides comprehensive guidelines",
          changeTo: "This technical manual provides comprehensive guidelines and operational procedures",
          coordinatorJustification: "Adding clarity to the scope of the document"
        },
        {
          id: "feedback-2",
          component: "Safety Protocols",
          pocName: "Reviewer Two",
          pocPhone: "555-0002",
          pocEmail: "reviewer2@airforce.mil",
          commentType: "C",
          page: "3",
          paragraphNumber: "2",
          lineNumber: "10",
          coordinatorComment: "Critical safety warning missing - must include emergency shutdown procedures",
          changeFrom: "Safety protocols are established to safeguard personnel",
          changeTo: "Safety protocols are established to safeguard personnel. CRITICAL: Emergency shutdown procedures must be followed immediately in case of equipment malfunction.",
          coordinatorJustification: "Safety requirement per AFI 91-203"
        },
        {
          id: "feedback-3",
          component: "Maintenance",
          pocName: "Reviewer One",
          pocPhone: "555-0001",
          pocEmail: "reviewer1@airforce.mil",
          commentType: "M",
          page: "5",
          paragraphNumber: "1",
          lineNumber: "3",
          coordinatorComment: "Update maintenance schedule reference to latest technical order",
          changeFrom: "as outlined in Table 4-3",
          changeTo: "as outlined in Table 4-3 (Rev. 2025)",
          coordinatorJustification: "Technical order was updated in 2025"
        }
      ];

      const updatedDoc = await prisma.document.update({
        where: { id: 'cmfxbop8i0001etah0w5qxkf2' },
        data: {
          customFields: {
            ...(document.customFields as any || {}),
            commentMatrix: sampleFeedback,
            crmFeedback: sampleFeedback,
            lastCommentUpdate: new Date().toISOString()
          }
        }
      });

      console.log('Added sample feedback to document');
      console.log('Feedback count:', sampleFeedback.length);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupOPRData();