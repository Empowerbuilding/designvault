import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, CheckCircle, Loader2, Sparkles } from "lucide-react";
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

// ── Lead routing questions (lead monetization — config-gated, Barnhaus only) ──

const PROJECT_TYPE_OPTIONS = [
  { value: "custom_home", label: "Custom home" },
  { value: "barndominium", label: "Barndominium" },
  { value: "shop_garage", label: "Shop / garage" },
  { value: "unsure", label: "Not sure" },
];

const BUDGET_OPTIONS = [
  { value: "under_150k", label: "Under $150k" },
  { value: "150_300k", label: "$150–300k" },
  { value: "300_600k", label: "$300–600k" },
  { value: "600k_1m", label: "$600k–$1M" },
  { value: "1m_3m", label: "$1M–$3M" },
  { value: "3m_plus", label: "$3M+" },
  { value: "unsure", label: "Not sure" },
];

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
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [projectStage, setProjectStage] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [kitConsent, setKitConsent] = useState(false);
  const [kitAnswered, setKitAnswered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const showRouting = config.enableRoutingQuestions === true;
  const showKitOffer =
    showRouting &&
    (budgetRange === "under_150k" ||
      projectType === "shop_garage" ||
      projectType === "barndominium");
  const [skipCount, setSkipCount] = useState(getSkipCount);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setSmsOptIn(false);
      setProjectStage("");
      setProjectType("");
      setBudgetRange("");
      setKitConsent(false);
      setKitAnswered(false);
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
      projectStage,
      smsOptIn,
      projectType: showRouting ? projectType : "",
      budgetRange: showRouting ? budgetRange : "",
      kitConsent: showRouting && showKitOffer ? kitConsent : false,
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

  const postCaptureExtra = 3; // hardLimit - maxFree is always 3

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
                <h2 className="dv-lead-modal__title">Design Saved — {postCaptureExtra} Credits Unlocked!</h2>
                <p className="dv-lead-modal__subtitle">
                  Your custom design is on its way to your inbox. Plus you've got {postCaptureExtra} more AI customizations to try.
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* Header */}
                <div className="dv-lead-modal__header">
                  <Sparkles size={24} className="dv-lead-modal__header-icon" />
                  <h2 className="dv-lead-modal__title">
                    Save Your Design & Unlock {postCaptureExtra} More
                  </h2>
                  <p className="dv-lead-modal__subtitle">
                    We'll email your custom design for{" "}
                    <strong>{plan.title}</strong> — plus you'll get{" "}
                    {postCaptureExtra} more AI credits to keep customizing.
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
                    <label className="dv-lead-modal__sms-consent">
                      <input
                        type="checkbox"
                        className="dv-lead-modal__sms-checkbox"
                        checked={smsOptIn}
                        onChange={(e) => setSmsOptIn(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span>
                        I agree to receive texts and calls from Barnhaus Steel
                        Builders about my project, using automated technology.
                        Msg frequency varies. Reply STOP to opt out, HELP for
                        help.
                      </span>
                    </label>
                  </div>

                  {/* Privacy text */}
                  <p className="dv-lead-modal__privacy">
                    Your info will be shared with{" "}
                    <strong>{builderName}</strong> to help you build this home.
                  </p>
                  <p className="dv-lead-modal__privacy">
                    By submitting, you agree to our Terms of Service and Privacy
                    Policy. If we connect you with a provider, we may be
                    compensated.
                  </p>


                  {/* Project Stage */}
                  <div className="dv-lead-modal__field">
                    <p className="dv-lead-modal__privacy" style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'inherit' }}>
                      Where are you in your project?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {[
                        { value: 'gathering_ideas', label: "I'm just starting to gather ideas." },
                        { value: 'concept_budget', label: "I have a rough idea and need a 3D Concept & Budget Study to get started." },
                        { value: 'ready_for_bid', label: "I have full architectural plans and am ready for a construction bid." }
                      ].map((option) => (
                        <label key={option.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="projectStage"
                            value={option.value}
                            checked={projectStage === option.value}
                            onChange={(e) => setProjectStage(e.target.value)}
                            disabled={isSubmitting}
                            style={{ marginTop: '0.2rem', flexShrink: 0, accentColor: 'var(--dv-accent, #B8860B)' }}
                          />
                          <span className="dv-lead-modal__privacy" style={{ margin: 0 }}>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Lead routing questions (lead monetization — config-gated) */}
                  {showRouting && (
                    <div className="dv-lead-modal__field">
                      <p className="dv-lead-modal__privacy" style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'inherit' }}>
                        What are you planning to build?
                      </p>
                      <div className="dv-lead-modal__pill-row">
                        {PROJECT_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`dv-lead-modal__pill ${projectType === opt.value ? "dv-lead-modal__pill--selected" : ""}`}
                            onClick={() => setProjectType(projectType === opt.value ? "" : opt.value)}
                            disabled={isSubmitting}
                          >
                            {projectType === opt.value ? "\u2713 " : ""}{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showRouting && (
                    <div className="dv-lead-modal__field">
                      <p className="dv-lead-modal__privacy" style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'inherit' }}>
                        What's your budget range (roughly)?
                      </p>
                      <div className="dv-lead-modal__pill-row">
                        {BUDGET_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`dv-lead-modal__pill ${budgetRange === opt.value ? "dv-lead-modal__pill--selected" : ""}`}
                            onClick={() => setBudgetRange(budgetRange === opt.value ? "" : opt.value)}
                            disabled={isSubmitting}
                          >
                            {budgetRange === opt.value ? "\u2713 " : ""}{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showKitOffer && (
                    <div className="dv-lead-modal__kit-offer">
                      <p className="dv-lead-modal__privacy" style={{ margin: 0 }}>
                        💡 <strong>On a tighter budget?</strong> Steel building kits
                        can stretch it a lot further — many of our customers go this route.
                      </p>
                      <p className="dv-lead-modal__privacy" style={{ marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                        Want us to connect you with kit suppliers?
                      </p>
                      <div className="dv-lead-modal__pill-row">
                        <button
                          type="button"
                          className={`dv-lead-modal__pill ${kitAnswered && kitConsent ? "dv-lead-modal__pill--selected" : ""}`}
                          onClick={() => { setKitConsent(true); setKitAnswered(true); }}
                          disabled={isSubmitting}
                        >
                          {kitAnswered && kitConsent ? "\u2713 " : ""}Yes, connect me
                        </button>
                        <button
                          type="button"
                          className={`dv-lead-modal__pill ${kitAnswered && !kitConsent ? "dv-lead-modal__pill--selected" : ""}`}
                          onClick={() => { setKitConsent(false); setKitAnswered(true); }}
                          disabled={isSubmitting}
                        >
                          {kitAnswered && !kitConsent ? "\u2713 " : ""}No thanks
                        </button>
                      </div>
                    </div>
                  )}

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
                        <Save size={16} />
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
