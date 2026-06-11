export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export interface CardProps {
  children?: unknown;
  className?: string;
}

export interface StatPillProps {
  label: string;
  value: unknown;
}

export interface ButtonProps {
  children?: unknown;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  onClick?: (event: unknown) => void;
}

export interface TextFieldProps {
  className?: string;
  style?: unknown;
  type?: string;
  value?: unknown;
  defaultValue?: unknown;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (event: unknown) => void;
}

export function PageHeader(props: PageHeaderProps): JSX.Element;
export function Card(props: CardProps): JSX.Element;
export function StatPill(props: StatPillProps): JSX.Element;
export function Button(props: ButtonProps): JSX.Element;
export function TextField(props: TextFieldProps): JSX.Element;
