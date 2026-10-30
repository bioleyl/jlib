import type { JlTabBar } from '@syware/jlib';

type Place = 'home' | 'jobs' | 'inbox';

declare function goTo(place: Place): void; // (not shown)

const tabs = document.querySelector<JlTabBar<Place>>('jl-tab-bar');
tabs?.items.set([
  { icon: 'house', id: 'home', label: 'Home' },
  { icon: 'briefcase', id: 'jobs', label: 'Jobs' },
  { badge: 3, icon: 'inbox', id: 'inbox', label: 'Inbox' },
]);
// @ts-expect-error: 'settings' is not a place of the tab bar
tabs?.value.set('settings');
tabs?.events.register('select', (place) => goTo(place)); // place: Place
