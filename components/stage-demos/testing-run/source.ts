// The test on screen: the docs' first Vitest test (Testing → Setup), written
// for the echo command the other demos use. Same API, same shape; only the
// command and its option change, wrapped as Prettier would at a narrower
// print width. Kept out of the client component so the server page can
// highlight it.
export const TEST_FILE = "test/echo.test.ts";

export const TEST_SOURCE = `import { createMockBot } from '@slipher/testing';
import { expect, test } from 'vitest';
import EchoCommand from '../src/commands/echo';

test('echo repeats the message', async () => {
  await using bot = await createMockBot({
    commands: [EchoCommand],
  });
  const result = await bot.slash({
    name: 'echo',
    options: { message: 'hello from the core' },
  });

  expect(result.content).toBe('hello from the core');
});`;
