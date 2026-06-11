const styles = {
  pageHeader: {
    padding: '0.25rem 0 0.5rem',
  },
  eyebrow: {
    margin: '0 0 0.35rem',
    color: '#4b5563',
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: '12ch',
    margin: 0,
    color: '#0f172a',
    fontSize: 'clamp(2rem, 6vw, 3rem)',
    fontWeight: 650,
    lineHeight: 0.95,
    letterSpacing: '0.04em',
  },
  description: {
    margin: '0.75rem 0 0',
    color: '#475569',
    lineHeight: 1.6,
  },
  card: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    borderRadius: '1.5rem',
    background: 'rgba(255, 255, 255, 0.86)',
    boxShadow: '0 1.5rem 4rem rgba(15, 23, 42, 0.08)',
    padding: '1.25rem',
    display: 'grid',
    gap: '1rem',
  },
  statPill: {
    borderRadius: '1rem',
    background: '#f1f5f9',
    padding: '0.85rem',
  },
  statPillLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statPillValue: {
    display: 'block',
    marginTop: '0.2rem',
    color: '#0f172a',
    fontSize: '1rem',
    fontWeight: 700,
  },
  buttonBase: {
    display: 'inline-flex',
    minHeight: '2.9rem',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '999px',
    padding: '0.7rem 1rem',
    fontSize: '0.88rem',
    fontWeight: 800,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  },
  buttonPrimary: {
    background: '#111827',
    color: '#ffffff',
  },
  buttonSecondary: {
    background: '#e5e7eb',
    color: '#111827',
  },
  buttonGhost: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#111827',
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  textField: {
    width: '100%',
    minHeight: '2.85rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.8rem',
    padding: '0 0.8rem',
    font: 'inherit',
    color: '#0f172a',
    background: '#ffffff',
  },
};

export function PageHeader({ eyebrow, title, description }) {
  return (
    <header style={styles.pageHeader}>
      {eyebrow ? <p style={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 style={styles.title}>{title}</h2>
      {description ? <p style={styles.description}>{description}</p> : null}
    </header>
  );
}

export function Card({ children, className }) {
  return (
    <section className={className} style={styles.card}>
      {children}
    </section>
  );
}

export function StatPill({ label, value }) {
  return (
    <div style={styles.statPill}>
      <span style={styles.statPillLabel}>{label}</span>
      <strong style={styles.statPillValue}>{value}</strong>
    </div>
  );
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className,
  fullWidth = false,
  onClick,
}) {
  const variantStyle =
    variant === 'secondary'
      ? styles.buttonSecondary
      : variant === 'ghost'
        ? styles.buttonGhost
        : styles.buttonPrimary;

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles.buttonBase,
        ...variantStyle,
        ...(fullWidth ? { width: '100%' } : null),
        ...(disabled ? styles.buttonDisabled : null),
      }}
    >
      {children}
    </button>
  );
}

export function TextField({ className, style, ...inputProps }) {
  return <input className={className} style={{ ...styles.textField, ...style }} {...inputProps} />;
}
