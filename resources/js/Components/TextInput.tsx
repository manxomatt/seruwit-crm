import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    isFocused?: boolean;
    className?: string;
}

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props }: Props,
    ref,
) {
    const localRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                className
            }
            ref={localRef}
        />
    );
});
