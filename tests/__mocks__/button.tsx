// Minimal Button stub — keeps SpotlightTour tests free of shadcn internals
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: string;
  variant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size: _size, variant: _variant, ...props }, ref) => (
    <button ref={ref} {...props} />
  )
);
Button.displayName = "Button";
