import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, size = 24, className = "", ...props }) => {
    const LucideIcon = useMemo(() => {
        if (!name) return null;

        // Convert kebab-case to PascalCase
        const pascalName = name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        const icon = LucideIcons[pascalName];

        if (!icon) {
            console.warn(`Icon "${name}" not found in lucide-react`);
            return LucideIcons.HelpCircle; // Fallback
        }

        return icon;
    }, [name]);

    if (!LucideIcon) return null;

    return <LucideIcon size={size} className={className} {...props} />;
};

export default Icon;
