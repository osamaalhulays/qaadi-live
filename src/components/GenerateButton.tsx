"use client";
import React from "react";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function GenerateButton({ onClick, disabled }: Props) {
  return (
    <button className="btn btn-primary" onClick={onClick} disabled={disabled}>
      توليد
    </button>
  );
}
