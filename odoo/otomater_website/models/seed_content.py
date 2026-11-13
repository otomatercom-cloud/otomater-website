"""Seed copy. Everything here is editable in the admin; none of it states customer names, statistics or certifications."""


def B(key, type_, data, **settings):
    return {"key": key, "type": type_, "visible": True, "data": data, "settings": settings}


def hero(h, sub, p=None, s=None, eyebrow=""):
    return B("hero_main", "hero", {"eyebrow": eyebrow, "heading": h, "subheading": sub, "primaryCta": p, "secondaryCta": s, "highlights": []})


CONTACT_CTA = {"label": "Talk to us", "href": "/contact"}
LEAD = B("lead_form_main", "lead_form", {"heading": "Tell us about your requirement", "body": "Share a few details and we will get back to you.",
                                         "submitLabel": "Send enquiry", "successMessage": "Thank you. We have received your enquiry and will contact you soon.", "showContact": False}, background="muted")


def cards(key, heading, intro, items, cols="3", **s):
    return B(key, "cards", {"heading": heading, "intro": intro, "columns": cols, "items": items}, **s)


SERVICES = [
    {"icon": "Boxes", "title": "ERP Solutions", "text": "ERP implementation, customisation and Odoo-based solutions for your business processes.", "href": "/erp-solutions"},
    {"icon": "Code2", "title": "Software Development", "text": "Custom web applications, portals, integrations and workflow automation.", "href": "/software-development"},
    {"icon": "Megaphone", "title": "Digital Marketing", "text": "SEO, performance marketing, social media and lead generation.", "href": "/digital-marketing"},
]

PAGES = [
    {"slug": "home", "name": "Home", "summary": "ERP solutions, business automation and digital marketing.", "blocks": [
        hero("Business software and digital growth, built around how you work",
             "Otomater provides ERP solutions, custom software, business automation and digital marketing.",
             CONTACT_CTA, {"label": "Explore ERP solutions", "href": "/erp-solutions"}, "ERP · Automation · Digital marketing"),
        cards("cards_services", "What we do", "Choose the area you need help with.", SERVICES),
        cards("cards_process", "How we work", "A simple, transparent process from first call to go-live.", [
            {"icon": "Search", "title": "Discover", "text": "We learn your processes, goals and constraints.", "href": ""},
            {"icon": "Layers", "title": "Design", "text": "We plan the solution and agree the scope with you.", "href": ""},
            {"icon": "Cog", "title": "Build", "text": "We configure, develop and integrate in clear milestones.", "href": ""},
            {"icon": "Headphones", "title": "Support", "text": "We train your team and stay available after launch.", "href": ""}], "4", background="muted"),
        B("stats_main", "stats", {"heading": "", "items": []}),
        B("projects_main", "projects", {"heading": "Selected work", "intro": "", "limit": 3}),
        B("cta_main", "cta", {"heading": "Ready to talk about your project?", "body": "Tell us what you need and we will suggest a practical next step.", "buttons": [dict(CONTACT_CTA, style="primary")]}, background="dark"),
        LEAD]},
    {"slug": "about", "name": "About Otomater", "nav": True, "summary": "About the company.", "blocks": [
        hero("About Otomater", "ERP solutions, business automation and digital marketing."),
        B("text_about", "richtext", {"heading": "Our company", "body": "Otomater provides ERP solutions, custom software, business automation, IT solutions and digital marketing services.\n\nAdd your company story in the admin editor.", "align": "left"}),
        B("text_mission", "richtext", {"heading": "Mission and vision", "body": "Add your mission statement and vision in the admin editor.", "align": "left"}, background="muted"),
        B("cta_about", "cta", {"heading": "Work with us", "body": "", "buttons": [dict(CONTACT_CTA, style="primary")]})]},
    {"slug": "erp-solutions", "name": "ERP Solutions", "type": "service", "nav": True, "summary": "ERP implementation, custom ERP and Odoo solutions.", "blocks": [
        hero("ERP Solutions", "ERP implementation, custom ERP, Odoo solutions and business process automation.", CONTACT_CTA),
        cards("cards_erp", "Capabilities", "", [
            {"icon": "Boxes", "title": "ERP implementation", "text": "Planning, configuration, data migration and training.", "href": ""},
            {"icon": "Wrench", "title": "Custom ERP", "text": "Modules and workflows tailored to how your business operates.", "href": ""},
            {"icon": "Database", "title": "Odoo solutions", "text": "Odoo-based applications and integrations.", "href": ""},
            {"icon": "Workflow", "title": "Process automation", "text": "Approvals, notifications and routine tasks automated.", "href": ""}], "2"),
        LEAD]},
    {"slug": "software-development", "name": "Software Development", "type": "service", "nav": True, "summary": "Custom web applications, portals and integrations.", "blocks": [
        hero("Software Development", "Custom web applications, portals, integrations and workflow automation.", CONTACT_CTA),
        cards("cards_sw", "What we build", "", [
            {"icon": "Globe", "title": "Web applications", "text": "Secure, responsive applications for your team and customers.", "href": ""},
            {"icon": "Users", "title": "Portals", "text": "Customer, vendor and employee portals.", "href": ""},
            {"icon": "Network", "title": "Integrations", "text": "Connect your systems and automate data flow.", "href": ""}]),
        LEAD]},
    {"slug": "digital-marketing", "name": "Digital Marketing", "type": "service", "nav": True, "summary": "SEO, performance marketing and lead generation.", "blocks": [
        hero("Digital Marketing", "SEO, performance marketing, social media, lead generation and campaign management.", CONTACT_CTA),
        cards("cards_dm", "Services", "", [
            {"icon": "Search", "title": "SEO", "text": "Search visibility and technical SEO.", "href": ""},
            {"icon": "Target", "title": "Performance marketing", "text": "Paid campaigns focused on measurable results.", "href": ""},
            {"icon": "Smartphone", "title": "Social media", "text": "Content and community management.", "href": ""},
            {"icon": "Zap", "title": "Lead generation", "text": "Campaigns and funnels that bring in enquiries.", "href": ""}], "2"),
        LEAD]},
    {"slug": "industries", "name": "Industries & Solutions", "nav": True, "summary": "Industry-specific solutions.", "blocks": [
        hero("Industries & Solutions", "Solutions for specific industries."),
        B("text_industries", "richtext", {"heading": "", "body": "Add industry solution pages in the admin editor, then link them here.", "align": "left"})]},
    {"slug": "projects", "name": "Projects", "nav": True, "summary": "Case studies and project portfolio.", "blocks": [
        hero("Projects", "Case studies and selected work."),
        B("projects_list", "projects", {"heading": "", "intro": "", "limit": 12})]},
    {"slug": "insights", "name": "Insights", "nav": True, "summary": "Articles and updates.", "blocks": [
        hero("Insights", "Articles and updates."),
        B("text_insights", "richtext", {"heading": "", "body": "Add articles as pages of type Post in the admin editor.", "align": "left"})]},
    {"slug": "contact", "name": "Contact", "nav": True, "summary": "Get in touch.", "blocks": [
        hero("Contact us", "Tell us about your requirement."),
        B("lead_form_contact", "lead_form", {"heading": "Send an enquiry", "body": "", "submitLabel": "Send enquiry", "successMessage": "Thank you. We have received your enquiry and will contact you soon.", "showContact": True})]},
    {"slug": "privacy-policy", "name": "Privacy Policy", "type": "legal", "summary": "Privacy policy.", "blocks": [
        B("text_privacy", "richtext", {"heading": "Privacy Policy", "body": "Placeholder: add your privacy policy text in the admin editor.", "align": "left"})]},
    {"slug": "terms", "name": "Terms", "type": "legal", "summary": "Terms of use.", "blocks": [
        B("text_terms", "richtext", {"heading": "Terms", "body": "Placeholder: add your terms in the admin editor.", "align": "left"})]},
]

