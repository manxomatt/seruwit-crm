import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import {
    createContext,
    useContext,
    useState,
    ReactNode,
    PropsWithChildren,
    ComponentProps,
} from 'react';

type DropDownContextType = {
    open: boolean;
    setOpen: (v: boolean) => void;
    toggleOpen: () => void;
};

const DropDownContext = createContext<DropDownContextType | undefined>(
    undefined,
);

type DropdownLinkProps = ComponentProps<typeof Link> & { className?: string };

type DropdownComponent = React.FC<PropsWithChildren> & {
    Trigger: React.FC<PropsWithChildren>;
    Content: React.FC<any>;
    Link: React.FC<DropdownLinkProps>;
};

const DropdownBase: React.FC<PropsWithChildren> = ({ children }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const useDropDown = () => {
    const ctx = useContext(DropDownContext);
    if (!ctx) throw new Error('Dropdown used outside provider');
    return ctx;
};

const Trigger = ({ children }: PropsWithChildren) => {
    const { open, setOpen, toggleOpen } = useDropDown();

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}: PropsWithChildren & { align?: string; width?: string; contentClasses?: string }) => {
    const { open, setOpen } = useDropDown();

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    } else if (width === '80') {
        widthClasses = 'w-80';
    }

    return (
        <>
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    className={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className={
                            `rounded-md ring-1 ring-black ring-opacity-5 ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink: React.FC<DropdownLinkProps> = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

const Dropdown = DropdownBase as DropdownComponent;

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
