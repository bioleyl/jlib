import type { JlRadioGroup } from '@syware/jlib';

type Plan = 'hobby' | 'pro' | 'team';

declare function choosePlan(plan: Plan): void; // (not shown)

const plan = document.querySelector<JlRadioGroup<Plan>>('jl-radio-group.plan');
plan?.options.set([
  { label: 'Hobby', value: 'hobby' },
  { label: 'Pro', value: 'pro' },
  { label: 'Team', value: 'team' },
]);
// @ts-expect-error: 'free' is not a plan
plan?.value.set('free');
plan?.events.register('change', (value) => choosePlan(value)); // value: Plan
