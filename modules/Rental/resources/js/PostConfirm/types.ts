export const POST_CONFIRM_STEPS = [6, 7, 8, 9, 10] as const;

export type PostConfirmStepId = (typeof POST_CONFIRM_STEPS)[number];

export type PostConfirmStepState = {
    id: PostConfirmStepId;
    done: boolean;
    available: boolean;
};

export type PostConfirmProgress = {
    visible: boolean;
    current_step: PostConfirmStepId | null;
    steps: PostConfirmStepState[];
};

export type PostConfirmAction =
    | 'receive_deposit'
    | 'pay_deposit_online'
    | 'settle_deposit'
    | 'checkout'
    | 'return'
    | 'complete'
    | 'extend'
    | 'swap'
    | 'addon'
    | 'print_contract'
    | 'print_handover';
