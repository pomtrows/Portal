
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name?: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className }) => {
  if (!name) return <LucideIcons.Globe className={className} />;

  // Try to find the icon in Lucide
  const IconComponent = (LucideIcons as any)[name];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // If it's a URL (like a favicon or custom image)
  if (name.startsWith('http') || name.startsWith('/')) {
    return <img src={name} alt="icon" className={`${className} object-contain`} />;
  }

  // Default fallback
  return <LucideIcons.Globe className={className} />;
};
