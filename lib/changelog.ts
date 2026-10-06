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
