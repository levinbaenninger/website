// Happy DOM 21 rejects `Animation.finished` on cancel without marking the
// promise handled, unlike browsers (the Web Animations spec marks it handled).
// Motion cancels animations on unmount, so each cancel surfaced as an unhandled
// rejection. Remove once https://github.com/capricorn86/happy-dom/issues/2412
// is fixed.
const settleCancelledFinish = async (
  finished: Promise<Animation>
): Promise<void> => {
  try {
    await finished;
  } catch {
    // Cancellation is expected; browsers do not report it either.
  }
};

// eslint-disable-next-line typescript/unbound-method -- Re-bound via `call` below.
const cancelAnimation = Animation.prototype.cancel;

Animation.prototype.cancel = function cancel(this: Animation): void {
  void settleCancelledFinish(this.finished);
  cancelAnimation.call(this);
};
