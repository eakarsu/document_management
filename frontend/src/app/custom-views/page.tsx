'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const CustomViewsPage = dynamic(() => import('../../components/CustomViewsPage'), { ssr: false });

export default function Page() {
  return <CustomViewsPage />;
}
