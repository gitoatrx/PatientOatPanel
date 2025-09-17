import { CreditCard, Smartphone, Building, Wallet } from "lucide-react";

interface PaymentMethodIconProps {
  method: string;
  className?: string;
}

export function PaymentMethodIcon({
  method,
  className = "h-4 w-4",
}: PaymentMethodIconProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    card: CreditCard,
    apple_pay: Smartphone,
    google_pay: Smartphone,
    paypal: Wallet,
    us_bank_account: Building,
    sepa_debit: Building,
    sofort: Building,
    giropay: Building,
    bancontact: Building,
    ideal: Building,
    eps: Building,
  };

  const Icon = iconMap[method] || CreditCard;
  return <Icon className={className} />;
}
