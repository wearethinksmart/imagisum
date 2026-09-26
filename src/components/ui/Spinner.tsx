import { IconLoader2 } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";


const Spinner = ({ className = "", size = 25 }: { size?: number, className?: string }) => {
  return (
    <IconLoader2
      className={twMerge("animate-spin", className)}
      size={size}
    />
  )
}

export default Spinner;