NAV_SLUGS = [("About", "/about"), ("Industries", "/industries"), ("Projects", "/projects"), ("Insights", "/insights"), ("Contact", "/contact")]
SETTINGS = {
    "site": {"name": "Otomater", "tagline": "ERP solutions, business automation and digital marketing", "headerCta": {"label": "Get in touch", "href": "/contact"}},
    "navigation": {"items": [
        {"label": "Services", "href": "", "children": [{"label": "ERP Solutions", "href": "/erp-solutions"}, {"label": "Software Development", "href": "/software-development"}, {"label": "Digital Marketing", "href": "/digital-marketing"}]}]
        + [{"label": a, "href": b, "children": []} for a, b in NAV_SLUGS]},
    "footer": {"blurb": "", "copyright": "© Otomater. All rights reserved.",
               "columns": [{"title": "Services", "links": [{"label": "ERP Solutions", "href": "/erp-solutions"}, {"label": "Software Development", "href": "/software-development"}, {"label": "Digital Marketing", "href": "/digital-marketing"}]},
                           {"title": "Company", "links": [{"label": a, "href": b} for a, b in NAV_SLUGS if a != "Industries"]}],
               "legalLinks": [{"label": "Privacy Policy", "href": "/privacy-policy"}, {"label": "Terms", "href": "/terms"}]},
    "contact": {"email": "", "phone": "", "whatsapp": "", "address": "", "hours": "", "mapEmbedUrl": ""},
    "social": {"items": []},
    "theme": {"brand": "#283a4b", "accent": "#19a595", "fontHeading": "sora", "fontBody": "inter", "radius": "soft", "buttonStyle": "solid", "spacing": "comfortable"},
    "seo": {"titleTemplate": "%s | Otomater", "defaultDescription": "ERP solutions, custom software, business automation and digital marketing.", "ogImageMedia": None, "indexing": True},
    "leads": {"serviceOptions": ["ERP Solutions", "Software Development", "Digital Marketing", "Business Automation", "Other"],
              "consentText": "I agree to be contacted about my enquiry and accept the Privacy Policy.", "privacyHref": "/privacy-policy", "notificationEmails": []},
}


# Richer copy for the main pages (kept in a separate module); same slugs, so it replaces the short placeholders above.
from .seed_services import SERVICE_PAGES  # noqa: E402
_by_slug = {p["slug"]: p for p in SERVICE_PAGES}
PAGES = [_by_slug.get(p["slug"], p) for p in PAGES]
