import { Suspense } from 'react';
import AiDocumentGeneratorClient from './AiDocumentGeneratorClient';

export default function AiDocumentGeneratorPage() {
  return (
    <Suspense fallback={<main aria-busy="true">Loading document generator…</main>}>
      <AiDocumentGeneratorClient />
    </Suspense>
  );
}
