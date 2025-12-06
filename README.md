## Tab Group Shortcut

Chrome Extension that adds a shortcut to group current tab.

### Features

- Press `Ctrl+G` to group current tab.
- Group multiple tabs, by selecting tabs pressing `Ctrl` or `Shift`.
- Ungroup, or combine tab into group with same shortcut.

### How to build

Get Node.js :

[https://nodejs.org/en/download](https://nodejs.org/en/download)

Get pnpm package manager :

[https://pnpm.io/installation](https://pnpm.io/installation)

Install dependencies and build :

```
pnpm i && pnpm build:zip
```

#### Applying Build

- Go to `chrome://extensions/`
- Turn developer mode on
- Drop zip/folder or click 'Load unpacked' and select folder

### Credits

Fonts

- Ubuntu
  - Ubuntu Regular
  - [https://fonts.google.com/specimen/Ubuntu](https://fonts.google.com/specimen/Ubuntu)
  - License: UBUNTU FONT LICENCE Version 1.0

Icons

- All icons
  - [Material Symbols (https://fonts.google.com/icons)](https://fonts.google.com/icons)
  - License: Apache License 2.0

CSS

- Slider checkbox at options page
  - modified based on [https://uiverse.io/mrhyddenn/old-fish-66](https://uiverse.io/mrhyddenn/old-fish-66)
  - By: [mrhyddenn](https://uiverse.io/profile/mrhyddenn)
  - License: MIT License
