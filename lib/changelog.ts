// What changed on the portal, newest first. The first entry IS the current
// version: the sidebar and /changelog read it from here, and package.json's
// "version" must match it. See AGENTS.md › Versioning before adding an entry.
export type Release = {
  version: string;
  date: string; // YYYY-MM-DD, Sydney
  title: string;
  added?: string[];
  improved?: string[];
  fixed?: string[];
};

export const CHANGELOG: Release[] = [
  {
    version: '1.26.0',
    date: '2026-10-22',
    title: 'Automations',
    added: [
      'New Automations section in the sidebar, listing every job that runs on its own and how its last run went (healthy, failed or never run).',
      'Each automation has its own page with the last run, how many items it updated, any error, and the last two days of runs.',
      'Inventory → Shopify: stock from each branch now goes to its own Plumbers HQ location in Shopify, ready for Uber delivery. Products at 0 stock can still be bought.',
    ],
    improved: [
      'The Inventory page now opens Automations, where the ShipStation and Shopify stock syncs live.',
    ],
  },
  {
    version: '1.25.0',
    date: '2026-10-21',
    title: 'Order routing',
    added: [
      'New Order routing page under Orders: every new online order on branch 20, checked against stock at every branch, with what should happen to it (pick slip, branch handover, PO or direct-delivery PO). Nothing is sent to a supplier or a printer until you approve it.',
      'Map view shows each step as a block on a floor plan, with every order sitting where it is now. Click an order to see its route, its flags and its history, and approve or reject it from the side panel.',
      'Table view lists the same orders with a tab for each state. Tick several and press Approve selected to approve them in one go.',
      'Each order has its own page: change the action, edit the email to the supplier, then approve, reject or retry.',
      'Order states page explains every state, who acts next, and whether Frameworks has been changed yet.',
    version: '1.24.0',
    date: '2026-10-19',
    title: 'Works on phones',
    improved: [
      'The portal now works on phones. Tables show as a short list, one card per order, payment or SKU, with just the key details (like status, amount and date). Tap a card to see everything about it. Nothing is cut off and there’s no scrolling sideways.',
      'On a phone, the buttons at the top of a page sit on their own row under the page name. On ShipStation the status buttons become one dropdown.',
      'The menu closes by itself once you pick a page on a phone.',
      'Filters, search boxes and pop-up windows fit a phone screen, buttons are easier to tap, and tapping a search box no longer zooms the page.',
      'Page numbers on a phone show as ‹ Page 3 of 12 ›, and date pickers show one month at a time.',
      'On a phone, sort Orders, Payments, Contribution, ShipStation and B2B Sync with the Sort dropdown above the list (for example "Total, highest first").',
    ],
    fixed: [
      'The Released column on Orders now shows each order’s release status. Before, it was empty and the Created dates showed under the wrong heading.',
    ],
  },
  {
    version: '1.23.1',
    date: '2026-10-16',
    title: 'Daily movement fixes',
    fixed: [
      'On Daily movement, Payments at the top of the page now takes you back to the Payments page.',
      'Daily movement CSV: sales made between midnight and 1 am were dated the next day, so some days didn’t agree with Shopify. Dates are now the Shopify day (for example 2026-10-14) and show as dates in Excel.',
      'Daily movement no longer lists the payout to the bank (a big negative "Transfer" line), which threw out that day’s total.',
    ],
  },
  {
    version: '1.23.0',
    date: '2026-10-16',
    title: 'Daily Shopify movement',
    added: [
      'New Daily movement page under Payments: every Shopify Payments transaction with its Transaction date, Order, Amount, Fee and Net, straight from Shopify. No need to log in to each store to download it.',
      'Pick a store and a date range (Shopify transaction date, Sydney time), then Download CSV to get the same rows as a spreadsheet.',
    ],
  },
  {
    version: '1.22.1',
    date: '2026-10-13',
    title: 'Held-to dates now update',
    fixed: ['Held-to dates on the ShipStation page now fill in. Open orders are checked in Frameworks every 10 minutes, and any with a future Date Required are held in ShipStation until that date.'],
  },
  {
    version: '1.22.0',
    date: '2026-10-12',
    title: 'Refunds page',
    added: [
      'New Refunds page: every Shopify refund next to the Frameworks credit note or voided order for the same order, so refunds can be reconciled without a spreadsheet.',
      'Each refund is marked Matched, Order voided, Amount differs, Not in Frameworks or Frameworks only. Show what needs attention hides the ones that match.',
    ],
  },
  {
    version: '1.21.2',
    date: '2026-10-09',
    title: 'Invoiced orders fulfilled in Shopify too',
    fixed: ['Orders marked shipped in ShipStation from the Invoiced outside ShipStation tab, by hand or automatically, are now also marked fulfilled in Shopify instead of staying Unfulfilled.'],
  },
  {
    version: '1.21.1',
    date: '2026-10-08',
    title: 'All open invoiced orders marked shipped',
    improved: ['Every order invoiced in Frameworks that is still open in ShipStation is now marked shipped automatically, not just the last 7 days.'],
  },
  {
    version: '1.21.0',
    date: '2026-10-08',
    title: 'Invoiced orders marked shipped in ShipStation automatically',
    added: [
      'Orders invoiced in Frameworks are marked shipped in ShipStation automatically every 30 minutes, so they stop sitting in Awaiting shipment. Check now does it straight away.',
      'The Invoiced outside ShipStation tab lists every order marked shipped automatically, and any ShipStation refused with the reason.',
    ],
  },
  {
    version: '1.20.1',
    date: '2026-10-07',
    title: 'Tidier sidebar',
    improved: ['The sidebar is grouped into Orders, Products & stock and Admin.'],
  },
  {
    version: '1.20.0',
    date: '2026-10-07',
    title: 'Bulk SKU search and catalogue numbers on the SKU audit',
    added: [
      'Search SKUs on the SKU audit: paste a list of SKUs or vendor catalogue numbers to see just those products.',
      'The SKU audit shows each product’s vendor catalogue no. under its SKU, and the search box finds it.',
    ],
    improved: [
      'On the SKU audit problem tabs, products that are live on Shopify are listed first.',
    ],
  },
  {
    version: '1.19.1',
    date: '2026-10-07',
    title: 'SKU audit finds more Shopify listings',
    fixed: [
      'SKU audit no longer says "Not listed" for a product that is on Shopify under the same SKU or catalogue no. as another product.',
    ],
  },
  {
    version: '1.18.1',
    date: '2026-10-07',
    title: 'Search Orders by Frameworks no. as shown',
    improved: ['Order search finds a Frameworks no. typed or pasted with its -0 on the end, like 98765-0.'],
  },
  {
    version: '1.18.0',
    date: '2026-10-07',
    title: 'Released column and SKU search on Orders',
    added: [
      'Orders shows whether each order has been released in Frameworks: Released, Queued, Release failed or Not released.',
      'Search SKUs on Orders: paste a list of SKUs to see every order that has any of them.',
    ],
  },
  {
    version: '1.16.1',
    date: '2026-10-06',
    title: 'Search SKU audit by vendor',
    improved: ['The SKU audit search box also finds SKUs by vendor name.'],
  },
  {
    version: '1.16.0',
    date: '2026-10-06',
    title: 'Vendor on the SKU audit',
    added: [
      'SKU audit Vendor column, from Catsy’s Frameworks Vendor field. Also in the CSV, Excel and copied table.',
      'Vendor filter: search vendors and tick one or more (or "No vendor set"), with how many SKUs each has.',
    ],
  },
  {
    version: '1.15.1',
    date: '2026-10-06',
    title: 'Add user pop-up spacing',
    fixed: ['The Add user pop-up’s fields ran to its edges; they now line up with the title and buttons.'],
  },
  {
    version: '1.15.0',
    date: '2026-10-06',
    title: 'Roles, profiles and a detailed activity log',
    added: [
      'Roles now mean something: Viewers see every page but can’t change anything, Operators can press every day-to-day action, Admins also manage people.',
      'A page for each person (from Users): change their role, reset their password, deactivate them, and see everything they did.',
      'My profile in the account menu: your role, change your own password, and your own activity.',
      'The activity log now shows the page each button was pressed on, the order or person it was pressed on, what was sent, what came back, and for user changes the before and after (e.g. Role: Viewer → Operator).',
    ],
    improved: [
      'Redesigned Users page: role summary cards, search, last seen, and adding people in a pop-up with each role explained.',
      'Buttons you can’t use are hidden, and the admin links only show for admins.',
    ],
    fixed: ['Admins can’t accidentally remove their own admin access or deactivate themselves.'],
  },
  {
    version: '1.14.1',
    date: '2026-10-06',
    title: 'Log out works again',
    fixed: ['Log out in the account menu did nothing; it now signs you out and goes to the login page.'],
  },
  {
    version: '1.14.0',
    date: '2026-10-06',
    title: 'Contribution on the dashboard',
    added: [
      'Dashboard contribution card: contribution against the period before, with net sales, margin, GP % and low-GP orders.',
      'Switch the contribution card between the last 7 and 30 days.',
      'Contribution split by store, each linking to that store’s report.',
      'The five lowest-GP orders for the period, each linking to the order.',
    ],
    improved: ['Team activity is now "Recent actions" at the bottom of the dashboard, without sign-ins and sign-outs.'],
  },
  {
    version: '1.13.1',
    date: '2026-10-06',
    title: 'Dashboard fixes',
    improved: ['Dashboard shows when the last order came in from Shopify, instead of the last manual sync.'],
    fixed: ['Dashboard 7-day order chart showed as unavailable.'],
  },
  {
    version: '1.13.0',
    date: '2026-10-06',
    title: 'New dashboard, user activity and changelog',
    added: [
      'Dashboard "Needs attention" list: failed orders, failed ShipStation jobs, stuck pending orders, failed B2B syncs and SKU audit problems, each linking to where you fix it.',
      'Dashboard orders panel: today’s orders per store and a 7-day processed / pending / failed chart.',
      'Dashboard system health strip for the bridge, Shopify pull, B2B price sync and SKU audit.',
      'Dashboard team activity: who did what recently.',
      'Admin › User activity: each person’s page views, most visited pages and actions over 7, 30 or 90 days.',
      'This changelog, with the version shown in the sidebar.',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-10-06',
    title: 'SKU audit exports',
    added: ['SKU audit Export menu: CSV, Excel, copy the whole table, or copy just the SKUs.'],
  },
  {
    version: '1.11.0',
    date: '2026-10-05',
    title: 'SKU audit',
    added: [
      'SKU Audit page comparing Catsy, Frameworks and each Shopify store.',
      'Stocked / Non-stocked status with per-branch types, and per-store Shopify status and Catsy flag.',
      'Filter menus on each store column, a run log, and a help dialog.',
      'Catsy title shown with the Frameworks description underneath.',
    ],
    improved: ['The table loads 500 rows at a time from the server, so 80k+ SKUs stay fast.'],
    fixed: ['Unknown Catsy flags are ignored instead of counted as mismatches.'],
  },
  {
    version: '1.10.0',
    date: '2026-10-02',
    title: 'ShipStation status on invoiced-outside orders',
    added: ['ShipStation status dropdown on the "Invoiced outside ShipStation" tab.'],
  },
  {
    version: '1.9.0',
    date: '2026-09-30',
    title: 'Refined tables and order details',
    added: ['Orders detail modal and bulk select.', 'Held-to dates tab on ShipStation.'],
    improved: ['Refined tables and dot status pills across the site.'],
  },
  {
    version: '1.8.0',
    date: '2026-09-29',
    title: 'Payments tools and ShipStation checks',
    added: [
      'Payments store and date filters, payment fee column and CSV download.',
      'Recheck prices dialog on Payments.',
      'ShipStation tab for orders invoiced outside ShipStation, and a missing shipments check.',
      'Manual sync dialog with a date range calendar and preview results.',
    ],
    improved: ['Loading skeletons on Orders, ShipStation, Contribution and Payments.', 'Payments loads faster (no per-row fetch).'],
  },
  {
    version: '1.7.0',
    date: '2026-09-23',
    title: 'Interface refresh',
    improved: ['New sidebar, page header, form controls and loading states.'],
    added: ['Actions menu on ShipStation jobs with a view-payload window.'],
  },
  {
    version: '1.6.0',
    date: '2026-09-16',
    title: 'Orders table upgrade',
    added: [
      'Sortable columns, row actions and numbered pagination on Orders.',
      'Copy button on order payloads.',
      'Retry failed releases on ShipStation.',
    ],
    improved: ['Missing order number check now looks at all order history, not just the current page.'],
    fixed: ['Retry buttons also catch bridge 403 and 502 errors.', 'Actions menu no longer cut off by the table edge.'],
  },
  {
    version: '1.5.0',
    date: '2026-09-08',
    title: 'Contribution GP %',
    added: ['GP % column and low-GP alert on the Contribution report.'],
  },
  {
    version: '1.4.0',
    date: '2026-09-02',
    title: 'B2B Price Sync',
    added: [
      'B2B Price Sync status page.',
      'Contribution export as CSV or JSON, and order date on the report.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-08-25',
    title: 'Contribution report',
    added: ['Contribution report page.'],
  },
  {
    version: '1.2.0',
    date: '2026-08-17',
    title: 'Payments price checks',
    added: ['Mismatch callout and filter on Payments.', 'Verify button when a payment doesn’t match the Frameworks price.', 'Retry for bridge 404 failures on Orders.'],
    fixed: ['Any Shopify / Frameworks price difference is now flagged.'],
  },
  {
    version: '1.1.0',
    date: '2026-07-28',
    title: 'Payments page',
    added: [
      'Payments page for accounts reconciliation.',
      'Duplicate and missing order numbers flagged on Orders.',
      'Total, Payment, Items and Delivery columns on Orders.',
    ],
    improved: ['You stay signed in while active instead of being logged out every 15 minutes.'],
  },
  {
    version: '1.0.0',
    date: '2026-07-02',
    title: 'Launch',
    added: [
      'Orders with filters, pagination, payload views and retry.',
      'ShipStation jobs, manual Shopify sync, dashboard and user management.',
    ],
  },
];

export const VERSION = CHANGELOG[0].version;
