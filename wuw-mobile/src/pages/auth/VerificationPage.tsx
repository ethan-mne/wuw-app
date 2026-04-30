import { Card, PageHeader } from '../../components/ui';

export function VerificationPage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Verification"
        title="Enter your OTP code"
        description="This mirrors the web verification step. Real OTP validation will be connected to the mobile backend later."
      />
      <Card>
        <div className="otp-row" aria-label="OTP placeholder">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
      </Card>
    </section>
  );
}
