import type { JlSideNav } from '@syware/jlib';

type Place = 'jobs' | 'people' | 'teams' | 'settings';

declare function goTo(place: Place): void; // (not shown)

const nav = document.querySelector<JlSideNav<Place>>('jl-side-nav');
nav?.sections.set([
  {
    items: [
      { icon: 'briefcase', id: 'jobs', label: 'Jobs' },
      { children: [{ id: 'teams', label: 'Teams' }], icon: 'users', id: 'people', label: 'People' },
    ],
  },
  { items: [{ icon: 'settings', id: 'settings', label: 'Settings' }], label: 'Account' },
]);
// @ts-expect-error: 'billing' is not a place of the navigation
nav?.value.set('billing');
nav?.events.register('select', (place) => goTo(place)); // place: Place, nested ones included
