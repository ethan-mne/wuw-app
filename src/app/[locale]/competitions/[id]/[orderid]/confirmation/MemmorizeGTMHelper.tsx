'use client';

import { sendGTMEvent } from '@next/third-parties/google';
import { useEffect } from 'react';

export const MemmorizeGTMHelper = ({
  order_id,
}: Readonly<{
  order_id: string;
}>) => {
  useEffect(() => {
    return sendGTMEvent({
      event: 'purchase',
      page_type: 'confirmation',
      order_id,
      total_price: 0,
    });
  }, [order_id]);

  return null;
};
