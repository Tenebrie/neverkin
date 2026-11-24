---
name: write-tests
description: Use whenever writing automated tests (unit, integration or e2e) for new or changed code. Hands the test writing to a separate agent that works from the behaviour contract, so tests check what the app requires and not how the code happens to be written.
---

# Writing tests

Do not write the tests yourself. You know the implementation, so your tests would repeat its assumptions. Write a brief and hand it to the `test-writer` agent.

Exception: a failing test that reproduces a reported bug, written before the fix. Write that one yourself.

## 1. Write the brief

Show the brief in chat before starting the agent, so it can be corrected.

The brief contains:

- **Request**: the user's original words, quoted, not paraphrased.
- **Contract**: the expected behaviours as a short list. Each line is something the app requires, visible from outside the code. No line describes how the code works.
- **Public surface**: what to test through. A route with its request and response shape, a component with its props and what it renders, a hook with its inputs and outputs, or the user actions and selectors for e2e.
- **Location**: where the tests go, and one or two existing test files in the same package as a style reference.

Leave out how the implementation works, which branches it has, and which cases you already handled.

## 2. Run the agent

Start one `test-writer` agent with the brief. One agent per brief, no fan-out.

## 3. Judge the failures

For each failing test, decide who is right by checking it against the contract and the user's words, not against the code:

- **The code is wrong**: fix the code. Leave the test as it is.
- **The test is wrong**: it misread the brief, or the setup is broken. Fix the test.
- **The contract does not say**: ask the user.

Never change an expectation only because the code returns something else.

Also read the passing tests. Remove or fix any that spy on internals, would break under a correct rewrite, or do not match the style of the existing tests in that package.

## 4. Report

- the brief that was used
- the tests that were added
- for each test that failed: one line with the verdict and what changed ("real bug, fixed in X" or "test assumed A, the contract says B, test changed")
- open questions the agent raised
