export type AsyncTestCase = {
  name: string;
  run: () => Promise<void> | void;
};

export async function runCases(label: string, cases: AsyncTestCase[]): Promise<void> {
  let failed = 0;
  console.log(`\n# ${label}`);

  for (const testCase of cases) {
    try {
      await testCase.run();
      console.log(`ok - ${testCase.name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${testCase.name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    throw new Error(`${label}: ${failed} test(s) failed`);
  }
}
