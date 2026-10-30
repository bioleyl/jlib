import { Jadis } from '@jadis/core';
import { JlTabBar } from '@syware/jlib';

import type { TabBarItem } from '@syware/jlib';

type Place = 'home' | 'jobs' | 'inbox';

declare function goTo(place: Place): void; // (not shown)

const PLACES: TabBarItem<Place>[] = [
  { icon: 'house', id: 'home', label: 'Home' },
  { icon: 'briefcase', id: 'jobs', label: 'Jobs' },
  { badge: 3, icon: 'inbox', id: 'inbox', label: 'Inbox' },
];

export class AppTabs extends Jadis {
  static readonly selector = 'app-tabs';

  private readonly _refs = this.useRefs((ref) => ({ tabs: ref<JlTabBar<Place>>('.tabs') }));

  templateHtml(): Node {
    // value="settings" does not compile.
    return <JlTabBar<Place> class="tabs" items={PLACES} value="home" more="More" />;
  }

  onConnect(): void {
    this._refs.tabs.events.register('select', (place) => goTo(place));
  }
}

AppTabs.register();
