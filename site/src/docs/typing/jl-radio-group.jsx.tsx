import { Jadis } from '@jadis/core';
import { JlRadioGroup } from '@syware/jlib';

import type { RadioOption } from '@syware/jlib';

type Plan = 'hobby' | 'pro' | 'team';

declare function choosePlan(plan: Plan): void; // (not shown)

const PLANS: RadioOption<Plan>[] = [
  { description: 'For one person', label: 'Hobby', value: 'hobby' },
  { description: 'For a small business', label: 'Pro', value: 'pro' },
  { description: 'For a whole company', label: 'Team', value: 'team' },
];

export class PlanStep extends Jadis {
  static readonly selector = 'plan-step';

  private readonly _refs = this.useRefs((ref) => ({ plan: ref<JlRadioGroup<Plan>>('.plan') }));

  templateHtml(): Node {
    // value="free" does not compile. Without <Plan>, the type is read from the options.
    return <JlRadioGroup<Plan> class="plan" label="Plan" options={PLANS} value="pro" variant="cards" />;
  }

  onConnect(): void {
    this._refs.plan.events.register('change', (value) => choosePlan(value));
  }
}

PlanStep.register();
