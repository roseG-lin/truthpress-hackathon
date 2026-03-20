"use strict";
// ============================================
// empathy-demo - Demo payload for empathy API
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_EMPATHY_BACKGROUND = exports.DEMO_EMPATHY_FEEDBACK = void 0;
exports.buildEmpathyDemoPayload = buildEmpathyDemoPayload;
exports.DEMO_EMPATHY_FEEDBACK = "我作为偏远地区的学生，经常感到被忽视，希望你能更多理解这种处境。";
exports.DEMO_EMPATHY_BACKGROUND = "我来自小城市，教育资源很少，担心被遗忘在技术进步之外。";
function buildEmpathyDemoPayload(originalContent) {
    return {
        originalContent,
        feedback: exports.DEMO_EMPATHY_FEEDBACK,
        background: exports.DEMO_EMPATHY_BACKGROUND,
        userFeedback: exports.DEMO_EMPATHY_FEEDBACK,
        userBackground: exports.DEMO_EMPATHY_BACKGROUND,
    };
}
