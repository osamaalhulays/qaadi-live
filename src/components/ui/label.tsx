import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => (
  <label ref={ref} {...props} />
));
Label.displayName = "Label";

export default Label;
