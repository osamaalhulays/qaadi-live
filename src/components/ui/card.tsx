import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <div ref={ref} {...props} />
));
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => (
  <div ref={ref} {...props} />
));
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>((props, ref) => (
  <h3 ref={ref} {...props} />
));
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>((props, ref) => (
  <p ref={ref} {...props} />
));
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>((props, ref) => (
  <div ref={ref} {...props} />
));
CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>((props, ref) => (
  <div ref={ref} {...props} />
));
CardFooter.displayName = "CardFooter";

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
