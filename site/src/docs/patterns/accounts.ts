import { list, section, table, text } from '../pattern-kit';

import type { PatternDoc } from '../../types/patterns.types';

export const accounts: PatternDoc = {
  components: ['jl-auth-layout', 'jl-account-button', 'jl-input', 'jl-alert', 'jl-select', 'jl-chip-group'],
  icon: 'user',
  label: 'Accounts and settings',
  lead: 'Signing in, choosing a password, changing the theme or the language: people do these in every app, so they look and read the same in all of them.',
  path: '/patterns/accounts',
  sections: [
    section(
      'Signing in',
      list(
        "The shared layout, `jl-auth-layout`: on the left, a dark panel with the app's icon and wordmark, a headline, one sentence on what the app does, three points, and the SyWare mark large and faint; on the right, the form. On a phone, the form under a band with the brand.",
        'The heading is "Sign in", with one line on which account to use: "Use the account your administrator gave you."',
        'The fields the app signs in with (an email address or a username), and the password with its show button. No asterisks.',
        'A wrong answer shows in a `jl-alert` above the fields, without saying which of the two was wrong.',
        'Without a reset by email, the page says who resets a password: "Forgot it? Ask an administrator of your company."',
        'An app in several languages offers them under the form.'
      )
    ),
    section(
      'The session',
      list(
        'A first sign-in with a temporary password leads to "Choose your password" before anything else.',
        'A session that ends leads to the sign-in page with the reason, then back to the page people were on. See [Loading, empty and errors](/patterns/states).',
        'Signing out asks nothing, and lands on the sign-in page.'
      )
    ),
    section(
      'My account and Settings',
      text('Two pages with two names, in every app:'),
      table(
        ['Page', 'Holds', 'For'],
        [
          '**My account**',
          'The person: name, email or username, role and what it allows, language, appearance, password, **Sign out**.',
          'Everyone, from their name at the bottom of the side nav.',
        ],
        [
          '**Settings**',
          'The company or the installation: currency, connections, scanning, AI models.',
          'Administrators, in the Administration group.',
        ]
      ),
      text(
        "One page called Settings that holds both the password of the person and the AI of the company mixes the two: people look for their own settings, administrators for the company's."
      )
    ),
    section(
      'Appearance and language',
      list(
        'Every app offers **Appearance**, "As my device", "Light" and "Dark", in My account and in the command palette.',
        'Every app in more than one language offers **Language** in My account and on the sign-in page, each language named in its own words ("Français", "Deutsch").',
        'Both apply at once and are remembered on the device.'
      )
    ),
    section(
      'Signing out',
      text(
        'From the menu of the person, the command palette and My account, as a secondary button: signing out destroys nothing, so it is not red.'
      )
    ),
  ],
  summary: 'Signing in, the session, My account apart from Settings, theme and language.',
  title: 'Accounts and settings',
};
