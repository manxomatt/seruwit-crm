import TextInput from '@/Components/TextInput';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money';
import type { ChangeEvent, InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
    value: string;
    onChange: (value: string) => void;
    isFocused?: boolean;
};

/**
 * Rupiah-style money field: shows thousand separators as dots while typing
 * ("1500000" → "1.500.000") and emits a plain digit string for forms.
 */
export default function MoneyInput({ value, onChange, className = '', ...props }: Props): JSX.Element {
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(parseMoneyInput(event.target.value));
    };

    return (
        <TextInput
            {...props}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={formatMoneyInput(value)}
            onChange={handleChange}
            className={`tabular-nums ${className}`.trim()}
        />
    );
}
