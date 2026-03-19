// ============================================
// empathy-demo - Demo payload for empathy API
// ============================================

export const DEMO_EMPATHY_FEEDBACK = "我作为偏远地区的学生，经常感到被忽视，希望你能更多理解这种处境。";
export const DEMO_EMPATHY_BACKGROUND = "我来自小城市，教育资源很少，担心被遗忘在技术进步之外。";

export function buildEmpathyDemoPayload(originalContent: string) {
  return {
    originalContent,
    feedback: DEMO_EMPATHY_FEEDBACK,
    background: DEMO_EMPATHY_BACKGROUND,
    userFeedback: DEMO_EMPATHY_FEEDBACK,
    userBackground: DEMO_EMPATHY_BACKGROUND,
  };
}
