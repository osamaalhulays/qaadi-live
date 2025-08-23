import * as React from "react";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>((props, ref) => (
  <input type="checkbox" role="switch" ref={ref} {...props} />
));
Switch.displayName = "Switch";

export default Switch;
