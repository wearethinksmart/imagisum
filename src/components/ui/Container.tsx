import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

//Interface
interface Props {
    children?: ReactNode;
    className?: string;
}

const Container = ({ children, className }: Props) => {
    return (
        <div className={twMerge("mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-14", className)}>
            {children}
        </div>
    );
};

export default Container;
