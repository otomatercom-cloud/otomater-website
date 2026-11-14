"""Service-focused copy for the main pages. Describes what Otomater offers; no customer names, statistics or claims of results."""
from .seed_content import B, CONTACT_CTA, LEAD, cards, hero


def item(icon, title, text, href=""):
    return {"icon": icon, "title": title, "text": text, "href": href}


def faq(key, heading, qa):
    return B(key, "faq", {"heading": heading, "items": [{"question": q, "answer": a} for q, a in qa]})


def cta(key, heading, body):
    return B(key, "cta", {"heading": heading, "body": body, "buttons": [dict(CONTACT_CTA, style="primary")]})


def ncard(icon, title, tagline, text, points, accent):
    return {"icon": icon, "title": title, "tagline": tagline, "text": text, "points": points, "accent": accent, "href": ""}


AUTOMATION = B("automation_main", "automation", {
    "eyebrow": "ERP · Software · Digital marketing", "prefix": "Automate Your",
    "words": ["CRM", "Lead Management", "WhatsApp Business", "ERP"],
    "subheading": "Otomater helps businesses run better with Odoo-based ERP, custom software and automation, and grow with digital marketing that brings in real enquiries.",
    "primaryCta": CONTACT_CTA, "secondaryCta": {"label": "See what we do", "href": "#services"},
    "hubLabel": "360°", "hubCaption": "Platform",
    "nodes": [{"label": "CRM", "value": "", "caption": "customers", "accent": "blue"}, {"label": "LEAD", "value": "", "caption": "enquiries", "accent": "cyan"},
              {"label": "WA", "value": "", "caption": "conversations", "accent": "green"}, {"label": "ERP", "value": "", "caption": "operations", "accent": "amber"}]})

SOLUTIONS = B("cards_solutions", "cards", {"heading": "Four solutions, one connected platform", "intro": "Start with the one you need most. They share the same data.", "columns": "4", "numbered": True, "items": [
    ncard("Users", "CRM Solution", "Build lasting relationships", "Keep every customer interaction in one place. Track deals, automate follow-ups and see your sales pipeline clearly.", ["360° customer view", "Sales pipeline automation", "Activity tracking", "Revenue forecasting"], "blue"),
    ncard("Zap", "Lead Management", "Capture. Score. Convert.", "Capture leads from every channel, qualify them and route each one to the right person without delay.", ["Multi-channel capture", "Lead scoring", "Automated nurturing", "Conversion reports"], "cyan"),
    ncard("MessageCircle", "WhatsApp Business", "Engage at scale", "Run campaigns, chatbots and support conversations on WhatsApp from one dashboard.", ["Bulk campaigns", "Chatbot", "Template messages", "Two-way support"], "green"),
    ncard("Boxes", "ERP Solution", "Unify your operations", "One system for finance, inventory, HR and purchasing, so every team works from the same data.", ["Finance and accounting", "Inventory control", "HR and payroll", "Live dashboards"], "amber")]}, background="muted")

HOME = {"slug": "home", "name": "Home", "summary": "ERP solutions, custom software and digital marketing for growing businesses.", "blocks": [
    AUTOMATION,
    SOLUTIONS,
    cards("cards_services", "What we do", "Three connected services. Use one, or combine them.", [
        item("Boxes", "ERP Solutions", "Odoo implementation, custom modules, data migration and training, so one system runs sales, accounts, stock, HR and more.", "/erp-solutions"),
        item("Code2", "Software Development", "Web applications, customer and vendor portals, integrations and workflow automation built for your process.", "/software-development"),
        item("Megaphone", "Digital Marketing", "SEO, performance ads, social media and lead generation, connected to your CRM so every enquiry is tracked.", "/digital-marketing")], anchor="services"),
    cards("cards_connected", "Marketing that connects to your business system", "Most agencies stop at clicks. We connect the campaign to the follow-up, so you can see what each channel brings in.", [
        item("Target", "Lead ads to CRM", "Facebook and Instagram lead forms flow straight into your CRM, assigned to the right person automatically."),
        item("Smartphone", "WhatsApp follow-up", "Send the first reply, reminders and updates on WhatsApp, with every conversation linked to the lead."),
        item("Globe", "Landing pages that capture leads", "Fast, clear pages for a course, product or campaign, with a form that records where each enquiry came from."),
        item("BarChart3", "Reports you can act on", "See enquiries, follow-ups and conversions by campaign, so you know where to spend next.")], "4", background="muted"),
    cards("cards_industries", "Who we work with", "We build for organisations that run on processes, people and repeat enquiries.", [
        item("GraduationCap", "Education", "Admissions, fees, attendance, learning and parent communication in one system."),
        item("ShoppingCart", "Retail and textile", "Enquiries, stock, purchasing, vendors and branch operations."),
        item("Users", "Associations and membership", "Member records, renewals, payments and communication."),
        item("Truck", "Operations and field teams", "Assets, vehicles, work orders, expenses and approvals.")], "4"),
    cards("cards_process", "How we work", "A simple, transparent process from first call to go-live.", [
        item("Search", "Discover", "We learn your processes, goals and constraints."),
        item("Layers", "Design", "We plan the solution and agree the scope with you."),
        item("Cog", "Build", "We configure, develop and integrate in clear milestones."),
        item("Headphones", "Support", "We train your team and stay available after launch.")], "4", background="muted"),
    B("projects_main", "projects", {"heading": "Selected work", "intro": "", "limit": 3}),
    cta("cta_main", "Ready to talk about your project?", "Tell us what you need and we will suggest a practical next step."),
    LEAD]}

