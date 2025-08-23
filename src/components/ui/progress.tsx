import * as React from "react";

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {}

const Progress = React.forwardRef<HTMLProgressElement, ProgressProps>((props, ref) => (
  <progress ref={ref} {...props} />
));
Progress.displayName = "Progress";

export default Progress;
