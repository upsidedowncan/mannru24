# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/verification.spec.ts >> Bulk delete and Icons Verification
- Location: tests/verification.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[id="phone"]')

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - generic [ref=e16]:
            - img [ref=e17]
            - generic "Latest available version is detected (16.2.6)." [ref=e19]: Next.js 16.2.6
            - generic [ref=e20]: Turbopack
          - img
      - dialog "Build Error" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Build Error
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - link "Go to related documentation" [ref=e34] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/messages/module-not-found
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: "Module not found: Can't resolve '@/components/GlobalOverlays'"
          - generic [ref=e49]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e56]: ./app/layout.tsx (7:1)
              - button "Open in editor" [ref=e57] [cursor=pointer]:
                - img [ref=e59]
            - generic [ref=e62]:
              - generic [ref=e63]: "Module not found: Can't resolve '@/components/GlobalOverlays'"
              - generic [ref=e64]: 5 |
              - text: import
              - generic [ref=e65]: "{"
              - text: MarketProvider
              - generic [ref=e66]: "}"
              - text: from "@/lib/market"
              - generic [ref=e67]: ;
              - generic [ref=e68]: 6 |
              - text: import
              - generic [ref=e69]: "{"
              - text: LevelUpDialog
              - generic [ref=e70]: "}"
              - text: from "@/components/LevelUpDialog"
              - generic [ref=e71]: ;
              - text: ">"
              - generic [ref=e72]: 7 |
              - text: import
              - generic [ref=e73]: "{"
              - text: GlobalOverlays
              - generic [ref=e74]: "}"
              - text: from "@/components/GlobalOverlays"
              - generic [ref=e75]: ;
              - generic [ref=e76]: "|"
              - text: ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              - generic [ref=e77]: 8 |
              - generic [ref=e78]: 9 |
              - text: const
              - generic [ref=e79]: geistSans =
              - text: Geist
              - generic [ref=e80]: "({"
              - generic [ref=e81]: 10 |
              - generic [ref=e82]: "variable:"
              - text: "\"--font-geist-sans\""
              - generic [ref=e83]:
                - text: ", Import map: aliased to relative './components/GlobalOverlays' inside of [project]/"
                - link "https://nextjs.org/docs/messages/module-not-found" [ref=e84] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/messages/module-not-found
        - generic [ref=e85]: "1"
        - generic [ref=e86]: "2"
    - generic [ref=e91] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e92]:
        - img [ref=e93]
      - button "Open issues overlay" [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]: "0"
          - generic [ref=e100]: "1"
        - generic [ref=e101]: Issue
  - alert [ref=e102]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Bulk delete and Icons Verification', async ({ page }) => {
  4  |   // Login
  5  |   await page.goto('http://localhost:3000/login');
> 6  |   await page.fill('input[id="phone"]', '+79000000000');
     |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
  7  |   await page.click('button[type="submit"]');
  8  |   await page.fill('input[id="password"]', 'password');
  9  |   await page.click('button[type="submit"]');
  10 |
  11 |   // Wait for dashboard
  12 |   await expect(page).toHaveURL(/.*dashboard/);
  13 |
  14 |   // Go to cards page
  15 |   await page.goto('http://localhost:3000/dashboard/cards');
  16 |   await expect(page.locator('h1:has-text("Карты")')).toBeVisible();
  17 |
  18 |   // Create a few cards first if none exist or just for testing
  19 |   // But let's check if "Select All" exists
  20 |   const selectAllBtn = page.locator('button:has-text("Выбрать все")');
  21 |   if (await selectAllBtn.isVisible()) {
  22 |       await selectAllBtn.click();
  23 |       await expect(page.locator('text=выбрано')).toBeVisible();
  24 |   }
  25 |
  26 |   // Check sidebar icons
  27 |   const sidebar = page.locator('aside');
  28 |   await expect(sidebar).toBeVisible();
  29 | });
  30 |
```