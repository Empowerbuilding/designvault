import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useLeadCapture } from "../hooks/useLeadCapture";
import type { LeadCaptureModalProps, Modification } from "../types";

// ── Skip counter (localStorage) ─────────────────────────────

const SKIP_KEY = "dv-lead-skip-count";

function getSkipCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(SKIP_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function incrementSkipCount(): number {
  const next = getSkipCount() + 1;
  try {
    localStorage.setItem(SKIP_KEY, String(next));
  } catch {
    /* storage may be unavailable */
  }
  return next;
}

// ── Modification summary ────────────────────────────────────

function summarizeMod(mod: Modification): string {
  if (mod.type === "style_swap" && mod.stylePreset) {
    const label = mod.stylePreset
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `Style swap to ${label}`;
  }
  if (mod.type === "wishlist_item" && mod.prompt) {
    return mod.prompt.length > 50
      ? `Wishlist: ${mod.prompt.slice(0, 47)}\u2026`
      : `Wishlist: ${mod.prompt}`;
  }
  if (mod.type === "floor_plan_edit" && mod.prompt) {
    return mod.prompt.length > 50
      ? mod.prompt.slice(0, 50) + "\u2026"
      : mod.prompt;
  }
  return mod.type === "style_swap" ? "Style customization" : "Floor plan edit";
}

// ── Validation ──────────────────────────────────────────────

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  const digits = data.phone.replace(/\D/g, "");
  if (!digits) {
    errors.phone = "Phone number is required";
  } else if (digits.length < 10) {
    errors.phone = "Please enter a valid phone number (10+ digits)";
  }

  return errors;
}

// ── Component ───────────────────────────────────────────────

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  plan,
  modifications,
  config,
}) => {
  const {
    submitCapture,
    isSubmitting,
    submitted,
    error: hookError,
  } = useLeadCapture();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [skipCount, setSkipCount] = useState(getSkipCount);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setErrors({});
      setTouched(new Set());
      setShowSuccess(false);
      setSkipCount(getSkipCount());
    }
  }, [isOpen]);

  // Handle successful submission → show confirmation, then close
  useEffect(() => {
    if (submitted && isOpen && !showSuccess) {
      setShowSuccess(true);
      onSubmit?.();
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted, isOpen, showSuccess, onSubmit, onClose]);

  // ── Field-level blur validation ───────────────────────────
  const handleBlur = useCallback(
    (field: keyof FieldErrors) => {
      setTouched((prev) => {
        const next = new Set(prev);
        next.add(field);
        return next;
      });

      // Re-validate on blur so error clears when fixed
      setErrors(validateFields({ firstName, lastName, email, phone }));
    },
    [firstName, lastName, email, phone]
  );

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = { firstName, lastName, email, phone };
    const fieldErrors = validateFields(data);
    setErrors(fieldErrors);
    setTouched(new Set(["firstName", "lastName", "email", "phone"]));

    if (Object.keys(fieldErrors).length > 0) return;

    await submitCapture({
      ...data,
      phone: phone.replace(/\D/g, ""),
    });
  };

  // ── Skip ──────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    incrementSkipCount();
    setSkipCount((c) => c + 1);
    onClose();
  }, [onClose]);

  // ── Backdrop close (blocked while submitting) ─────────────
  const handleBackdropClick = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  // After 2 skips, hide the "Skip for now" link
  const canSkip = skipCount < 2;

  // Builder display name from slug
  const builderName = config.builderSlug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Inline error helper ───────────────────────────────────
  const fieldError = (field: keyof FieldErrors) =>
    touched.has(field) && errors[field] ? errors[field] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dv-lead-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="dv-lead-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="dv-lead-modal__close"
              onClick={onClose}
              aria-label="Close"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>

            {showSuccess ? (
              /* ── Success confirmation ── */
              <div className="dv-lead-modal__success">
                <CheckCircle size={48} className="dv-lead-modal__success-icon" />
                <h2 className="dv-lead-modal__title">Saved!</h2>
                <p className="dv-lead-modal__subtitle">
                  Check your email for the full details.
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* Header */}
                <div className="dv-lead-modal__header">
                  <Sparkles size={24} className="dv-lead-modal__header-icon" />
                  <h2 className="dv-lead-modal__title">
                    Save Your Custom Design
                  </h2>
                  <p className="dv-lead-modal__subtitle">
                    Enter your contact info to unlock more AI customizations
                    and receive the full details for{" "}
                    <strong>{plan.title}</strong>
                  </p>
                </div>

                {/* Modifications preview */}
                {modifications.length > 0 && (
                  <div className="dv-lead-modal__mods">
                    <span className="dv-lead-modal__mods-label">
                      Your customizations:
                    </span>
                    <div className="dv-lead-modal__mods-list">
                      {modifications.map((mod, i) => (
                        <span key={i} className="dv-lead-modal__mod-tag">
                          {summarizeMod(mod)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* API error */}
                {hookError && (
                  <div className="dv-lead-modal__api-error">{hookError}</div>
                )}

                <form
                  className="dv-lead-modal__form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  {/* First + Last name */}
                  <div className="dv-lead-modal__row">
                    <div className="dv-lead-modal__field">
                      <input
                        className={`dv-lead-modal__input ${
                          fieldError("firstName")
                            ? "dv-lead-modal__input--error"
                            : ""
                        }`}
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => handleBlur("firstName")}
                        disabled={isSubmitting}
                        autoComplete="given-name"
                      />
                      {fieldError("firstName") && (
                        <span className="dv-lead-modal__field-error">
                          {fieldError("firstName")}
                        </span>
                      )}
                    </div>

                    <div className="dv-lead-modal__field">
                      <input
                        className={`dv-lead-modal__input ${
                          fieldError("lastName")
                            ? "dv-lead-modal__input--error"
                            : ""
                        }`}
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => handleBlur("lastName")}
                        disabled={isSubmitting}
                        autoComplete="family-name"
                      />
                      {fieldError("lastName") && (
                        <span className="dv-lead-modal__field-error">
                          {fieldError("lastName")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="dv-lead-modal__field">
                    <input
                      className={`dv-lead-modal__input ${
                        fieldError("email")
                          ? "dv-lead-modal__input--error"
                          : ""
                      }`}
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      disabled={isSubmitting}
                      autoComplete="email"
                    />
                    {fieldError("email") && (
                      <span className="dv-lead-modal__field-error">
                        {fieldError("email")}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="dv-lead-modal__field">
                    <input
                      className={`dv-lead-modal__input ${
                        fieldError("phone")
                          ? "dv-lead-modal__input--error"
                          : ""
                      }`}
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      disabled={isSubmitting}
                      autoComplete="tel"
                    />
                    {fieldError("phone") && (
                      <span className="dv-lead-modal__field-error">
                        {fieldError("phone")}
                      </span>
                    )}
                  </div>

                  {/* Privacy text */}
                  <p className="dv-lead-modal__privacy">
                    Your info will be shared with{" "}
                    <strong>{builderName}</strong> to help you build this home.
                  </p>

                  {/* Submit button */}
                  <button
                    className="dv-lead-modal__submit"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          size={18}
                          className="dv-lead-modal__spinner"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {config.ctaText || "Save My Design"}
                      </>
                    )}
                  </button>
                </form>

                {/* Skip link */}
                {canSkip && (
                  <button
                    className="dv-lead-modal__skip"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    type="button"
                  >
                    Skip for now
                  </button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
