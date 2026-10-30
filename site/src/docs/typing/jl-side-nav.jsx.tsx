import { Jadis } from '@jadis/core';
import { JlSideNav } from '@syware/jlib';

import type { SideNavSection } from '@syware/jlib';

type Place = 'jobs' | 'people' | 'teams' | 'settings';

declare function goTo(place: Place): void; // (not shown)

const SECTIONS: SideNavSection<Place>[] = [
  {
    items: [
      { icon: 'briefcase', id: 'jobs', label: 'Jobs' },
      { children: [{ id: 'teams', label: 'Teams' }], icon: 'users', id: 'people', label: 'People' },
    ],
  },
  { items: [{ icon: 'settings', id: 'settings', label: 'Settings' }], label: 'Account' },
];

export class AppNav extends Jadis {
  static readonly selector = 'app-nav';

  private readonly _refs = this.useRefs((ref) => ({ nav: ref<JlSideNav<Place>>('.nav') }));

  templateHtml(): Node {
    // value="billing" does not compile.
    return <JlSideNav<Place> slot="nav" class="nav" sections={SECTIONS} value="jobs" collapsible />;
  }

  onConnect(): void {
    this._refs.nav.events.register('select', (place) => goTo(place));
  }
}

AppNav.register();
