export const CHAT_EASE = [0.22, 1, 0.36, 1] as const

export const chatMessageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: CHAT_EASE } },
}

export const chatEmptyFadeContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
}

export const chatEmptyFadeItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: CHAT_EASE } },
}

/** Insights opener — slightly longer float-in after async load */
export const insightsRevealMotion = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: CHAT_EASE },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.2 } },
}