ERP = {"slug": "erp-solutions", "name": "ERP Solutions", "type": "service", "nav": True, "summary": "Odoo ERP implementation, custom modules, integrations and training.", "blocks": [
    hero("ERP Solutions", "One system for sales, purchase, stock, accounts, HR and reporting, set up around your business and supported after go-live.", CONTACT_CTA, None, "Odoo-based ERP"),
    cards("cards_erp", "What we deliver", "", [
        item("Boxes", "ERP implementation", "Requirement study, configuration, data migration, user training and go-live support."),
        item("Wrench", "Custom modules", "Modules and workflows built for processes that standard apps do not cover."),
        item("Network", "Integrations", "Connect payment gateways, WhatsApp, biometric devices, websites and other systems to your ERP."),
        item("Workflow", "Approvals and automation", "Multi-level approvals, notifications and routine tasks handled by the system."),
        item("PieChart", "Reports and dashboards", "Management reports and live dashboards built on your own data."),
        item("Headphones", "Support and upgrades", "Ongoing support, fixes, enhancements and version upgrades.")], "3"),
    cards("cards_erp_areas", "Business areas we cover", "Pick the areas you need now and add more later.", [
        item("Briefcase", "Sales and CRM", "Leads, quotations, follow-ups and pipeline."),
        item("Truck", "Purchase and inventory", "Vendors, purchase orders, stock and warehouses."),
        item("Banknote", "Accounting", "Invoices, payments, budgets and reconciliation."),
        item("Users", "HR and attendance", "Employees, leave, attendance and payroll inputs."),
        item("Building2", "Operations", "Assets, vehicles, rentals and expenses."),
        item("GraduationCap", "Education", "Admissions, students, fees and attendance.")], "3", background="muted"),
    faq("faq_erp", "Common questions", [
        ("How long does an ERP project take?", "It depends on scope. A focused first phase can go live in weeks; larger rollouts are planned in phases so your team starts using the system early."),
        ("Can you work with our existing data?", "Yes. We plan and test data migration before go-live so your records move across cleanly."),
        ("Will our team be trained?", "Yes. Training for each role is part of the project, and we stay available after launch."),
        ("Can the ERP connect to other tools?", "Yes. We integrate with websites, WhatsApp, payment gateways and devices.")]),
    cta("cta_erp", "Planning an ERP project?", "Tell us your processes and we will suggest where to start."), LEAD]}

SOFTWARE = {"slug": "software-development", "name": "Software Development", "type": "service", "nav": True, "summary": "Custom web applications, portals, integrations and workflow automation.", "blocks": [
    hero("Software Development", "Secure, fast web applications and portals, designed with your team and built to fit your process.", CONTACT_CTA, None, "Custom software"),
    cards("cards_sw", "What we build", "", [
        item("Globe", "Web applications", "Responsive applications for your team and customers."),
        item("Users", "Portals", "Customer, vendor, agent and employee portals with secure sign-in."),
        item("Network", "Integrations and APIs", "Connect systems and keep data in sync automatically."),
        item("Workflow", "Workflow automation", "Replace manual forms, sheets and follow-ups with a clear flow."),
        item("Smartphone", "Mobile-friendly interfaces", "Interfaces that work well on phones, tablets and desktops."),
        item("Cpu", "IoT and device connections", "Bring data from devices and sensors into your dashboards and alerts.")], "3"),
    cards("cards_sw_how", "How we build", "", [
        item("ShieldCheck", "Secure by default", "Validated inputs, role-based access and no secrets in the browser."),
        item("Rocket", "Fast pages", "Modern frameworks and caching for quick load times."),
        item("Layers", "Built to grow", "Clean structure so features can be added later."),
        item("CheckCircle2", "Tested", "Automated tests and review before release.")], "4", background="muted"),
    cta("cta_sw", "Have an idea or a manual process to replace?", "Describe it and we will suggest how to build it."), LEAD]}

