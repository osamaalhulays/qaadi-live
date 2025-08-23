import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => (
  <span ref={ref} {...props} />
));
Badge.displayName = "Badge";

export default Badge;
