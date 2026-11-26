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
    version: '1.38.1',
    date: '2026-11-26',
    title: 'Link a hand-keyed order to Frameworks; clearer order routing approvals',
    added: ['A failed order now has an "Entered in Frameworks" box. When the SKU has been fixed and the order keyed into Frameworks by hand, type its SO number (for example 21855351-0) and press Save. The order is marked processed with that Frameworks number, so it stops showing as failed and the price, contribution and invoiced checks pick it up.', 'The invalid-SKU alert email has a button that opens the order with this box ready to type in.'],
    improved: ['Order routing: "When you approve" now matches what the automation really does. Direct delivery POs, handovers to a store and requisitions are done for you; only adding a freight or minimum order fee line and combining requisitions are still by hand.', 'Order routing: the "Email to supplier" box and Subject are gone. The supplier email is sent from Frameworks with the standard wording, so nothing typed there was ever used.'],
  },
  {
    version: '1.38.0',
    date: '2026-11-17',
    title: 'Branch scorecard',
    added: ['New Branch scorecard page: every branch against its targets, built from Frameworks every Monday at 6am (End of Month in the first week of a month). Green is on target, red is off. Pick an earlier week from the list.', 'Rows that don\'t come from Frameworks yet are marked "typed in": click a cell to enter its number.', 'Copy share link gives a read-only page of the week for branch staff without a portal login: just the scorecard, no menu or other pages.', 'Download Excel on both pages saves the week as a spreadsheet, with the same green/red and any typed-in numbers.'],
  },
  {
    version: '1.37.1',
    date: '2026-12-01',
    title: 'A little Christmas',
    improved: ['From 1 December to 6 January the portal wears a small Christmas look: a garland and bow on the top bar, a Santa hat on the logo and a few decorations. Nothing moves or changes how anything works.'],
  },
  {
    version: '1.37.0',
    date: '2026-11-26',
    title: 'Supplier credits: Needs action and Pipeline views',
    added: ['Supplier credits has two views: Needs action (tabs for Needs approval, Waiting on store, With supplier, Problems and Done) and Pipeline (a board with one column per step). Pick one with the switch at the top; the page remembers your choice.', 'Each credit says in one line what approving will do, shows its lines and any warnings, and has Approve and Reject right on it.', 'Raised credits show where they are up to (store, supplier, receipted out) and the day the Stock Return is receipted out.', 'Search by credit, Stock Return number, customer, product or supplier.'],
    improved: ['Credits that need someone to step in (not raised, partly raised, supplier email failed) are collected under Problems, with a banner on the Pipeline view.', 'The page no longer says test mode: supplier credits are live.'],
  },
  {
    version: '1.36.4',
    date: '2026-11-24',
    title: 'Order routing: branch names in the stock table',
    fixed: ['On an order’s routing page, the stock table now labels branch 11 as Warehouse and branch 8 as Dandenong (they were mixed up).'],
  },
  {
    version: '1.36.3',
    date: '2026-11-23',
    title: 'Email links open the right page',
    fixed: ['Links in emails (like "Review & approve on burdens.dev") open the page straight away when you are already signed in, instead of asking you to sign in again.', 'If you do need to sign in, you land on the page the link was for, not the dashboard.'],
  },
  {
    version: '1.36.2',
    date: '2026-11-19',
    title: 'Pick-up request: branch address shown once',
    fixed: ['The pick-up request page no longer repeats the state and postcode in the branch address (it showed "Pakenham VIC 3810, VIC, 3810"). Older pick-up pages show it once too.'],
  },
  {
    version: '1.36.1',
    date: '2026-11-16',
    title: 'Not in Frameworks: manual consignments hidden',
    improved: ['Not in Frameworks no longer lists MachShip consignments without a Frameworks order. Those orders were entered in Frameworks by hand, so there is nothing to push.'],
  },
  {
    version: '1.36.0',
    date: '2026-11-16',
    title: 'MachShip: orders not in Frameworks',
    added: ['New "Not in Frameworks" tab on the MachShip page. It lists consignments manifested in MachShip whose order still isn\'t invoiced in Frameworks, for example because the sql-bridge was down when the shipment came through. Tick the ready ones and press Push to Frameworks to release them.'],
    improved: ['ShipStation is retired, so the portal now says MachShip (or "shipment job") wherever it used to say ShipStation.'],
  },
  {
    version: '1.35.0',
    date: '2026-11-16',
    title: 'Retry all failed: pick the date, see the count first',
    added: ['Retry all failed on the Dashboard has a Failed since date. It shows how many orders and ShipStation jobs failed from that date before you confirm, so only the days you pick are sent again.'],
    fixed: ['Retry all failed (and the Retry bridge errors buttons) no longer reach every failed order ever. On 14 Nov it requeued failed orders from as far back as March, which landed in Frameworks as new orders. Without a date the bridge-error buttons now only look at the last 7 days.'],
  },
  {
    version: '1.34.0',
    date: '2026-11-14',
    title: 'Retry all failed orders and ShipStation jobs in one click',
    added: ['Dashboard: a Retry all failed button that requeues every failed order and every failed ShipStation job, whatever the error. For clearing up after a bridge outage. Only the development account sees it.'],
  },
  {
    version: '1.33.0',
    date: '2026-11-12',
    title: 'Stock Returns are receipted out on the take-up date',
    added: ['7 days after the supplier is emailed (the take-up date in that email), the Stock Return is receipted out in Frameworks by itself: docket CR + the credit number, whatever is still outstanding on the PO. Supplier credits shows it as Receipted out, with the details in the credit’s history. Still on Frameworks TEST only.'],
  },
  {
    version: '1.32.0',
    date: '2026-11-12',
    title: 'Stores enter cartons and pallets, the supplier is emailed for them',
    added: [
      'When a Stock Return is raised, the store gets an email with the goods to put aside and a link. They enter the number of cartons and pallets (and their weight) and press Send: the supplier then gets the Credit Request, the take-up date 7 days out and the pick-up details. No forms to download or forward. While testing, every email goes to Bek only.',
      'The pick-up request can be printed from the same link.',
      'Supplier credits shows where each Stock Return is up to (waiting for the store, supplier emailed) with a link to its store page.',
    ],
  },
  {
    version: '1.31.0',
    date: '2026-11-11',
    title: 'Check Frameworks for new supplier credits',
    added: ['New Check Frameworks button on Supplier credits: pulls today’s completed credit notes from Frameworks now, instead of waiting for the 11:37, 2:37 and 5:37 checks. It takes a few minutes and tells you how many came in.', 'Approving a supplier credit now also emails the Stock Return (to Bek only while in test mode; nothing is printed until we go live).'],
  },
  {
    version: '1.30.0',
    date: '2026-11-10',
    title: 'Approving a supplier credit raises the Stock Return (on TEST)',
    added: ['Approving a supplier credit now raises its Stock Return in Frameworks TEST within a minute: right supplier, branch, reason and lines. The PO number shows in the credit’s history. Nothing is raised in live Frameworks yet.', 'A credit whose Stock Return failed shows the reason and can be approved again to retry.'],
    improved: ['A line that is still in stock at the branch is now marked Return to supplier, even if that supplier had other Stock Returns that week.'],
  },
  {
    version: '1.29.5',
    date: '2026-11-09',
    title: 'Supplier credit plans appear by themselves',
    improved: ['After you add a supplier credit, its plan appears on the page by itself a few seconds later. No need to refresh.'],
  },
  {
    version: '1.29.4',
    date: '2026-11-09',
    title: 'Supplier credits read straight away',
    improved: ['A supplier credit you add is now read from Frameworks within a minute, instead of waiting up to 30 minutes.'],
    fixed: ['Fuel levy and delivery lines on a credit are no longer listed as goods to check.'],
  },
  {
    version: '1.29.3',
    date: '2026-11-09',
    title: 'Inventory → ShipStation retired',
    improved: ['The Inventory → ShipStation automation has been switched off and removed from Automations and the sidebar, as shipments now go through MachShip.'],
  },
  {
    version: '1.29.2',
    date: '2026-11-06',
    title: 'ShipStation is now MachShip',
    improved: ['The ShipStation page in the sidebar is now called MachShip, as shipments now go through MachShip. Old links still work.'],
  },
  {
    version: '1.29.1',
    date: '2026-11-04',
    title: 'Close the Check Frameworks message',
    improved: ['The message after Check Frameworks has an X to close it.'],
  },
  {
    version: '1.29.0',
    date: '2026-11-04',
    title: 'Check Frameworks now',
    added: [
      'New Check Frameworks button on the Order routing page. It looks in Frameworks straight away instead of waiting for the next 15-minute run: new orders appear, orders already done by hand close, and every approved order is checked. A message then says what it found, such as approved orders already done by hand, ones that need doing by hand (like direct-delivery POs) and ones assigned to someone with no PO raised.',
    ],
    improved: [
      'Before you approve an order route, it now lists what approving does step by step, and marks each step Automatic or “You, in Frameworks for now”, so you know what you still have to do yourself.',
      'PO suggestions show who the supplier email goes to, the CC, the subject and the attachment. Direct-delivery emails include the customer’s phone number.',
    ],
  },
  {
    version: '1.28.0',
    date: '2026-11-02',
    title: 'Supplier credits',
    added: [
      'New Supplier credits page (Orders → Supplier credits), in test mode. Add completed customer credit numbers and the automation checks each line: whether it’s non-stock at the credit’s branch (so it goes back to the supplier), stock on hand, and whether a Stock Return to that supplier was already raised around the credit date. Approve or reject the plan; nothing is raised in Frameworks yet.',
    ],
  },
  {
    version: '1.27.0',
    date: '2026-11-02',
    title: 'Knowledge base',
    added: [
      'New Knowledge base link in the sidebar: how online orders, order routing, shipping, stock, product data and the three websites work, all in one place. Search it, or press Ctrl K to jump to a page. You stay signed in with your portal login.',
    ],
  },
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
    ],
  },
  {
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