MARKETING = {"slug": "digital-marketing", "name": "Digital Marketing", "type": "service", "nav": True, "summary": "SEO, performance marketing, social media and lead generation connected to your CRM.", "blocks": [
    hero("Digital Marketing", "Campaigns that bring in enquiries, and a system that makes sure each one is followed up and measured.", CONTACT_CTA, None, "SEO · Ads · Social · Lead generation"),
    cards("cards_dm", "Services", "", [
        item("Search", "SEO", "Technical SEO, on-page optimisation and content so the right people find you."),
        item("Target", "Performance marketing", "Google and Meta ad campaigns planned around enquiries and cost per lead."),
        item("Smartphone", "Social media", "Content calendars, posts and community management for your brand."),
        item("Zap", "Lead generation", "Landing pages, forms and funnels designed to turn visitors into enquiries."),
        item("Mail", "Email and WhatsApp", "Follow-up messages and campaigns to keep enquiries moving."),
        item("BarChart3", "Reporting", "Clear reports on enquiries, cost and conversions by channel.")], "3"),
    cards("cards_dm_examples", "Examples of what we set up", "Typical campaigns for businesses like yours.", [
        item("GraduationCap", "Admission campaign", "Ads and a landing page for a course or intake. Enquiries go to the admissions team in the CRM, and each lead gets a WhatsApp reply."),
        item("ShoppingCart", "Product or offer launch", "A festive or seasonal offer promoted on Meta and Google, with a page that captures enquiries and shows which ad brought each one."),
        item("Building2", "Local business visibility", "Search and map listings, reviews and a fast website so nearby customers can find and contact you."),
        item("Briefcase", "B2B lead generation", "Targeted ads, a clear service page and a short form, with every enquiry tracked through to a sales follow-up."),
        item("Megaphone", "Event and webinar", "Registration page, reminders by email and WhatsApp, and a follow-up sequence for attendees."),
        item("Users", "Social media content plan", "A monthly calendar of posts, approvals and reporting, planned with your team.")], "3", background="muted"),
    cards("cards_dm_flow", "From click to customer", "", [
        item("Megaphone", "Attract", "Search, ads and social bring people to a clear page."),
        item("Zap", "Capture", "A short form records the enquiry and its source."),
        item("Phone", "Follow up", "The right person is notified and the lead gets a prompt reply."),
        item("LineChart", "Measure", "You see which campaigns produce real enquiries.")], "4"),
    faq("faq_dm", "Common questions", [
        ("Do you guarantee rankings or results?", "No one can honestly guarantee a search ranking or a fixed number of leads. We plan, run and report openly, and improve based on the data."),
        ("Can enquiries go into our CRM?", "Yes. We connect forms and lead ads to your CRM so every enquiry is recorded and assigned."),
        ("Do you run the ad budget?", "Ad spend is paid by you directly to the platform. We plan and manage the campaigns and report on them."),
        ("Can you start with one channel?", "Yes. Many clients begin with one campaign and add channels once it works.")]),
    cta("cta_dm", "Want more enquiries you can actually track?", "Tell us what you sell and who you want to reach."), LEAD]}

INDUSTRIES = {"slug": "industries", "name": "Industries & Solutions", "nav": True, "summary": "Solutions for education, retail, associations and operations teams.", "blocks": [
    hero("Industries & Solutions", "Systems shaped around how each kind of organisation actually works."),
    cards("cards_ind", "Where we help", "", [
        item("GraduationCap", "Education institutions", "Enquiries and admissions, fee collection, attendance, learning and parent communication."),
        item("ShoppingCart", "Retail and textile", "Enquiry capture, stock, vendor sampling, purchasing and branch reporting."),
        item("Users", "Associations and membership bodies", "Member records, renewals, payments and communication."),
        item("Truck", "Operations and field teams", "Inventory, vehicles, equipment, work tracking, expenses and approvals."),
        item("Cpu", "IoT and monitoring", "Device data, dashboards and alerts for connected equipment."),
        item("Briefcase", "Service businesses", "Leads, projects, support tickets and renewals in one place.")], "3"),
    cta("cta_ind", "Not sure where you fit?", "Describe your business and we will tell you honestly what we can do."), LEAD]}

ABOUT = {"slug": "about", "name": "About Otomater", "nav": True, "summary": "Otomater builds ERP, custom software and digital marketing for growing organisations.", "blocks": [
    hero("About Otomater", "We build the business systems, and the marketing, that growing organisations run on.", None, None, "Who we are"),
    B("text_about", "richtext", {"heading": "Our company", "align": "left", "body": "Otomater provides ERP solutions, custom software, business automation and digital marketing.\n\nWe specialise in Odoo-based systems: we implement them, build custom modules and integrations around them, and connect them to your website, WhatsApp, payment gateways and devices. We also run digital marketing that feeds enquiries straight into your system, so every lead is followed up and measured.\n\nWe work with education institutions, retail and textile businesses, membership organisations and operations teams. In each case we start from how your people actually work, and build around that."}),
    cards("cards_values", "How we work", "", [
        item("CheckCircle2", "Practical first", "We recommend what solves your problem, not the biggest system."),
        item("Workflow", "Built around your process", "We study how your team works before we configure or code anything."),
        item("Handshake", "Clear communication", "Plain scope, honest timelines and regular progress updates."),
        item("Headphones", "Support after launch", "Training, fixes and improvements once you are live.")], "4", background="muted"),
    B("text_mission", "richtext", {"heading": "Mission and vision", "align": "left", "body": "**Mission.** To help organisations replace manual work with systems their teams actually use, and to bring in the enquiries that keep them growing.\n\n**Vision.** To be the dependable technology and growth partner for growing organisations."}),
    cta("cta_about", "Work with us", "Tell us what you are trying to improve and we will suggest a practical next step.")]}

SERVICE_PAGES = [HOME, ABOUT, ERP, SOFTWARE, MARKETING, INDUSTRIES]
