import React from "react";
import type { LeadCaptureModalProps } from "../types";

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  open,
  onClose,
  planId,
  planTitle,
}) => {
  if (!open) return null;

  return (
    <div className="dv-lead-capture-overlay">
      <div className="dv-lead-capture-modal">
        <button className="dv-lead-capture-modal__close" onClick={onClose}>
          Close
        </button>
        <h2 className="dv-lead-capture-modal__title">Get Your Custom Plan</h2>
        {planTitle && <p>Plan: {planTitle}</p>}
        <form className="dv-lead-capture-modal__form">
          <input type="text" placeholder="First Name" data-plan-id={planId} />
          <input type="text" placeholder="Last Name" />
          <input type="email" placeholder="Email" />
          <input type="tel" placeholder="Phone" />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};
