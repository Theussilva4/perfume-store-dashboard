interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  delay?: string;
}

const KpiCard = ({ label, value, change, positive = true, delay = "" }: KpiCardProps) => {
  return (
    <div className={`bg-card rounded-sm p-6 flex flex-col gap-3 animate-fade-in-up ${delay}`}>
      <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">
        {label}
      </span>
      <span className="font-display text-4xl font-semibold text-primary leading-none">
        {value}
      </span>
      {change && (
        <span className={`text-xs font-body ${positive ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      )}
    </div>
  );
};

export default KpiCard;
