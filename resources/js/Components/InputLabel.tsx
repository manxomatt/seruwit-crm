import { LabelHTMLAttributes, ReactNode } from 'react';

interface Props extends LabelHTMLAttributes<HTMLLabelElement> {
    value?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: Props) {
    return (
        <label
            {...props}
            className={`block text-sm font-medium text-gray-700 ` + className}
        >
            {value ? value : children}
        </label>
    );
}
