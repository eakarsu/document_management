import crypto from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { prepareUntrustedDocumentForAI } from './governancePolicy';

type Database = PrismaClient | Prisma.TransactionClient;

export function defendAIInput(content: string) {
  const defended = prepareUntrustedDocumentForAI(content);
  if (!defended.accepted) throw new Error(`PROMPT_INJECTION_BLOCKED:${defended.reason}`);
  return defended;
}

export async function stageAIResult(input: {
  prisma: Database;
  document: { id: string; organizationId: string; currentVersion: number; checksum: string };
  actorId: string;
  feature: string;
  output: unknown;
  promptDigest: string;
  model: string;
  modelVersion?: string;
  provider?: string;
}) {
  const modelVersion = input.modelVersion || process.env.OPENROUTER_MODEL_VERSION;
  if (!modelVersion) throw new Error('OPENROUTER_MODEL_VERSION_REQUIRED');
  const serialized = JSON.stringify(input.output);
  return input.prisma.aIReviewArtifact.create({ data: {
    organizationId: input.document.organizationId,
    documentId: input.document.id,
    documentVersion: input.document.currentVersion,
    provider: input.provider || 'openrouter',
    model: input.model,
    modelVersion,
    feature: input.feature,
    output: JSON.parse(serialized) as Prisma.InputJsonValue,
    promptDigest: input.promptDigest,
    sourceChecksums: [input.document.checksum],
    outputChecksum: crypto.createHash('sha256').update(serialized).digest('hex'),
    promptDefense: { delimiter: 'UNTRUSTED_DOCUMENT', signalsChecked: true, sourceDigest: input.promptDigest },
    createdById: input.actorId,
  } });
}
