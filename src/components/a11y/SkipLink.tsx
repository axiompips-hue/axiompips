// File: src/components/a11y/SkipLink.tsx

/**
 * Skip to main content link for keyboard navigation.
 * This allows keyboard users to skip repetitive navigation.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}