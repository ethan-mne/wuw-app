import { LayoutWrapper } from '@/components/layout-wrapper';

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutWrapper>
      <div className='w-full'>{children}</div>
    </LayoutWrapper>
  );
}
