"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNackSuppportForOpus = void 0;
/**
 * This function adds RTCP NACK support for OPUS codec in given capabilities.
 */
function addNackSuppportForOpus(rtpCapabilities) {
    var _a;
    for (const codec of (rtpCapabilities.codecs || [])) {
        if ((codec.mimeType.toLowerCase() === 'audio/opus' ||
            codec.mimeType.toLowerCase() === 'audio/multiopus') &&
            !((_a = codec.rtcpFeedback) === null || _a === void 0 ? void 0 : _a.some((fb) => fb.type === 'nack' && !fb.parameter))) {
            if (!codec.rtcpFeedback) {
                codec.rtcpFeedback = [];
            }
            codec.rtcpFeedback.push({ type: 'nack' });
        }
    }
}
exports.addNackSuppportForOpus = addNackSuppportForOpus;
