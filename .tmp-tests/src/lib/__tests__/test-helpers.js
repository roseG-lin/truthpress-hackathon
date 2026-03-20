"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCases = runCases;
async function runCases(label, cases) {
    let failed = 0;
    console.log(`\n# ${label}`);
    for (const testCase of cases) {
        try {
            await testCase.run();
            console.log(`ok - ${testCase.name}`);
        }
        catch (error) {
            failed += 1;
            console.error(`not ok - ${testCase.name}`);
            console.error(error);
        }
    }
    if (failed > 0) {
        throw new Error(`${label}: ${failed} test(s) failed`);
    }
}
