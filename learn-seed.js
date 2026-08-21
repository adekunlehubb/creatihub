// ============================================================
// CreatiHub Learning Section — Seed Curriculum
// Teaches every CreatiHub creative service from scratch to advanced.
// Tracks = learning paths (grouped by skill domain).
// Lessons = individual units within a track (progressive: beginner -> advanced).
// ============================================================

const seedTracks = [
  {
    id: 'track-graphic-design',
    title: 'Graphic Design Mastery',
    icon: '🎨',
    tagline: 'Flyers, posters, logos, social media graphics, thumbnails & merch — from first sketch to print-ready files.',
    services: ['flyer-design', 'logo-design', 'social-media-kit', 'youtube-thumbnails', 'merch-tshirt'],
    level: 'Beginner to Advanced',
    lessonCount: 6,
    color: '#6c5ce7'
  },
  {
    id: 'track-video-motion',
    title: 'Video & Animation Studio',
    icon: '🎬',
    tagline: 'Plan, script, produce and deliver automated videos with AI voiceover, music and captions.',
    services: ['automated-video'],
    level: 'Beginner to Advanced',
    lessonCount: 5,
    color: '#00d4ff'
  },
  {
    id: 'track-illustration',
    title: 'Illustration & Cartooning',
    icon: '🦸',
    tagline: 'Create cartoon portraits, brand mascots and custom avatars in multiple art styles.',
    services: ['cartoon-maker'],
    level: 'Beginner to Advanced',
    lessonCount: 4,
    color: '#00ffa3'
  },
  {
    id: 'track-audio',
    title: 'Audio & Voice Production',
    icon: '🎙️',
    tagline: 'AI and professional voiceover, music production, brand jingles and sonic identity.',
    services: ['voiceover', 'music-jingles'],
    level: 'Beginner to Advanced',
    lessonCount: 5,
    color: '#ffb347'
  },
  {
    id: 'track-web-tech',
    title: 'Web Design & AI Automation',
    icon: '💻',
    tagline: 'Build landing pages and websites, and deploy AI chatbots that capture leads and automate bookings.',
    services: ['website-design', 'ai-chatbot'],
    level: 'Beginner to Advanced',
    lessonCount: 6,
    color: '#8e7bff'
  },
  {
    id: 'track-writing-seo',
    title: 'Copywriting & SEO Content',
    icon: '✍️',
    tagline: 'Write persuasive copy, rank on Google with SEO content, and translate for global audiences.',
    services: ['seo-copywriting', 'translation'],
    level: 'Beginner to Advanced',
    lessonCount: 5,
    color: '#ff5c7a'
  },
  {
    id: 'track-photography',
    title: 'AI Photography & Imaging',
    icon: '📸',
    tagline: 'Generate professional headshots and product photography scenes using AI — no studio required.',
    services: ['product-photography', 'pro-headshots'],
    level: 'Beginner to Advanced',
    lessonCount: 4,
    color: '#06b6d4'
  },
  {
    id: 'track-business-design',
    title: 'Business & Brand Design',
    icon: '📊',
    tagline: 'Investor pitch decks, email campaigns, book covers and real-estate virtual staging.',
    services: ['pitch-deck', 'email-campaign', 'book-cover', 'virtual-staging'],
    level: 'Intermediate to Advanced',
    lessonCount: 5,
    color: '#10b981'
  }
];

const seedLessons = [
  // ============ TRACK: Graphic Design Mastery ============
  {
    id: 'lesson-gd-01',
    trackId: 'track-graphic-design',
    serviceId: 'flyer-design',
    order: 1,
    level: 'Beginner',
    title: 'Design Fundamentals: Layout, Color & Typography',
    duration: '25 min',
    summary: 'Understand the building blocks every designer uses: visual hierarchy, color theory, and font pairing.',
    sections: [
      { heading: 'What you will learn', body: 'In this first lesson you will build the mental model that professional designers rely on for every project. We cover the three pillars of visual design: how to arrange elements so the eye knows where to look first (layout and hierarchy), how to choose colors that communicate the right emotion (color theory), and how to pair fonts that feel cohesive and readable (typography). These fundamentals apply whether you are designing a flyer, a logo, a social post, or a full brand identity.' },
      { heading: 'Visual hierarchy & layout', body: 'Visual hierarchy is the order in which the human eye notices things on a page. The biggest, boldest, highest-contrast element is seen first, so that element should carry your most important message — usually the headline or the main offer. Secondary information like dates, location, and pricing comes next in smaller type. Decorative or background elements come last. A reliable layout grid divides your canvas into a header zone (logo + headline), a body zone (details and imagery), and a footer zone (call to action + contact). When in doubt, align every element to an invisible grid column — alignment is the single fastest way to make a design look professional.' },
      { heading: 'Color theory basics', body: 'Colors carry emotion. Warm reds and oranges feel energetic and urgent — great for sales and food. Cool blues and greens feel calm and trustworthy — great for finance and health. A simple, safe starting palette is a 60-30-10 rule: 60% one dominant color (usually a neutral or your brand color) for backgrounds, 30% a secondary color for supporting blocks, and 10% an accent color for buttons and highlights. Always check contrast: text should have a contrast ratio of at least 4.5:1 against its background so it stays readable. Free tools like Coolors.co and Adobe Color let you generate harmonious palettes instantly.' },
      { heading: 'Typography & font pairing', body: 'Most designs need only two fonts: one for headings and one for body text. A classic pairing is a bold display font for the headline plus a clean, readable sans-serif for the details. Avoid using more than three fonts — it creates visual noise. For body text, keep line length between 45 and 75 characters and line height around 1.4 to 1.6 for comfortable reading. Great free font sources include Google Fonts and Fontshare. When pairing, contrast is key: pair a serif with a sans-serif, or a heavy weight with a light weight, rather than two similar fonts that compete.' },
      { heading: 'Pro tips', body: 'Use whitespace generously — empty space is not wasted space, it gives your content room to breathe and looks premium. Limit your palette to three or four colors. When choosing fonts, print a sample at actual size to test legibility. And always design with the final output in mind: a flyer for print needs 300 DPI resolution and CMYK color, while a social media post is 72 DPI and RGB.' },
      { heading: 'Exercise', body: 'Open any free design tool (Canva, Figma, or Photopea). Recreate a simple event flyer: pick a headline, a sub-headline, three lines of details, and one call to action. Apply the 60-30-10 color rule and use exactly two fonts. Export it as a PNG. This is the same foundation CreatiHub uses when delivering the Flyer & Poster Design service.' }
    ]
  },
  {
    id: 'lesson-gd-02',
    trackId: 'track-graphic-design',
    serviceId: 'flyer-design',
    order: 2,
    level: 'Beginner',
    title: 'Designing Flyers & Posters That Convert',
    duration: '30 min',
    summary: 'Apply the fundamentals to build a complete, print-ready flyer from a blank canvas.',
    sections: [
      { heading: 'What you will learn', body: 'Now that you understand layout, color, and type, we build a real flyer end to end. You will learn the anatomy of a high-converting flyer, how to choose the right dimensions for print versus digital, how to work with images and icons, and how to export print-ready files that a printer will accept without issues. This directly mirrors the Flyer & Poster Design packages CreatiHub delivers — Basic, Standard, and Premium.' },
      { heading: 'Flyer anatomy', body: 'A strong flyer has five zones. (1) The hook — a bold headline that stops the scroll. (2) The offer — one or two sentences explaining what the event or product is. (3) The proof — a star rating, a testimonial snippet, or a statistic. (4) The details — date, time, location, price. (5) The call to action — a phone number, website, QR code, or "Register Now" button. Every element should pass the squint test: squint at your design and if the most important element is still the clearest, your hierarchy is working.' },
      { heading: 'Dimensions & formats', body: 'Common flyer sizes are A5 (148 × 210 mm), A4 (210 × 297 mm), and US Letter (8.5 × 11 in). For social media, use 1080 × 1350 px for Instagram portrait, 1080 × 1080 px for square, and 1080 × 1920 px for stories. Always add a 3 mm bleed margin around print designs so nothing gets cut off during trimming, and keep important text inside a safe zone at least 5 mm from the edge.' },
      { heading: 'Working with images', body: 'Use high-resolution images at 300 DPI for print. Remove backgrounds when you want a subject to float on a colored panel — tools like remove.bg or Photopea’s magic wand handle this in seconds. Apply a subtle dark gradient over photos behind text to keep copy readable. Never stretch images out of proportion; hold Shift or use constrain-proportion tools when resizing.' },
      { heading: 'Exporting print-ready files', body: 'For print, export as PDF with CMYK color mode, 300 DPI, and fonts embedded. For digital, export as JPG or PNG in RGB. If a client needs to edit later, also provide the source file (PSD, AI, or a Canva template link). This is exactly what the CreatiHub Premium package includes — source files plus print and digital packs.' },
      { heading: 'Pro tips', body: 'Test your flyer in grayscale: if the hierarchy still reads without color, it is structurally solid. Always spell-check and verify phone numbers and dates twice — a wrong date on a printed flyer is an expensive mistake. For event flyers, include a QR code linking to the registration page; it dramatically increases conversions.' },
      { heading: 'Exercise', body: 'Design a grand-opening flyer for a coffee shop. Include the shop name, opening date, a special offer, address, and a QR code placeholder. Export both a print-ready PDF (A5, 300 DPI, with bleed) and an Instagram-ready PNG. Compare your result to CreatiHub’s Standard flyer package deliverables.' }
    ]
  },
  {
    id: 'lesson-gd-03',
    trackId: 'track-graphic-design',
    serviceId: 'logo-design',
    order: 3,
    level: 'Intermediate',
    title: 'Logo Design & Brand Identity From Scratch',
    duration: '40 min',
    summary: 'Go from concept sketches to a complete, scalable logo system with brand guidelines.',
    sections: [
      { heading: 'What you will learn', body: 'A logo is not just a pretty mark — it is the visual shorthand for an entire brand. In this lesson you will learn the logo design process used by professional studios: researching the brand, brainstorming concepts, sketching, refining in vector software, and packaging the final deliverables with a mini brand guideline. This maps to CreatiHub’s Logo & Brand Identity service, from the Basic single-concept package to the Premium full identity system.' },
      { heading: 'The design process', body: 'Professional logo design follows five steps. First, a discovery brief: ask the client about their business, audience, values, competitors, and any styles they like or dislike. Second, research: look at competitor logos to find opportunities to stand out. Third, sketching: generate at least twenty rough ideas on paper before touching software — quantity leads to quality. Fourth, vector refinement: take the best two or three sketches into a vector tool and refine shapes, balance, and spacing. Fifth, presentation: show the client the concepts in context (on a business card, a sign, an app icon) so they can visualize the real-world result.' },
      { heading: 'Logo types', body: 'There are five core logo styles. Wordmarks (text only, like Google or Coca-Cola) work when the name itself is distinctive. Lettermarks (initials, like IBM or HBO) suit long company names. Pictorial marks (an icon, like Apple’s apple) need strong brand recognition. Abstract marks (geometric shapes, like Nike’s swoosh) build association over time. Combination marks (icon plus wordmark, like Adidas or Lacoste) are the most versatile and the safest choice for new brands because they work locked together or separated.' },
      { heading: 'Vector is mandatory', body: 'A logo must be a vector graphic, not a raster image. Vectors are made of mathematical paths, so they scale infinitely from a favicon to a billboard without losing sharpness. Use Adobe Illustrator, Affinity Designer, Inkscape (free), or Figma to create your logo as SVG or EPS. Always deliver PNG and JPG versions for everyday use, but the vector source file is the real asset. A logo that only exists as a PNG will pixelate when enlarged — a common amateur mistake.' },
      { heading: 'Brand guidelines', body: 'A brand guideline (or style guide) documents how the logo should be used so it stays consistent everywhere. At minimum it includes: the primary logo and any variations (horizontal, stacked, icon-only), the clear-space rule (minimum padding around the logo), minimum size, the color palette with hex codes, the typography (primary and secondary fonts), and usage don’ts (no stretching, no recoloring, no dropping shadows). This document is what makes the CreatiHub Premium package a "full brand identity" rather than just a logo.' },
      { heading: 'Pro tips', body: 'A great logo works in one color (black) before it works in full color — if it relies on color to make sense, it is too complex. Test it at 16 × 16 pixels to see if it still reads as a favicon. Avoid trendy effects like gradients and bevels that date quickly; simplicity ages best. And never use stock icon elements in a logo — it must be original to be trademarkable.' },
      { heading: 'Exercise', body: 'Pick a fictional brand (a bakery, a tech startup, or a gym). Sketch 20 logo concepts on paper, pick the strongest, and recreate it as a vector in Inkscape or Figma. Produce a one-page brand guide with the logo, color palette, and fonts. This mirrors the Standard and Premium logo packages.' }
    ]
  },
  {
    id: 'lesson-gd-04',
    trackId: 'track-graphic-design',
    serviceId: 'social-media-kit',
    order: 4,
    level: 'Intermediate',
    title: 'Social Media Design Kits & Content Systems',
    duration: '35 min',
    summary: 'Build a cohesive grid of branded posts, stories and templates that scale across platforms.',
    sections: [
      { heading: 'What you will learn', body: 'A single social post is easy; a consistent feed of thirty posts that all look like one brand is hard. This lesson teaches you how to design a social media kit — a reusable system of templates, color, type, and layout rules that lets you (or your client) produce a month of content quickly while staying on-brand. This is the core of CreatiHub’s Social Media Design Kit service.' },
      { heading: 'Designing a template system', body: 'Start by defining a fixed set of templates rather than designing each post from scratch. A practical kit has four to six template types: a quote template, a promotional template, a tip-or-list template, a story template, and a highlight-cover template. Each template has locked elements (logo position, brand colors, font choices) and flexible zones (where the text and image go). By keeping the structure fixed and only swapping content, the entire feed looks cohesive even when the messages differ.' },
      { heading: 'Platform specifications', body: 'Each platform has optimal dimensions. Instagram feed posts are 1080 × 1080 px (square) or 1080 × 1350 px (portrait, which takes more screen space). Instagram and Facebook stories are 1080 × 1920 px. Twitter/X in-feed images are 1600 × 900 px. LinkedIn single-image posts are 1200 × 627 px. Highlight covers are 1080 × 1080 px with the icon centered in a 4:3 safe circle. Designing at 2x resolution keeps everything crisp on retina screens.' },
      { heading: 'Visual consistency rules', body: 'Consistency comes from constraint. Lock your brand colors to three or four hex values and use them the same way every time (for example, accent color only for the call to action). Use the same two fonts across every template. Keep a consistent photo treatment — the same filter, the same overlay opacity, the same border radius on images. When all posts share these rules, the feed reads as one designed product rather than random graphics.' },
      { heading: 'Content calendars', body: 'A content calendar maps which template posts on which day. A simple starter cadence is: Monday motivation quote, Tuesday product feature, Wednesday tip or tutorial, Thursday behind-the-scenes, Friday promotion, weekend engagement question. The calendar is part of the deliverable — CreatiHub’s Standard and Premium kits include a ready-to-use content calendar plus caption suggestions so the client knows exactly what to post and when.' },
      { heading: 'Pro tips', body: 'Design in batches: create a month of posts in one sitting to maintain visual flow. Use a consistent grid rhythm — alternate text-heavy and image-heavy posts so the feed has visual breathing room. Always export with the same compression settings so file sizes stay uniform. And reuse highlight covers as a visual signature — they sit at the top of the profile and shape the first impression.' },
      { heading: 'Exercise', body: 'Choose a brand and design five reusable templates (quote, promo, tip, story, highlight cover) that share one color palette and one font pair. Then use them to produce ten sample posts. Add a simple one-week content calendar. This replicates the Standard social media kit package.' }
    ]
  },
  {
    id: 'lesson-gd-05',
    trackId: 'track-graphic-design',
    serviceId: 'youtube-thumbnails',
    order: 5,
    level: 'Intermediate',
    title: 'YouTube Thumbnails That Get Clicks',
    duration: '25 min',
    summary: 'Master the psychology and craft of thumbnails that drive views and watch time.',
    sections: [
      { heading: 'What you will learn', body: 'A YouTube thumbnail is the single biggest factor in whether someone clicks your video. This lesson covers the visual and psychological principles behind high-click-through-rate thumbnails, the technical specs, and a repeatable workflow for producing them. This maps to CreatiHub’s YouTube Thumbnail Pack service.' },
      { heading: 'The click-through psychology', body: 'A thumbnail has about one second to earn a click, often viewed at the size of a postage stamp on a phone. The most effective thumbnails use three to four words of large, high-contrast text that teases the payoff without spoiling it. They show a clear emotion on a human face (surprise, shock, joy) because faces draw the eye. They use bold, saturated colors that pop against YouTube’s white or dark background. And they create curiosity or tension — a "what happens next?" feeling that only the video can resolve.' },
      { heading: 'Technical specifications', body: 'YouTube thumbnails are 1280 × 720 px (16:9), with a minimum of 640 px wide. Keep file size under 2 MB in JPG, PNG, or GIF. The safe area is the center of the frame — YouTube overlays the video duration timestamp in the bottom-right corner, so never put critical text there. Design for mobile: at phone scale, small text and fine details disappear, so everything important must be readable at 300 px wide.' },
      { heading: 'A repeatable workflow', body: 'Step one: choose a hero image — usually an expressive face or a striking product shot. Step two: cut out the subject from the background and place it on a bold, contrasting backdrop. Step three: add three to four words of text in a heavy, outlined font so it reads on any background. Step four: add one visual accent — an arrow, a circle highlight, or a colored shape — to point the eye at the key element. Step five: squint-test at small size. If the message still reads, it is ready.' },
      { heading: 'Thumbnail consistency', body: 'For channels, consistency builds recognition. Use a recurring color, font, and layout across a series so returning viewers instantly recognize your content in their feed. Many top creators use a split-screen or consistent corner element (like a logo bug) across every thumbnail. A pack of consistent thumbnails is exactly what CreatiHub delivers so a channel looks professional from day one.' },
      { heading: 'Pro tips', body: 'Never repeat the video title verbatim in the thumbnail — that wastes the text. Instead, complement or provoke the title. Avoid clutter: if you cannot tell what the thumbnail is about in one glance, simplify it. Test two thumbnail variants and let YouTube’s data tell you which wins. And avoid misleading clickbait — a high click rate with a low watch time hurts the video in the algorithm.' },
      { heading: 'Exercise', body: 'Design three thumbnails for a fictional YouTube channel about cooking. Each must have a hero face, three to four words of text, and a bold accent. Make all three visually consistent. Export at 1280 × 720 px. This replicates a YouTube Thumbnail Pack.' }
    ]
  },
  {
    id: 'lesson-gd-06',
    trackId: 'track-graphic-design',
    serviceId: 'merch-tshirt',
    order: 6,
    level: 'Advanced',
    title: 'Merch & T-Shirt Design for Print',
    duration: '30 min',
    summary: 'Create artwork for apparel and merchandise that prints cleanly and sells.',
    sections: [
      { heading: 'What you will learn', body: 'Merchandise design has unique constraints that flat graphic design does not: inks, fabrics, print methods, and sizing all affect the final result. This lesson covers how to design t-shirt and merch artwork that prints cleanly, looks great on fabric, and meets the technical requirements of print-on-demand and screen-printing services. This is the foundation of CreatiHub’s Merch & T-Shirt Design service.' },
      { heading: 'Print methods matter', body: 'The two most common apparel print methods behave differently. Screen printing layers individual ink colors, so designs with few solid colors are cheapest and cleanest — each color is a separate screen. Direct-to-garment (DTG) prints like an inkjet printer and handles full-color and photographic designs, but works best on light fabrics and can look muted on dark ones. Vinyl and heat-transfer suit simple, bold graphics. Knowing the print method up front determines how you should design.' },
      { heading: 'Designing for fabric', body: 'Fabric absorbs ink, so designs need stronger contrast and bolder lines than screen graphics. Thin lines and tiny text can disappear or blur on fabric. Use a limited, high-contrast palette. For dark garments, plan for a white underbase layer so colors stay vivid. Avoid large solid blocks of ink on lightweight shirts — they feel heavy and can crack over time. A standard full-chest print area is roughly 12 × 16 inches; a left-chest logo is about 3.5 × 3.5 inches.' },
      { heading: 'File preparation', body: 'Deliver merch artwork as high-resolution vector (SVG, EPS, AI) or raster at 300 DPI at print size (PNG with a transparent background). For screen printing, separate colors into individual layers or spot-color channels. Always provide a transparent background so the design floats on any garment color. Include a mockup — the design placed on a photo of a shirt — so the client sees the real-world result before printing.' },
      { heading: 'Merch beyond t-shirts', body: 'The same design system extends to hoodies, tote bags, mugs, phone cases, and stickers. Each product has a different print area and material, so adapt the artwork’s size and sometimes its color for the surface. A strong merch line has a core logo or mascot plus a few variant designs (a text-based slogan, an icon-based mark, an illustrated scene) so customers have choices. This range is what makes a merch line feel like a real collection.' },
      { heading: 'Pro tips', body: 'Always proof on the actual garment color, not just on white. Keep a 2-pixel trap (slight overlap) between adjacent colors in screen prints to prevent gaps from misregistration. Simplify photos into high-contrast duotones before printing on fabric — full photorealistic prints often look muddy. And remember the shirt itself is part of the design: the garment color, fit, and fabric quality affect perceived value as much as the print.' },
      { heading: 'Exercise', body: 'Design a three-piece merch line for a brand of your choice: a full-chest illustrated graphic for a t-shirt, a left-chest logo for a hoodie, and a slogan design for a tote bag. Prepare print-ready transparent PNGs at 300 DPI and a mockup of each on the product. This replicates the Merch & T-Shirt Design deliverables.' }
    ]
  },

  // ============ TRACK: Video & Animation Studio ============
  {
    id: 'lesson-vi-01',
    trackId: 'track-video-motion',
    serviceId: 'automated-video',
    order: 1,
    level: 'Beginner',
    title: 'Video Production Fundamentals',
    duration: '25 min',
    summary: 'Learn the language of video: shots, sequences, pacing, aspect ratios and the production pipeline.',
    sections: [
      { heading: 'What you will learn', body: 'Before making videos, you need to speak the language. This lesson covers the core concepts of video production — shot types, framing, sequences, pacing, and the three-stage pipeline (pre-production, production, post-production). These fundamentals underpin everything in CreatiHub’s Automated Video Creation service, from a 15-second social clip to a two-minute explainer.' },
      { heading: 'The production pipeline', body: 'Every video follows three stages. Pre-production is planning: defining the goal, writing the script, creating a storyboard, and deciding on style, voiceover, and music. Production is capturing or generating the raw material — filming footage, recording voiceover, or assembling stock and AI-generated clips. Post-production is editing: cutting the raw material into a sequence, adding music, captions, transitions, color, and exporting the final file. Skipping pre-production is the number one reason videos feel disorganized and run too long.' },
      { heading: 'Shot types & framing', body: 'Common shot types set context and emotion. A wide shot establishes the scene. A medium shot shows a person from the waist up and is the workhorse of talking-head video. A close-up focuses on a face or detail to convey emotion or importance. The rule of thirds divides the frame into a 3×3 grid; placing the subject on an intersection point feels more dynamic than dead-center. Leave headroom above a subject and looking-room in the direction they face.' },
      { heading: 'Sequences & pacing', body: 'A sequence is a series of shots that together convey an action or idea. Cutting between different angles of the same action keeps viewers engaged. Pacing is the rhythm of cuts: fast cuts create energy and urgency (great for promos), slow cuts create calm and gravity (great for storytelling). A practical rule is to change the visual every 2 to 4 seconds in short social videos — anything longer risks the viewer scrolling away. Match the pacing to the music’s tempo for a cohesive feel.' },
      { heading: 'Aspect ratios & platforms', body: 'Different platforms favor different shapes. Landscape 16:9 (1920 × 1080) is standard for YouTube and websites. Square 1:1 (1080 × 1080) works well in Instagram feeds. Vertical 9:16 (1080 × 1920) is mandatory for TikTok, Reels, and YouTube Shorts. A single video often needs to be exported in multiple ratios to perform across platforms — this is why CreatiHub’s Standard and Premium video packages include multiple aspect ratios.' },
      { heading: 'Pro tips', body: 'Always start a video with a hook in the first three seconds — a question, a bold statement, or a striking visual — because that is when most viewers decide to keep watching. Storyboard before you edit; it saves hours. Keep total length appropriate to the platform: 15 to 60 seconds for social, 1 to 2 minutes for explainers, and under 3 minutes for most marketing videos.' },
      { heading: 'Exercise', body: 'Write a one-paragraph video concept and a simple six-frame storyboard for a 30-second product promo. Decide the aspect ratio for each platform you would target. This is the pre-production step behind every CreatiHub video.' }
    ]
  },
  {
    id: 'lesson-vi-02',
    trackId: 'track-video-motion',
    serviceId: 'automated-video',
    order: 2,
    level: 'Beginner',
    title: 'Scripting Videos That Keep Viewers Watching',
    duration: '25 min',
    summary: 'Write clear, engaging scripts with hooks, structure and calls to action.',
    sections: [
      { heading: 'What you will learn', body: 'A great video starts with a great script. This lesson teaches a repeatable script structure for marketing and explainer videos, how to write a hook that earns attention, how to pace information so viewers do not drop off, and how to end with a call to action. Strong scripting is the difference between CreatiHub’s Basic video (which uses a simple brief) and the Premium package (which includes custom scriptwriting).' },
      { heading: 'The hook', body: 'The first three to five seconds decide whether a viewer stays. The best hooks make a promise, ask a provocative question, or show a surprising result. Examples: "Here is how a one-person bakery doubled sales in a month," or "Most logos break this one rule — does yours?" Avoid slow introductions like "Hi, my name is…" in short-form video — get to the value immediately. Write two or three hook options and choose the sharpest.' },
      { heading: 'The body structure', body: 'A reliable marketing video structure is hook → problem → solution → proof → call to action. After the hook, name the problem the viewer has so they feel understood. Then introduce the solution (your product or service). Then offer proof — a result, a testimonial, or a demonstration. Finally, tell them exactly what to do next. This structure keeps information moving and gives the viewer a reason to watch to the end.' },
      { heading: 'Writing for the ear', body: 'Video scripts are spoken, not read, so write the way people talk. Use short sentences. Read every line aloud — if you stumble, rewrite it. Replace complex words with simple ones: "utilize" becomes "use," "in order to" becomes "to." One idea per sentence. Aim for roughly 130 to 150 words per minute of finished video, so a 30-second script is about 65 to 75 words.' },
      { heading: 'The call to action', body: 'Every marketing video should end with a single, clear instruction. "Click the link to get started," "Follow for more tips," or "Book your design today." One action, stated plainly, repeated once if needed. Vague endings like "thanks for watching" waste the most valuable moment — the end screen, where the viewer is most likely to act.' },
      { heading: 'Pro tips', body: 'Write the script before you gather any footage or visuals — the words determine what images you need, not the other way around. Mark up the script with visual notes (what appears on screen during each line) to create a de facto storyboard. For voiceover, add pronunciation guides for any tricky words or names. And always cut 10 to 20 percent of the words on your second pass — tight scripts hold attention better.' },
      { heading: 'Exercise', body: 'Write a 60-second script for a CreatiHub service of your choice using the hook → problem → solution → proof → call to action structure. Add visual notes for each line. Count the words and confirm they fit in 60 seconds. This is the scriptwriting deliverable in the Premium video package.' }
    ]
  },
  {
    id: 'lesson-vi-03',
    trackId: 'track-video-motion',
    serviceId: 'automated-video',
    order: 3,
    level: 'Intermediate',
    title: 'AI Voiceover & Stock Footage Assembly',
    duration: '30 min',
    summary: 'Generate natural AI voiceovers and assemble stock footage into a polished video.',
    sections: [
      { heading: 'What you will learn', body: 'Modern video creation leans heavily on AI voiceover and stock footage, letting you produce professional videos without a camera or a microphone. This lesson covers how to choose and generate AI voices, where to source quality stock footage, and how to assemble everything into a coherent edit. This is the engine behind CreatiHub’s Automated Video Creation service.' },
      { heading: 'AI voiceover generation', body: 'AI voiceover tools convert a script into natural-sounding speech in dozens of languages and accents. When choosing a voice, match the tone to the content: warm and friendly for lifestyle, authoritative for corporate, energetic for promos. Pay attention to pacing and emphasis — most tools let you adjust speed and add pauses. For critical or premium work, AI voices are a strong draft, but a professional human voiceover (as in CreatiHub’s Standard package) adds nuance that AI cannot fully replicate yet. Always proof-listen to the full audio before locking the edit.' },
      { heading: 'Sourcing stock footage', body: 'Stock footage libraries (Pexels, Pixabay, Coverr, and paid libraries like Artgrid and Storyblocks) provide high-quality clips for almost any concept. Search by keyword and emotion rather than literal objects — "growth" might yield a plant time-lapse, a rising graph, or a person climbing. Keep a consistent look by choosing clips with similar lighting, color grade, and motion style. Avoid clips with obvious logos or recognizable faces that could cause licensing issues. For B-roll, choose clips that visually echo what the voiceover is saying at that moment.' },
      { heading: 'The assembly edit', body: 'Start by laying down the voiceover audio track — it is the spine of the video. Then place footage clips above the audio, cutting each clip to match the relevant sentence or phrase. Use simple cuts between clips; avoid excessive transitions like wipes and spins, which look amateur. Add a light background music track at low volume (around 15 to 20 percent) so it supports the voiceover without competing. Add lower-third text or captions for key points, especially on social platforms where many viewers watch with sound off.' },
      { heading: 'Captions & accessibility', body: 'Captions are no longer optional — most social video is watched muted. Burned-in captions (text rendered directly onto the video) guarantee they appear everywhere. Animated word-by-word captions, popular on TikTok and Reels, boost engagement and watch time. Keep caption text high-contrast and place it in the safe area so platform UI does not cover it. Captions also make your video accessible to deaf and hard-of-hearing viewers, which is both ethical and increasingly a legal requirement.' },
      { heading: 'Pro tips', body: 'Let the audio drive the edit, not the visuals. Use J-cuts (audio starts slightly before the video cut) and L-cuts (audio continues slightly after the video cut) for smoother, more professional transitions. Color-match your clips with a simple LUT or color adjustment so they feel like one shoot. And always export a test and watch it on a phone before final delivery — that is where most viewers will see it.' },
      { heading: 'Exercise', body: 'Take the 60-second script from the previous lesson. Generate an AI voiceover, source six to eight stock clips, and assemble a rough cut with background music and burned-in captions. Export at 1080p in 16:9 and 9:16. This replicates the Standard video package workflow.' }
    ]
  },
  {
    id: 'lesson-vi-04',
    trackId: 'track-video-motion',
    serviceId: 'automated-video',
    order: 4,
    level: 'Advanced',
    title: 'Color, Sound & Exporting Broadcast-Quality Video',
    duration: '30 min',
    summary: 'Polish your edit with color grading, audio mastering and correct export settings for every platform.',
    sections: [
      { heading: 'What you will learn', body: 'The difference between an amateur video and a professional one is in the finish: color, sound, and export quality. This lesson covers basic color grading to give your footage a cohesive look, audio mastering so voiceover and music sit perfectly, and the export settings that deliver crisp video on every platform. This is the polish that defines CreatiHub’s Premium 4K video package.' },
      { heading: 'Color grading basics', body: 'Color grading is the process of adjusting color and tone for mood and consistency. Start with color correction — fixing exposure, white balance, and contrast so each clip looks natural and matches the others. Then apply a grade — a stylistic color treatment — for mood: warm oranges for nostalgia and energy, cool teals for tech and calm, high contrast for drama. A LUT (lookup table) applies a preset grade instantly and keeps all clips consistent. Keep skin tones looking natural even in stylized grades; viewers notice off-color skin unconsciously.' },
      { heading: 'Audio mastering', body: 'Good audio matters more than good video — viewers tolerate a shaky image but abandon a video with bad sound. Normalize the voiceover so its loudest peak sits around -3 dB. Set background music to sit underneath, typically -18 to -24 dB so it never drowns the voice. Use a limiter on the master track to prevent clipping. Remove background noise with a noise reduction tool, and add a subtle compressor to the voiceover to even out loud and quiet moments. Always listen on headphones and on phone speakers, because that is how most viewers will hear it.' },
      { heading: 'Export settings', body: 'For web and social, export as MP4 (H.264 video, AAC audio). Standard HD is 1920 × 1080 at 24, 30, or 60 fps; 4K is 3840 × 2160. Use a bitrate of 8 to 12 Mbps for 1080p and 35 to 50 Mbps for 4K to balance quality and file size. For platforms with size limits, keep the file under the limit (Instagram caps feed videos around 650 MB; email attachments far less). Always set the audio sample rate to 48 kHz for video. Export a 1080p master even if you also deliver 4K, because 1080p plays smoothly on the widest range of devices.' },
      { heading: 'Thumbnails & delivery', body: 'A video is only as good as its thumbnail — design a custom thumbnail (see the YouTube Thumbnails lesson) rather than letting the platform auto-select a frozen frame. Deliver the final video in every aspect ratio the client needs, plus a short 15-second cutdown for social teasers. Include the raw project file or a caption file (.srt) when the client may need to edit or localize later. The Premium video package includes all aspect ratios plus custom thumbnails, which is why it is the complete delivery.' },
      { heading: 'Pro tips', body: 'Grade in a dim room with a calibrated monitor if possible — bright room light tricks your eyes about color. A/B your graded footage against the original to make sure you have not overdone it. For audio, the ducking technique automatically lowers music when the voiceover speaks, keeping the mix clean. And always keep an uncompressed or lightly compressed master archive of every project so you can re-export for new platforms later without quality loss.' },
      { heading: 'Exercise', body: 'Take the video from the previous lesson and apply a color grade, master the audio, and export a 1080p MP4 and a 4K MP4 with correct bitrates. Design a custom thumbnail for it. This completes the Premium video package workflow end to end.' }
    ]
  },
  {
    id: 'lesson-vi-05',
    trackId: 'track-video-motion',
    serviceId: 'automated-video',
    order: 5,
    level: 'Advanced',
    title: 'Running a Repeatable Video Production Workflow',
    duration: '25 min',
    summary: 'Turn one-off videos into a scalable system: templates, batch production, and client delivery.',
    sections: [
      { heading: 'What you will learn', body: 'Producing one video is a project; producing videos reliably for many clients is a system. This final video lesson teaches you how to build a repeatable production workflow — reusable templates, batch production, version control, and a delivery checklist — so you can scale from one video to a steady output. This is how CreatiHub delivers volume without sacrificing quality.' },
      { heading: 'Template your pipeline', body: 'Create reusable project templates in your editing software with pre-built title cards, lower-thirds, caption styles, intro and outro sequences, and music beds. A template means every new project starts 40 percent finished. Store brand kits (logo, colors, fonts) as saved presets. For recurring client work, keep a master project per client so each new video inherits their established look instantly.' },
      { heading: 'Batch production', body: 'Batching is the key to efficiency. Record all voiceovers in one session so the audio tone is consistent. Source all footage in one research pass. Edit in focused blocks — rough cuts for several videos, then color for several, then audio for several — rather than finishing one video start to finish before starting the next. Context-switching is the enemy of speed; batching eliminates it. A solo editor using templates and batching can produce 5 to 10 short videos per week.' },
      { heading: 'Version control & backups', body: 'Name files with a clear convention: client, project, version, date (for example, "acme_promo_v3_2026-08-21.mp4"). Keep an archive of every project file and its assets so revisions are fast. Back up projects to cloud storage automatically — a lost project file is a costly disaster. Maintain a changelog of what each version changed, so clients always know what is new.' },
      { heading: 'The delivery checklist', body: 'Before marking a video complete, verify: the final cut plays correctly in a player, captions are accurate and in the safe area, the call to action is present, audio levels are consistent, the thumbnail is attached, and all requested aspect ratios are exported. Deliver in a clean folder with the final files, the thumbnail, and a short note summarizing what was made. A reliable delivery checklist is what makes a service feel professional and keeps clients coming back.' },
      { heading: 'Pro tips', body: 'Build a library of reusable B-roll and music you have licensed once and can reuse across projects. Keep scripts and storyboards from past projects as templates for similar briefs. Track how long each production stage takes so you can quote future work accurately. And always ask clients for a testimonial after delivery — social proof is the most effective marketing for a video service.' },
      { heading: 'Exercise', body: 'Design your own production workflow: a project file-naming convention, a template checklist for starting a new video, and a delivery checklist for finishing one. Apply it to produce two short videos for two different fictional clients. This is the operational layer behind running a creative services business.' }
    ]
  },

  // ============ TRACK: Illustration & Cartooning ============
  {
    id: 'lesson-il-01',
    trackId: 'track-illustration',
    serviceId: 'cartoon-maker',
    order: 1,
    level: 'Beginner',
    title: 'Illustration Basics: Style, Shape & Character',
    duration: '25 min',
    summary: 'Understand how illustrators turn reference into stylized characters using shape language and proportion.',
    sections: [
      { heading: 'What you will learn', body: 'Illustration is the art of simplifying reality into a stylized image. This lesson introduces the core ideas every illustrator uses: shape language (how circles, squares, and triangles communicate personality), proportion and exaggeration, and how to work from a photo reference to create a cartoon. These fundamentals power CreatiHub’s Cartoon & Avatar Maker service.' },
      { heading: 'Shape language', body: 'Characters built from circles and curves feel friendly, soft, and approachable — think of mascots and children’s characters. Characters built from squares and straight lines feel stable, strong, and reliable — think of heroes and authority figures. Characters built from sharp triangles feel energetic, dangerous, or dynamic — think of villains and fast creatures. Choosing a dominant shape for your character instantly communicates personality before the viewer reads any detail.' },
      { heading: 'Proportion & exaggeration', body: 'Realistic human proportions are about seven and a half heads tall, but cartoons exaggerate for effect. A chibi or cute style uses two to three heads tall with a large head and big eyes. A heroic style uses eight to nine heads tall with broad shoulders. The face follows the "rule of thirds": eyes at the vertical midpoint, bottom of nose one-third down, mouth two-thirds down. Exaggerating one feature — bigger eyes, a longer nose, a wider smile — creates character and recognizability.' },
      { heading: 'Working from reference', body: 'Even stylized illustration starts from observation. Take a clear, well-lit photo of your subject facing forward. Identify the defining features — the shape of the eyes, the hairstyle, a distinctive nose or jaw. Then simplify: reduce those features to clean lines and shapes while keeping what makes the person recognizable. The goal is likeness through simplification, not photorealism. A good cartoon portrait captures the essence in a few lines.' },
      { heading: 'Line, color & finish', body: 'Clean, confident line art is the foundation of most cartoon styles. Use varying line weight — thicker lines for the outer silhouette and thinner lines for interior details — to create depth. Flat color fills with simple shading keep the look graphic and modern. A limited palette of three to five colors feels more designed than a full spectrum. For a premium finish, add subtle gradients, rim light, and texture.' },
      { heading: 'Pro tips', body: 'Flip your canvas horizontally while drawing — mistakes in proportion become obvious from the mirrored view. Sketch loosely first and tighten lines on a second pass; trying to draw perfect lines immediately stiffens the result. Save your line art and color on separate layers so revisions are easy. And always step away and look at the illustration at a small size — if it reads as the character when tiny, the design is strong.' },
      { heading: 'Exercise', body: 'Take a selfie or a photo of a friend and create a simple cartoon head-and-shoulders portrait using shape language and simplification. Use a free tool like Procreate, Krita, or Photopea. This replicates the Basic cartoon portrait package.' }
    ]
  },
  {
    id: 'lesson-il-02',
    trackId: 'track-illustration',
    serviceId: 'cartoon-maker',
    order: 2,
    level: 'Intermediate',
    title: 'Full-Body Characters & Custom Backgrounds',
    duration: '30 min',
    summary: 'Extend your portraits to full-body characters with poses, props and scene backgrounds.',
    sections: [
      { heading: 'What you will learn', body: 'A head-and-shoulders portrait is a starting point; a full-body character in a scene tells a story. This lesson covers constructing full-body cartoon characters, posing them expressively, adding props, and designing simple backgrounds that complement the subject. This is the step up to CreatiHub’s Standard cartoon package — full body, custom background, and multiple art styles.' },
      { heading: 'Full-body construction', body: 'Build the body from simple forms first: a head (circle), a torso (rounded rectangle or bean shape), and limbs (tapered cylinders). Sketch these forms loosely to establish the pose before adding any detail. This "mannequin" approach keeps proportions consistent and poses believable. Once the forms work, draw the clothing and details over them. Always establish the full pose in rough form before committing to clean lines.' },
      { heading: 'Poses & expression', body: 'A strong pose communicates the character’s mood instantly. Use the line of action — a single flowing curve through the body that captures the pose’s energy. A confident character has a straight, open line of action; a shy character has a curved, closed one. Avoid the stiff "stadium pose" (facing forward, arms at sides) — instead, angle the shoulders and hips, and shift weight to one leg for natural balance. Facial expression and body language should match for a believable character.' },
      { heading: 'Props & costume', body: 'Props and clothing reveal who a character is. A chef holds a whisk and wears an apron; a musician holds an instrument; a businessperson carries a briefcase. Keep props simple and readable — their silhouette should be recognizable at a glance. Clothing folds follow the body’s form; indicate only the major folds rather than every wrinkle. Use color and accessories to reinforce the character’s personality and role.' },
      { heading: 'Backgrounds that complement', body: 'A background should support the character, not compete with it. Simple approaches include a flat color panel, a gradient, a pattern of shapes, or a lightly sketched environment (a desk, a stage, a city skyline). Keep background detail lower than character detail so the subject stays the focal point. Use atmospheric perspective — distant objects lighter and less saturated — to suggest depth without clutter. A transparent background (PNG) is also a valuable deliverable so the character can be placed anywhere.' },
      { heading: 'Pro tips', body: 'Use reference for poses — even professionals photograph themselves in a pose to get it right. Keep a consistent light direction across the character and background. Add a subtle drop shadow under the character’s feet to ground them in the scene. And deliver both a version with background and a transparent PNG so the client has flexibility.' },
      { heading: 'Exercise', body: 'Create a full-body cartoon of a professional in their environment — a barista in a café, a doctor in a clinic, or a gamer at a desk. Include a prop, a simple background, and a clear pose. Export both a PNG with background and a transparent PNG. This replicates the Standard cartoon package.' }
    ]
  },
  {
    id: 'lesson-il-03',
    trackId: 'track-illustration',
    serviceId: 'cartoon-maker',
    order: 3,
    level: 'Advanced',
    title: 'Brand Mascots & Character Packs',
    duration: '35 min',
    summary: 'Design a mascot with multiple poses and expressions that becomes a brand’s visual ambassador.',
    sections: [
      { heading: 'What you will learn', body: 'A brand mascot is a character that represents a business across every touchpoint — website, social, packaging, ads. This lesson teaches how to design a mascot from concept to a full pack of poses and expressions, and how to keep it consistent and versatile. This is the heart of CreatiHub’s Premium cartoon package — mascots, families, and commercial-licensed character packs.' },
      { heading: 'Mascot concept development', body: 'A mascot must embody the brand’s personality. Start by defining three to five brand traits (friendly, energetic, trustworthy) and translate them into the character — shape language, color, expression, and pose. Decide whether the mascot is an animal, a person, an object brought to life, or an abstract creature. Keep the design simple enough to reproduce at small sizes and in one color. The best mascots are recognizable from their silhouette alone.' },
      { heading: 'The character model sheet', body: 'A model sheet documents the mascot from multiple angles (front, side, three-quarter, back) and in a neutral pose, so any future illustration stays consistent. It also defines the proportions, the color palette with hex codes, and the facial features. The model sheet is the reference document for everyone who draws the mascot — without it, the character drifts over time. Deliver this as part of the package so the brand can keep the mascot consistent forever.' },
      { heading: 'Pose & expression packs', body: 'A mascot pack includes a set of poses and expressions that cover the brand’s communication needs. A practical starter pack has eight to twelve pieces: a waving hello, a thinking pose, a celebrating pose, a pointing pose, a thumbs-up, and expressions like happy, surprised, sad, and determined. Each pose should use the same proportions and style as the model sheet. Deliver these as transparent PNGs so they can be dropped onto any background or post.' },
      { heading: 'Commercial licensing', body: 'When a mascot becomes a brand asset, commercial usage rights matter. A commercial license grants the client the right to use the character in marketing, products, and merchandise. Clarify whether the client owns the character outright (full buyout) or licenses it for specific uses. Deliver the vector source files (SVG, AI) so the brand can scale the mascot to any size for signage, packaging, or merchandise. This is what makes the Premium package a true brand asset rather than a one-off illustration.' },
      { heading: 'Pro tips', body: 'Design the mascot to work in one color first — if it reads as the brand in black and white, the design is strong. Create a simplified "icon" version of the mascot (just the head or a key feature) for use as a favicon or app icon. Test the mascot at 32 pixels to confirm it still reads. And keep a strict style guide so anyone drawing the mascot later — including the client’s own team — stays on model.' },
      { heading: 'Exercise', body: 'Design a mascot for a fictional brand. Create a model sheet (front, side, three-quarter), a color palette, and a pack of six poses and expressions as transparent PNGs. Write a short one-paragraph brand style guide for the character. This replicates the Premium mascot package.' }
    ]
  },
  {
    id: 'lesson-il-04',
    trackId: 'track-illustration',
    serviceId: 'cartoon-maker',
    order: 4,
    level: 'Advanced',
    title: 'Developing a Signature Illustration Style',
    duration: '25 min',
    summary: 'Cultivate a recognizable personal style that clients seek out and competitors cannot copy.',
    sections: [
      { heading: 'What you will learn', body: 'A signature style is what makes an illustrator’s work instantly recognizable and what clients eventually hire you for specifically. This lesson covers how to develop, refine, and document a personal illustration style, and how to present it so it becomes your competitive advantage. This is the professional layer beyond executing any single package.' },
      { heading: 'Finding your style', body: 'Style emerges from the intersection of what you love, what you are good at, and what you do repeatedly. Study illustrators you admire and deconstruct what you like about their work — the line quality, the color, the proportions, the subject matter. Borrow concepts, not exact copies. Then produce a large volume of work (fifty to a hundred pieces) applying those concepts to your own subjects. Patterns will emerge: you will gravitate to certain palettes, line weights, and compositions. That gravitation is your style forming.' },
      { heading: 'Refining and codifying', body: 'Once you sense your style, codify it so you can repeat it on demand. Define your standard line weight, your color palette, your shading method (flat, cell-shaded, soft gradient), your proportions, and your typical background treatment. Write these down as your own style guide. Being able to reproduce your style consistently is what turns it from a happy accident into a professional asset that you can deliver reliably to clients.' },
      { heading: 'Offering multiple styles', body: 'Some illustrators offer a single signature style; others offer a small set of distinct styles to serve different client needs (a cute style for children’s brands, a sleek style for tech companies, a hand-drawn style for artisan businesses). If you offer multiple styles, keep them clearly distinct and name them so clients can choose. CreatiHub’s cartoon service offers a choice of art styles for exactly this reason. Each style should still feel like it comes from the same skilled hand.' },
      { heading: 'Building a portfolio', body: 'Your portfolio should showcase your style in its best light. Lead with your strongest three to five pieces. Show range within your style — different subjects, poses, and use cases. Include before-and-after or process shots so clients see how you work. Present each piece in context (on a product, in a social post, as a mascot) so clients can envision the work in their own world. Update the portfolio regularly and remove older weaker work as you improve.' },
      { heading: 'Pro tips', body: 'Consistency is more valuable than novelty — a recognizable style builds trust and referrals. Do not chase trends; develop depth in what you genuinely enjoy drawing. Share work-in-progress on social media; process content builds audience and demonstrates skill. And protect your style by watermarking portfolio images and clearly licensing client work, so your signature look remains your competitive edge.' },
      { heading: 'Exercise', body: 'Create five illustrations of the same subject (a person, an animal, an object) experimenting with different line, color, and shading treatments. Identify which treatment feels most "you." Write a one-page style guide documenting that treatment. This is the foundation of a professional illustration practice.' }
    ]
  },

  // ============ TRACK: Audio & Voice Production ============
  {
    id: 'lesson-au-01',
    trackId: 'track-audio',
    serviceId: 'voiceover',
    order: 1,
    level: 'Beginner',
    title: 'Voiceover Fundamentals: Mic, Script & Delivery',
    duration: '25 min',
    summary: 'Learn how voiceover works — from preparing a script to recording clean, professional audio.',
    sections: [
      { heading: 'What you will learn', body: 'Voiceover is the spoken performance that carries your video, ad, or explainer. This lesson covers the fundamentals: how to prepare a script for reading aloud, how to set up a recording space, microphone basics, and how to deliver a natural, engaging performance. These skills underpin CreatiHub’s AI & Pro Voiceover service, from the AI-generated Basic package to the human-recorded Standard and Premium packages.' },
      { heading: 'Preparing the script', body: 'A voiceover script is different from written text. Format it in short, readable lines with generous spacing so the performer can glance without losing place. Mark up breathing pauses with slashes, emphasize words with underlines or bold, and note the desired tone at the top (warm, energetic, authoritative). Spell out or add pronunciation guides for any unusual names, acronyms, or technical terms. A well-prepared script saves takes and produces a better performance.' },
      { heading: 'The recording space', body: 'You do not need a professional studio, but you do need to control noise and echo. The biggest enemy is room reverb — hard, bare rooms make voice sound hollow. Soft materials absorb reflections: record in a closet full of clothes, hang blankets around your space, or use a portable vocal booth. Turn off fans, air conditioners, and notifications. Record late at night if your neighborhood is noisy. The goal is a dry, clean sound you can polish later.' },
      { heading: 'Microphone basics', body: 'A dedicated microphone — even an inexpensive USB mic — sounds far better than a laptop or phone mic. Position the mic about a hand’s span (15 to 20 cm) from your mouth, slightly off-axis (not directly in front) to reduce plosives (the popping "p" and "b" sounds). Use a pop filter if available. Speak across the mic rather than into it. Record at a level where your loudest moment does not clip (hit the red); aim for peaks around -6 to -3 dB.' },
      { heading: 'Delivery & performance', body: 'Great voiceover sounds like natural speech, not like reading. Smile slightly while recording friendly content — the listener can hear the smile. Use your hands as you would in real conversation; it adds energy to the voice. Slow down more than feels natural; when nervous, people speed up. Pause where you would in real speech; pauses let key points land. Do three takes of each line — one straight, one warmer, one more energetic — and choose the best in editing.' },
      { heading: 'Pro tips', body: 'Hydrate before recording; a dry mouth causes mouth clicks. Stand up while recording for better breath support and energy. Record a few seconds of room silence at the start so you have a noise profile for cleanup. And always listen back on headphones immediately — small issues like clicks or background noise are easy to fix with another take but hard to fix in editing.' },
      { heading: 'Exercise', body: 'Take a short 100-word script, mark it up with pauses and emphasis, set up a quiet recording space, and record three takes of it with your phone or a USB mic. Listen back and pick the best take. This is the basic voiceover workflow behind every CreatiHub audio package.' }
    ]
  },
  {
    id: 'lesson-au-02',
    trackId: 'track-audio',
    serviceId: 'voiceover',
    order: 2,
    level: 'Intermediate',
    title: 'AI Voiceover: Tools, Languages & Natural Delivery',
    duration: '25 min',
    summary: 'Generate high-quality multilingual AI voiceover and refine it to sound human.',
    sections: [
      { heading: 'What you will learn', body: 'AI voiceover has become a powerful, affordable way to produce narration in dozens of languages without a human performer. This lesson covers how to choose an AI voice tool, how to write scripts that AI reads naturally, how to direct the delivery with pacing and emphasis controls, and how to refine the output. This is the technology behind CreatiHub’s AI voiceover option in the Basic package and multilingual voiceover across all packages.' },
      { heading: 'Choosing an AI voice tool', body: 'Modern AI voice platforms offer remarkably natural voices. When choosing, evaluate three things: naturalness (does it sound human or robotic?), expressiveness (can it convey emotion and emphasis?), and language coverage (does it support the languages and accents you need?). Some platforms specialize in specific languages or accents, so test the exact voice in your target language before committing. For client work, choose a tool whose licensing permits commercial use of the generated audio.' },
      { heading: 'Writing for AI voices', body: 'AI voices read exactly what is written, so clarity matters more than ever. Use simple punctuation — periods create natural pauses, commas create shorter ones. Spell out numbers the way you want them read ("three hundred dollars" vs "three hundred dollars" — write it explicitly if ambiguous). Add phonetic guides for names and acronyms. Break long sentences into shorter ones; AI handles short sentences more naturally. Avoid complex formatting the AI might misinterpret.' },
      { heading: 'Directing the delivery', body: 'Most AI tools let you control pacing (speed), pitch, and emphasis. Slow the pace slightly for serious or emotional content; speed it up for energetic promos. Use emphasis tags or SSML (Speech Synthesis Markup Language) to stress key words — "This is the **best** deal" reads differently than a flat delivery. Insert explicit pauses with break tags between sections. Some platforms offer multiple emotional styles (cheerful, sad, whisper) for the same voice; choose the one that matches the content.' },
      { heading: 'Refining and editing', body: 'AI output usually needs a polish pass. Listen for mispronunciations and regenerate those lines with corrected spelling or phonetic hints. Stitch the best takes together in an audio editor. Add a subtle compressor and limiter to even out levels. Remove any unnatural pauses or clicks. For the most natural result, layer the AI voice with a low background music bed, which masks the slight artificiality. The refined result can rival a human voice for many use cases.' },
      { heading: 'Pro tips', body: 'Always generate a short test sample in the target language and have a native speaker review it for unnatural phrasing. Keep one consistent voice across a series or brand for recognition. For critical work (broadcast, premium clients), use AI as a fast draft and have a human voice artist re-record the final — this hybrid approach gives speed plus quality. And store the generated audio files with the script so you can regenerate quickly if the script changes.' },
      { heading: 'Exercise', body: 'Take a 150-word script and generate an AI voiceover in two different languages using a free or trial AI voice tool. Adjust the pacing and emphasis for each, then edit the output in a free audio editor (Audacity) to clean it up. This replicates the multilingual AI voiceover capability.' }
    ]
  },
  {
    id: 'lesson-au-03',
    trackId: 'track-audio',
    serviceId: 'voiceover',
    order: 3,
    level: 'Advanced',
    title: 'Professional Voiceover: Direction & Broadcast Quality',
    duration: '30 min',
    summary: 'Run a directed voiceover session and deliver broadcast-quality, commercially licensed audio.',
    sections: [
      { heading: 'What you will learn', body: 'For premium work — commercials, long-form narration, audiobooks — a professional human voice artist delivers a level of nuance and emotion AI cannot yet match. This lesson covers how to run a directed voiceover session, how to coach a performance, and how to deliver broadcast-quality audio with the right licensing. This is the craft behind CreatiHub’s Standard and Premium voiceover packages.' },
      { heading: 'Casting the right voice', body: 'The voice must match the brand and content. Consider gender, age range, accent, and tone (warm, authoritative, energetic, conversational). Listen to voice artist demos and choose someone whose natural sound fits — directing a voice far from its natural register produces strained results. For multilingual work, cast a native speaker of each target language rather than asking one artist to perform many accents. A good casting choice makes the session faster and the result better.' },
      { heading: 'Running a directed session', body: 'In a directed session (live over video call or in a studio), you coach the performance in real time. Start by explaining the content’s goal and the desired tone. Have the artist do a first read, then give specific, actionable notes: "more smile," "slower on the brand name," "pause before the price," "less announcer, more friend." Avoid vague notes like "make it better." Do multiple takes of each line and flag the best one immediately. A well-directed session captures the perfect read in thirty to sixty minutes.' },
      { heading: 'Broadcast-quality recording', body: 'Broadcast quality means clean, full-range audio at professional standards. Record at 48 kHz, 24-bit, in a treated space with a condenser microphone and an audio interface. The finished audio should have no background noise, no clipping, consistent levels, and natural dynamics. Apply a noise gate to remove quiet room sound, a compressor to even out dynamics, and a limiter to prevent peaks. Deliver as uncompressed WAV for broadcast and high-quality MP3 for web. This technical quality is what distinguishes the Premium package.' },
      { heading: 'Licensing & usage rights', body: 'Voiceover licensing defines how the client may use the recording. A basic license covers internal or web use. A commercial license covers paid advertising. A full buyout transfers all rights so the client can use it forever in any medium. Clarify usage up front because it affects pricing — a national broadcast commercial costs more than a website explainer even if the recording time is the same. CreatiHub’s Premium package includes full buyout rights, which is why it suits large-scale commercial use.' },
      { heading: 'Pro tips', body: 'Record room tone (a few seconds of silence in the recording space) so you can seamlessly patch edits. Keep all takes organized by line number so revisions are fast. Provide the artist with a pronunciation guide before the session to avoid wasted takes. And always deliver a watermarked preview for approval before sending final files and invoicing — it prevents costly redo requests after delivery.' },
      { heading: 'Exercise', body: 'Write a 300-word commercial script, cast a voice (even a friend with a good voice), and run a directed recording session. Edit the best takes into a clean 60-second commercial with broadcast-quality processing. Export as WAV and MP3. This replicates the Standard and Premium voiceover package.' }
    ]
  },
  {
    id: 'lesson-au-04',
    trackId: 'track-audio',
    serviceId: 'music-jingles',
    order: 4,
    level: 'Intermediate',
    title: 'AI Music & Background Tracks',
    duration: '30 min',
    summary: 'Generate custom background music and tracks using AI music tools for any mood and platform.',
    sections: [
      { heading: 'What you will learn', body: 'Background music sets the emotional tone of a video, ad, or product. This lesson covers how to use AI music generation tools to create custom tracks, how to choose the right genre and mood for your content, and how to license and deliver the audio. This is the foundation of CreatiHub’s AI Music & Jingles service, from the Basic background track to the Premium full brand audio identity.' },
      { heading: 'AI music generation tools', body: 'AI music platforms generate original instrumental (and sometimes vocal) tracks from a text prompt or a set of parameters like genre, mood, tempo, and duration. When prompting, be specific: "upbeat corporate background music, 120 bpm, optimistic, acoustic guitar and light percussion, 30 seconds." Generate several variations and choose the one that best fits the content. AI music avoids licensing complications because the track is generated fresh, though you should confirm the platform’s commercial-use terms.' },
      { heading: 'Matching music to content', body: 'Music must support the message, not fight it. Energetic, fast-tempo music suits promos, product launches, and social ads. Calm, slow music suits explainers, testimonials, and emotional stories. Corporate content benefits from neutral, uplifting beds. Avoid music with lyrics under a voiceover — the words compete. Match the music’s energy curve to the video’s emotional arc: build intensity toward the call to action, then resolve. A well-matched track makes the content feel professional; a mismatched track makes it feel amateur.' },
      { heading: 'Editing music to fit', body: 'A generated track rarely fits your video’s exact length. Trim it to match, using fade-in at the start and fade-out at the end so the audio does not cut abruptly. If the track is too short, loop a section or extend a sustained note. Use audio ducking so the music automatically dips when the voiceover speaks and rises in the gaps. Keep music volume well below the voiceover — typically 15 to 20 percent — so it is felt, not heard.' },
      { heading: 'Licensing & delivery', body: 'Clarify the usage rights for AI-generated music based on the platform’s terms. Some platforms grant full commercial rights; others restrict use. Deliver the final track as a high-quality MP3 for web and a WAV for broadcast or professional use. For premium work, provide stems — the individual instrument tracks separated — so the client can remix or edit later. Document the license terms in the delivery so the client knows what they can do with the audio.' },
      { heading: 'Pro tips', body: 'Generate five to ten variations for any brief and choose the best; the first result is rarely the strongest. Listen to your chosen track alongside the video before finalizing — music that sounds great alone can clash with voiceover. Keep a personal library of licensed tracks and stems you can reuse across projects. And always keep the original generation prompt and settings so you can recreate or extend the track later.' },
      { heading: 'Exercise', body: 'Generate a 30-second background track for a product promo using an AI music tool. Choose a genre and mood that matches an upbeat commercial. Edit it to fit a 30-second video with fade-in, fade-out, and ducking under a voiceover. Export as MP3 and WAV. This replicates the Basic music package.' }
    ]
  },
  {
    id: 'lesson-au-05',
    trackId: 'track-audio',
    serviceId: 'music-jingles',
    order: 5,
    level: 'Advanced',
    title: 'Brand Jingles & Sonic Identity',
    duration: '30 min',
    summary: 'Create a memorable brand jingle and sonic logo that make a brand instantly recognizable by sound.',
    sections: [
      { heading: 'What you will learn', body: 'A sonic identity is to sound what a logo is to sight — a short, memorable audio signature that makes a brand instantly recognizable. This lesson covers how to create a brand jingle and a sonic logo (audio mnemonic), how to build a cohesive audio brand system, and how to deliver it for every touchpoint. This is the craft behind CreatiHub’s Premium music package — a full brand audio identity.' },
      { heading: 'What is a sonic logo', body: 'A sonic logo is a one to three second sound that plays whenever the brand appears — at the start of videos, in app notifications, on loading screens, at the end of ads. Think of the Netflix "ta-dum" or the Intel chime. A great sonic logo is short, distinctive, memorable, and emotionally aligned with the brand. It often combines a simple melodic motif with a recognizable sound design element (a chime, a whoosh, a vocal). Because it is so short, every note and sound must be deliberate.' },
      { heading: 'Composing a jingle', body: 'A jingle is a short, catchy piece of music — usually 15 to 60 seconds — that carries the brand’s name, tagline, or promise, often with vocals. A strong jingle has a simple, repeatable melody that gets stuck in the listener’s head. It states the brand name clearly, fits the brand’s personality (playful for a toy brand, sophisticated for a luxury brand), and ends on a satisfying musical resolution. Write the melody first, then add lyrics that fit the rhythm naturally. Test it by singing it to someone; if they can hum it back after one hearing, it works.' },
      { heading: 'The audio brand system', body: 'A full sonic identity is a system, not a single sound. It includes the sonic logo (the signature), a short jingle (for ads and intros), extended variations (a ten-second version, a thirty-second version, an instrumental version), and a set of UI sounds (notification chimes, success and error tones) for apps and products. All of these should share a consistent musical key, instrumentation, and mood so the brand sounds like one family wherever it appears. This system is what the Premium package delivers.' },
      { heading: 'Delivery & licensing', body: 'Deliver the full audio brand system as a organized folder: the sonic logo in WAV and MP3, each jingle variation, the stems (separated instruments) so the client can remix, and a short guide documenting when to use each asset. Include full broadcast and buyout rights so the brand can use the audio in any medium, forever. The stems and the usage guide are what turn a one-off jingle into a lasting brand asset the client can use across every touchpoint for years.' },
      { heading: 'Pro tips', body: 'Simplicity is everything in sonic branding — a three-note motif often outperforms a complex composition. Test the sonic logo on phone speakers, not just studio monitors, because that is where most people will hear it. Make sure it works without lyrics (the instrumental version) for international use. And protect the audio identity: once a brand owns a sonic logo, consistency across every touchpoint is what builds recognition, just like a visual logo.' },
      { heading: 'Exercise', body: 'Create a sonic identity for a fictional brand: a two-second sonic logo, a 30-second jingle with a simple melody stating the brand name, and one variation (instrumental or extended). Deliver the assets as WAV and MP3 with a short usage guide. This replicates the Premium brand audio identity package.' }
    ]
  },

  // ============ TRACK: Web Design & AI Automation ============
  {
    id: 'lesson-we-01',
    trackId: 'track-web-tech',
    serviceId: 'website-design',
    order: 1,
    level: 'Beginner',
    title: 'Web Design Fundamentals: Structure & User Experience',
    duration: '25 min',
    summary: 'Understand how websites are structured, how users navigate them, and what makes a page effective.',
    sections: [
      { heading: 'What you will learn', body: 'A website is a structured experience, not just a collection of pages. This lesson covers the fundamentals of web structure — pages, navigation, and user flow — and the UX principles that make a site easy and pleasant to use. These fundamentals underpin CreatiHub’s Website & Landing Pages service, from a single-page landing site to a full multi-page website.' },
      { heading: 'Website structure', body: 'Most business websites follow a familiar structure. The homepage introduces the brand and routes visitors to key sections. An about page builds trust. A services or products page details the offering. A contact page enables inquiries. A blog or resources section supports SEO and authority. A landing page, by contrast, is a single focused page built for one action — signing up, buying, or registering — with no navigation distractions. Understanding whether the client needs a full site or a single landing page is the first design decision.' },
      { heading: 'Navigation & user flow', body: 'Navigation should be obvious and consistent. A primary menu with five to seven items is the sweet spot — more overwhelms, fewer under-serves. Place the menu in the expected location (top, or top-left for hamburger menus on mobile). Every page should let the user get back to home and to the main sections in one click. A user flow is the path you expect a visitor to take — for example, homepage → services → contact. Design every page to move visitors naturally to the next step toward conversion.' },
      { heading: 'The landing page formula', body: 'A high-converting landing page has a clear anatomy: a hero section with a headline, subheadline, and a primary call-to-action button; a benefits section explaining what the visitor gains; a features or how-it-works section; social proof (testimonials, logos, stats); and a final call to action repeated at the bottom. Every element should serve one goal — getting the visitor to click that button. Remove any link that leads away from the page; a landing page with navigation leaks conversions.' },
      { heading: 'Mobile-first design', body: 'More than half of all web traffic is mobile, so design for the small screen first. Use a single-column layout that stacks vertically. Make tap targets at least 44 pixels so fingers can hit them. Keep text readable without zooming — at least 16 pixels for body text. Test every interactive element by actually tapping it on a phone. A site that works beautifully on desktop but is fiddly on mobile loses most of its visitors.' },
      { heading: 'Pro tips', body: 'Before designing, list the one action you want visitors to take on each page — that single action should drive every layout decision. Use whitespace to guide the eye; crowded pages overwhelm. Keep forms short — every extra field reduces completion. And always plan the content before the visuals; a beautiful page with unclear messaging fails.' },
      { heading: 'Exercise', body: 'Plan a one-page landing site for a fictional service. Write the headline, subheadline, three benefits, a short how-it-works, and the call to action. Sketch the layout (hero, benefits, how-it-works, CTA). This is the pre-production step behind every CreatiHub landing page.' }
    ]
  },
  {
    id: 'lesson-we-02',
    trackId: 'track-web-tech',
    serviceId: 'website-design',
    order: 2,
    level: 'Beginner',
    title: 'Building a Landing Page: HTML, CSS & Visual Design',
    duration: '35 min',
    summary: 'Turn your plan into a real, responsive landing page with modern HTML and CSS.',
    sections: [
      { heading: 'What you will learn', body: 'This lesson takes the landing page plan from the previous lesson and builds it as a real, responsive web page. You will learn the basic structure of an HTML page, how CSS controls layout and styling, how to make the page responsive (adapt to mobile and desktop), and how to apply visual design principles for a professional look. This is the core build skill behind CreatiHub’s Website & Landing Pages Basic package — a one-page responsive site.' },
      { heading: 'HTML structure', body: 'An HTML page is a tree of elements. The document starts with a head section (title, meta description, link to the CSS file) and a body containing the visible content. Use semantic elements: a header for the top navigation, a main for the primary content, sections for each block (hero, benefits, CTA), and a footer. Each section contains headings (h1 for the main headline, h2 for section titles), paragraphs, images, and buttons. Semantic structure helps both accessibility (screen readers) and SEO (search engines understand the page).' },
      { heading: 'CSS styling & layout', body: 'CSS controls how HTML looks. Set a color palette with CSS variables for consistency. Use a readable system font stack. Control layout with flexbox (for one-dimensional rows and columns) and grid (for two-dimensional layouts). Give the page a max-width container (around 1200 pixels) centered on screen so content does not stretch too wide on large monitors. Add padding and consistent spacing using a scale (for example, 8, 16, 24, 32, 48 pixel steps) for a harmonious rhythm.' },
      { heading: 'Making it responsive', body: 'Responsive design adapts the layout to the screen size. Use a mobile-first approach: write styles for mobile (single column) and then use media queries to add multi-column layouts for larger screens. A common breakpoint is at 768 pixels (tablets) and 1024 pixels (desktops). Make images flexible with max-width: 100% so they scale down on small screens. Test by resizing the browser window and on an actual phone — the layout should reflow smoothly without horizontal scrolling.' },
      { heading: 'Visual design polish', body: 'Small details elevate a page from functional to professional. Use consistent button styles with hover states. Add subtle shadows and rounded corners to cards for depth. Choose one accent color for interactive elements (links, buttons) and use it consistently. Ensure text has strong contrast against its background. Use high-quality images (from Unsplash or Pexels) and compress them for fast loading. Add a favicon so the site has an icon in the browser tab. These touches are what make the Standard and Premium packages look premium.' },
      { heading: 'Pro tips', body: 'Keep the CSS organized: reset defaults first, then set variables, then layout, then components. Use a consistent naming convention for classes. Validate your HTML with the W3C validator to catch errors. Test the page’s loading speed — aim for under 3 seconds. And always view the finished page on a real phone, not just the browser’s responsive mode, because real devices reveal issues the simulator hides.' },
      { heading: 'Exercise', body: 'Build the landing page you planned in the previous lesson as a single HTML file with a linked CSS file. Make it fully responsive. Include the hero, benefits, how-it-works, and call-to-action sections. Open it in a browser and test on mobile. This replicates the Basic one-page landing site package.' }
    ]
  },
  {
    id: 'lesson-we-03',
    trackId: 'track-web-tech',
    serviceId: 'website-design',
    order: 3,
    level: 'Intermediate',
    title: 'Multi-Page Websites, SEO & Analytics',
    duration: '35 min',
    summary: 'Expand to a full multi-page site with SEO optimization and analytics to measure performance.',
    sections: [
      { heading: 'What you will learn', body: 'A real business website usually needs multiple pages, search engine optimization so people can find it, and analytics to measure what works. This lesson covers building a multi-page site with consistent navigation, the on-page SEO fundamentals that help you rank, and setting up analytics to track visitors. This is the skill set behind CreatiHub’s Standard website package — up to five pages with SEO setup and analytics.' },
      { heading: 'Multi-page structure & shared elements', body: 'A multi-page site shares the same header, footer, and styling across every page for consistency. In a simple static site, duplicate the header and footer HTML into each page (or use a templating tool or build step to include them automatically). Every page links to the others through the navigation. Keep the URL structure clean and descriptive ( /about, /services, /contact ) so both users and search engines understand the site. Add an active-state style to the current page’s nav link so visitors know where they are.' },
      { heading: 'On-page SEO fundamentals', body: 'Search engine optimization helps your site appear in Google results. On each page, include a unique, descriptive title tag (50 to 60 characters) and a meta description (150 to 160 characters) that includes the page’s main keyword. Use one h1 heading per page that matches the keyword. Use descriptive headings (h2, h3) to structure content. Add descriptive alt text to every image. Include the keyword naturally in the first paragraph. Link between your own pages (internal linking) so search engines can crawl the whole site. Create clean, keyword-rich URLs.' },
      { heading: 'Technical SEO basics', body: 'Beyond content, search engines reward fast, mobile-friendly, secure sites. Ensure the site loads quickly by compressing images, minifying CSS and JS, and using a fast host. Make sure the site is fully responsive (Google uses mobile-first indexing). Serve the site over HTTPS with an SSL certificate. Create a sitemap.xml listing all pages and a robots.txt file, and submit the sitemap to Google Search Console. These technical foundations are part of the Standard package’s SEO setup.' },
      { heading: 'Setting up analytics', body: 'Analytics tells you how many people visit, where they come from, and what they do on your site. Google Analytics (GA4) is the standard free tool. Create a property, add the tracking code to every page (in the head section), and verify data is flowing within a day. Set up key events to track — form submissions, button clicks, scroll depth — so you can measure conversions, not just pageviews. Connect Google Search Console to see which search queries bring visitors. This measurement layer is what turns a website from a brochure into a growth tool.' },
      { heading: 'Pro tips', body: 'Write content for humans first, search engines second — keyword-stuffed content ranks poorly and repels visitors. Keep page titles under 60 characters so they do not get truncated in search results. Use descriptive internal links ("read our pricing guide") rather than "click here." Check the site in Google’s PageSpeed Insights and fix the high-impact issues. And review analytics weekly at first to understand your traffic, then monthly once patterns are clear.' },
      { heading: 'Exercise', body: 'Expand your landing page into a five-page site: home, about, services, blog, and contact. Apply on-page SEO to each page (unique title, meta description, headings, alt text). Add Google Analytics tracking code. Submit a sitemap to Google Search Console. This replicates the Standard website package.' }
    ]
  },
  {
    id: 'lesson-we-04',
    trackId: 'track-web-tech',
    serviceId: 'ai-chatbot',
    order: 4,
    level: 'Intermediate',
    title: 'AI Chatbots: Training, Deployment & Lead Capture',
    duration: '35 min',
    summary: 'Build and deploy an AI chatbot that answers FAQs and captures leads on a website.',
    sections: [
      { heading: 'What you will learn', body: 'An AI chatbot can answer visitor questions instantly, capture leads around the clock, and route complex issues to a human. This lesson covers how to train a chatbot on a business’s FAQs, how to deploy it as a website widget, and how to configure it to collect leads. This is the foundation of CreatiHub’s AI Chatbot Setup service, from the Basic FAQ bot to the Standard multi-channel bot with bookings.' },
      { heading: 'How AI chatbots work', body: 'A modern AI chatbot uses a language model to understand a visitor’s question and generate a relevant answer from the knowledge it has been given. You train it by providing a knowledge base — FAQs, product details, pricing, policies — and the bot uses that context to answer. Unlike old rule-based bots that only responded to exact keyword matches, AI bots handle varied phrasing and follow-up questions naturally. The quality of the answers depends almost entirely on the quality and completeness of the knowledge base you provide.' },
      { heading: 'Building the knowledge base', body: 'Start by listing the questions customers actually ask. Gather these from support emails, live chat logs, and sales calls. For each question, write a clear, concise answer in the brand’s voice. Organize the knowledge into categories (products, pricing, shipping, returns, contact). The more complete and accurate this document, the better the bot performs. Include edge cases and the boundaries of what the bot should and should not answer — for example, "I am not able to process refunds; let me connect you with a human." This curation is the core of the Basic package.' },
      { heading: 'Deploying the website widget', body: 'Most chatbot platforms provide a small JavaScript snippet that you paste into your site’s HTML, which renders a chat bubble in the corner. Configure the welcome message ("Hi! How can I help you today?") and the bot’s personality (friendly, professional, concise). Position the widget so it does not cover important content or call-to-action buttons. Test it thoroughly: ask it the real FAQ questions and confirm the answers are accurate and on-brand. A well-deployed widget feels like a helpful assistant, not a barrier.' },
      { heading: 'Lead capture & handoff', body: 'A chatbot’s business value is in capturing leads and routing conversations. Configure the bot to ask for a visitor’s name and email when they show buying intent ("I can help with that — what is the best email to reach you?"). Store captured leads in a CRM or email them to the sales team. Set up a human handoff: when the bot cannot answer or the visitor asks for a human, it escalates the conversation to a live agent or collects contact info for follow-up. This lead-capture and routing capability is what makes the Standard package a sales tool, not just a support tool.' },
      { heading: 'Pro tips', body: 'Keep the bot’s answers short — visitors want quick help, not essays. Regularly review chat transcripts to find questions the bot answered poorly and update the knowledge base. Be transparent that it is a bot; pretending it is human breaks trust when it inevitably says something robotic. Set clear guardrails so the bot never gives pricing or legal advice beyond what you have approved. And always have a path to a human, because no bot handles every case.' },
      { heading: 'Exercise', body: 'Write a knowledge base of fifteen FAQs for a fictional business. Configure a chatbot (using a free or trial platform) on that knowledge base, write a welcome message, and set up a lead-capture flow that asks for email. Test it with ten real questions. This replicates the Basic AI chatbot package.' }
    ]
  },
  {
    id: 'lesson-we-05',
    trackId: 'track-web-tech',
    serviceId: 'ai-chatbot',
    order: 5,
    level: 'Advanced',
    title: 'Multi-Channel Bots, Automation & CRM Integration',
    duration: '35 min',
    summary: 'Extend your chatbot across WhatsApp and web, automate bookings, and connect it to a CRM.',
    sections: [
      { heading: 'What you will learn', body: 'A chatbot that lives only on a website reaches only website visitors. Extending it to WhatsApp and other channels, automating bookings, and connecting it to a CRM turns it into a full business automation engine. This lesson covers multi-channel deployment, booking automation, and CRM integration. This is the craft behind CreatiHub’s Standard and Premium chatbot packages — multi-channel, with bookings and CRM integration.' },
      { heading: 'Multi-channel deployment', body: 'Customers communicate on many channels — website, WhatsApp, Instagram, Facebook Messenger. A modern chatbot platform lets you connect one brain (the knowledge base and conversation logic) to multiple channels so the bot gives consistent answers everywhere. WhatsApp is especially powerful for business because of its massive global reach; deploying a bot there lets customers message your business the same way they message friends. Each channel has slight differences in formatting (WhatsApp supports buttons and lists; web chat supports richer cards), so adapt the conversation flow per channel while keeping the knowledge consistent.' },
      { heading: 'Booking automation', body: 'A chatbot that can book appointments directly saves enormous manual effort. Connect the bot to a calendar system (Google Calendar, Calendly, or a custom scheduler). The bot checks available slots in real time, offers them to the visitor, confirms the booking, and adds it to the calendar — all in the conversation. Send automated confirmation and reminder messages to reduce no-shows. For service businesses (salons, clinics, consultants), booking automation is often the highest-value feature, turning the chatbot from a support tool into a revenue tool.' },
      { heading: 'CRM integration', body: 'Every conversation is a data source. Integrating the chatbot with a CRM (HubSpot, Salesforce, or a simple spreadsheet via Zapier) means every lead, booking, and customer question is captured automatically. The bot can look up existing customers by email or phone and personalize the conversation ("Welcome back, Sarah! Are you calling about your last order?"). It can tag conversations by topic, route leads to the right salesperson, and trigger follow-up email sequences. This integration is what makes the Premium package a full automation suite.' },
      { heading: 'Analytics & optimization', body: 'A chatbot platform’s analytics dashboard shows conversation volume, top questions, resolution rate, lead captures, and where conversations drop off. Review these weekly. The drop-off points reveal where the bot fails — perhaps it cannot answer a common question, or the lead-capture flow is too long. Fix the knowledge base or the flow, and watch the metrics improve. Over time, a well-optimized bot resolves 60 to 80 percent of inquiries automatically, freeing humans for the complex cases that actually need them.' },
      { heading: 'Pro tips', body: 'Start with one channel (usually web), perfect it, then expand to others — deploying everywhere at once spreads your attention too thin. Map the conversation flows visually before configuring them, so the logic is clear. Always test new automations end to end with real scenarios before going live. And keep a human in the loop for payments, refunds, and sensitive issues — automation handles volume, humans handle trust.' },
      { heading: 'Exercise', body: 'Extend the chatbot from the previous lesson to a second channel (WhatsApp or another messenger). Add a simple booking flow that offers three time slots and confirms one. Connect captured leads to a spreadsheet via Zapier or a direct integration. Test the full flow from message to booking to CRM record. This replicates the Standard and Premium chatbot packages.' }
    ]
  },
  {
    id: 'lesson-we-06',
    trackId: 'track-web-tech',
    serviceId: 'website-design',
    order: 6,
    level: 'Advanced',
    title: 'Full Websites with E-Commerce & CMS',
    duration: '35 min',
    summary: 'Build complete websites with online stores or booking systems and a content management system.',
    sections: [
      { heading: 'What you will learn', body: 'The most advanced websites do more than display information — they sell products, take bookings, and let the owner update content without a developer. This lesson covers building a full website with e-commerce or booking functionality and a content management system (CMS). This is the craft behind CreatiHub’s Premium website package — up to twelve pages, with e-commerce or booking, a CMS, and ongoing support.' },
      { heading: 'Choosing the right platform', body: 'For a full-featured site, a no-code platform is usually the right choice. Shopify leads for e-commerce — it handles products, cart, checkout, payments, and inventory out of the box. WordPress with WooCommerce is more flexible and lower-cost but requires more setup. For booking-heavy businesses (salons, clinics, classes), Squarespace or specialized booking platforms (Calendly, Acuity, SimplyBook) integrate scheduling directly. For content-heavy sites, WordPress or Webflow offer strong CMS capabilities. Match the platform to the client’s primary need: selling, booking, or publishing.' },
      { heading: 'E-commerce setup', body: 'An online store needs products, pricing, checkout, and payments. Add products with clear photos, titles, descriptions, and prices. Organize them into categories for easy browsing. Set up shipping rates or local pickup options. Configure a payment processor (Stripe, PayPal, Paystack) — never store card numbers yourself; the processor handles that securely. Test the full purchase flow with a real small transaction before launch. Optimize the product pages with great photos, clear benefits, and reviews to drive conversions.' },
      { heading: 'Booking system setup', body: 'A booking system lets customers schedule appointments or reservations online. Define your services, staff, and availability. Set booking rules (minimum notice, buffer time, cancellation policy). Connect a payment method for deposits or full payment at booking. Send automated confirmation and reminder emails or messages to reduce no-shows. Sync bookings to a shared calendar so the team always knows the schedule. A well-configured booking system runs the front desk of a service business automatically.' },
      { heading: 'Content management system', body: 'A CMS lets the site owner add and edit pages, blog posts, and products without touching code. Choose a platform with an intuitive editor — the client will use it long after you hand off. Train the client on the basics: adding a blog post, editing a product, updating contact info. Write a short guide documenting the common tasks. A site the owner can update themselves stays fresh and ranks better in search engines than a static site that goes stale. This self-sufficiency is a key value of the Premium package.' },
      { heading: 'Pro tips', body: 'Optimize for speed from the start — e-commerce and booking sites with heavy functionality can get slow; compress images, minimize plugins, and use a fast host. Make checkout or booking as short as possible; every extra step costs conversions. Set up automated abandoned-cart or abandoned-booking recovery emails. Provide thirty days of post-launch support (as the Premium package includes) to catch issues and train the client. And document everything — the login credentials, the platform, the processes — in a handover document so the client is never stranded.' },
      { heading: 'Exercise', body: 'Build a small e-commerce or booking site with three products or three bookable services using Shopify, WordPress, or a booking platform. Add a CMS-managed blog with one post. Configure checkout or booking and test it end to end. Write a one-page handover guide for the client. This replicates the Premium website package.' }
    ]
  },

  // ============ TRACK: Copywriting & SEO Content ============
  {
    id: 'lesson-wr-01',
    trackId: 'track-writing-seo',
    serviceId: 'seo-copywriting',
    order: 1,
    level: 'Beginner',
    title: 'Copywriting Fundamentals: Persuasion & Clarity',
    duration: '25 min',
    summary: 'Learn the principles of persuasive writing that turns readers into customers.',
    sections: [
      { heading: 'What you will learn', body: 'Copywriting is writing that persuades — it convinces a reader to take an action, whether buying, signing up, or clicking. This lesson covers the core principles of effective copywriting: clarity over cleverness, focusing on benefits not features, writing to one person, and structuring messages that lead to action. These fundamentals underpin CreatiHub’s SEO Content & Copywriting service and every piece of marketing writing.' },
      { heading: 'Clarity beats cleverness', body: 'The goal of copy is to be understood, not to impress. A clever pun that confuses the reader costs you a customer. Write so that a tired person skimming on a phone understands your message in one read. Use short sentences, simple words, and concrete examples. If a reader has to think twice about what you mean, the copy has failed. The best copy feels effortless to read because every unnecessary word has been cut.' },
      { heading: 'Benefits over features', body: 'Customers do not buy features; they buy outcomes. A feature is "300 DPI print-ready files." A benefit is "posters that look sharp in print and never get rejected by your printer." Translate every feature into the benefit it delivers: save time, save money, look professional, feel confident, avoid problems. The formula is "feature so that benefit." Lead with the benefit; mention the feature only to support it. This single shift transforms weak copy into persuasive copy.' },
      { heading: 'Writing to one person', body: 'Copy that addresses "everyone" resonates with no one. Write as if you are speaking to one specific customer. Use "you" generously and "we" sparingly. Picture a real person — their problem, their desire, their hesitation — and write directly to them. This focus makes the copy feel personal and relevant. When readers feel a message is speaking to their specific situation, they pay attention and act.' },
      { heading: 'The persuasive structure', body: 'Effective marketing copy often follows a classic structure: attention (a headline that stops the scroll), interest (a hook that explains why this matters to the reader), desire (benefits and proof that make them want it), and action (a clear instruction on what to do next). This AIDA structure works for ads, landing pages, emails, and product descriptions. Every sentence should move the reader from one stage to the next, building toward the action.' },
      { heading: 'Pro tips', body: 'Read your copy aloud; if you stumble, rewrite it. Cut every word that does not earn its place — "very," "really," "just," and "that" are often deletable. Use active voice ("we deliver your design" beats "your design is delivered"). Put the most important word at the start of the sentence. And always end with a clear call to action — tell the reader exactly what to do next.' },
      { heading: 'Exercise', body: 'Write a 150-word product description for a CreatiHub service using the benefits-over-features principle and the AIDA structure. Read it aloud and cut every unnecessary word. This is the writing skill behind every copywriting package.' }
    ]
  },
  {
    id: 'lesson-wr-02',
    trackId: 'track-writing-seo',
    serviceId: 'seo-copywriting',
    order: 2,
    level: 'Beginner',
    title: 'SEO Content: Keywords & Ranking on Google',
    duration: '30 min',
    summary: 'Learn how search engines work and how to write content that ranks and drives organic traffic.',
    sections: [
      { heading: 'What you will learn', body: 'SEO content is writing designed to rank in search engines so that people searching for a topic find your page. This lesson covers how search engines work, how to do keyword research, and how to write content that both ranks and serves human readers. This is the craft behind CreatiHub’s SEO Content & Copywriting service, from a single article to a full content pack.' },
      { heading: 'How search engines work', body: 'Search engines like Google crawl the web, index pages, and rank them for each search query. They aim to show the most relevant, useful, and authoritative result first. Ranking depends on hundreds of factors, but the most important for content are: relevance (does your page match the searcher’s intent?), quality (is it comprehensive and well-written?), authority (do other sites link to it?), and technical factors (is the page fast, mobile-friendly, and secure?). SEO content focuses on relevance and quality — the factors you control through writing.' },
      { heading: 'Keyword research', body: 'Keywords are the phrases people type into search engines. Research means finding the keywords your audience uses, how often they search them, and how hard it is to rank for them. Use free tools like Google Keyword Planner, Ubersuggest, or AnswerThePublic. Look for keywords with decent search volume but manageable competition — long, specific phrases ("how to design a flyer for a coffee shop") are easier to rank for than short, generic ones ("flyer design"). Understand search intent: is the searcher looking to learn, to buy, or to find a specific site? Match your content to their intent.' },
      { heading: 'Writing SEO content', body: 'Choose one primary keyword per article and include it in the title, the first paragraph, one heading, and naturally throughout the text — but never stuff it unnaturally. Write comprehensively: cover the topic fully, answer the questions a searcher would have, and aim for depth that signals expertise. Use clear headings and short paragraphs for readability. Include relevant images with descriptive alt text. Link to your other articles (internal links) and to credible external sources. Length matters for competitive topics — 1,000 to 2,000 words often outperforms thin content, but only if every word is valuable.' },
      { heading: 'On-page SEO elements', body: 'Beyond the body text, optimize the page’s metadata. The title tag (50 to 60 characters) is the clickable headline in search results and hugely affects click-through rate. The meta description (150 to 160 characters) is the summary beneath it — write it as a mini-ad that compels clicks. The URL should be short and include the keyword. Use one h1 (usually the article title) and structure the content with h2 and h3 headings. These elements tell both search engines and searchers what the page is about.' },
      { heading: 'Pro tips', body: 'Write for humans first; search engines reward content that satisfies readers. Answer the searcher’s question directly in the first paragraph — many searches end without a click if Google extracts a quick answer. Update old content regularly; fresh content signals relevance. And track your rankings over time with Google Search Console to see which articles work and which need improvement. Patience matters — SEO builds momentum over months, not days.' },
      { heading: 'Exercise', body: 'Research a keyword related to a creative service (for example, "logo design tips"). Write a 500-word SEO article optimized for it, with a title tag, meta description, headings, and internal link suggestions. This replicates the Basic SEO content package.' }
    ]
  },
  {
    id: 'lesson-wr-03',
    trackId: 'track-writing-seo',
    serviceId: 'seo-copywriting',
    order: 3,
    level: 'Intermediate',
    title: 'Long-Form Content & Content Strategy',
    duration: '30 min',
    summary: 'Plan and write comprehensive articles and a content strategy that builds authority over time.',
    sections: [
      { heading: 'What you will learn', body: 'A single article can rank and bring traffic; a sustained content strategy builds authority and compounds that traffic over time. This lesson covers writing long-form, authoritative articles and planning a content strategy that grows a brand’s presence. This is the craft behind CreatiHub’s Standard and Premium SEO packages — full SEO optimization, meta tags, images, and multi-article content packs with strategy.' },
      { heading: 'Long-form article structure', body: 'A comprehensive article (1,200 to 2,000 words) follows a clear structure. Start with a hook and a direct answer to the searcher’s question so they get immediate value. Then expand with structured sections, each covering a sub-topic under a clear heading. Use examples, data, and step-by-step instructions to add depth and credibility. Include visuals — images, diagrams, or tables — to break up text and aid understanding. End with a summary and a call to action. The goal is to be the most useful result on the page, so the searcher never needs to click back to Google.' },
      { heading: 'Writing with authority', body: 'Authority comes from depth, accuracy, and originality. Demonstrate expertise by covering nuances that generic articles skip. Cite credible sources and link to them. Include original insights, examples, or data from your own experience. Use a confident, knowledgeable tone without jargon that alienates. Search engines increasingly reward content that shows genuine expertise, experience, authoritativeness, and trustworthiness — the qualities Google calls E-E-A-T. An article that reads like it was written by someone who actually knows the topic outperforms generic content.' },
      { heading: 'Content strategy', body: 'A content strategy maps what to publish, when, and why. Start with topic clusters: choose a broad topic (for example, "graphic design"), create a comprehensive pillar page covering it, and surround it with supporting articles on sub-topics that all link back to the pillar. This structure signals topical authority to search engines. Plan a publishing cadence — weekly or biweekly — and maintain it; consistency builds both audience and search momentum. Map each article to a keyword and a stage of the customer journey (awareness, consideration, decision) so content serves business goals, not just traffic.' },
      { heading: 'Content that converts', body: 'Traffic without conversion is wasted. Every article should have a purpose beyond information — to capture an email, to drive a trial, to nudge toward a purchase. Include a relevant call to action in each article matched to where the reader is in their journey. An awareness-stage article might offer a free guide in exchange for an email. A decision-stage article might offer a consultation or a discount. Link related articles so a reader flows naturally from learning to considering to acting. This conversion focus is what makes content a business asset, not just a traffic source.' },
      { heading: 'Pro tips', body: 'Before writing, search your target keyword and read the top-ranking articles — your goal is to create something better, more complete, or more current than all of them. Update published articles every few months; refreshing content with new information can boost rankings significantly. Repurpose one long article into several shorter pieces (social posts, an email, a video script) to multiply its value. And track which articles drive the most conversions, not just traffic — that data guides where to invest future writing.' },
      { heading: 'Exercise', body: 'Plan a content cluster: one pillar article (1,500 words) on "graphic design for small businesses" and three supporting article ideas, each mapped to a keyword and a customer-journey stage. Write the pillar article fully with headings, examples, and a call to action. This replicates the Standard and Premium SEO content packages.' }
    ]
  },
  {
    id: 'lesson-wr-04',
    trackId: 'track-writing-seo',
    serviceId: 'translation',
    order: 4,
    level: 'Intermediate',
    title: 'AI Translation & Content Localization',
    duration: '25 min',
    summary: 'Use AI translation to adapt content for global audiences while preserving meaning and tone.',
    sections: [
      { heading: 'What you will learn', body: 'Translation opens your content to a global audience, but literal translation often fails — idioms, tone, and cultural references do not transfer directly. This lesson covers how to use AI translation effectively, how to localize content (adapt it culturally, not just linguistically), and how to verify quality. This is the craft behind CreatiHub’s AI Translation & Localization service.' },
      { heading: 'Translation vs. localization', body: 'Translation converts words from one language to another. Localization goes further — it adapts the content so it feels native to the target culture. This includes converting currencies, date formats, units of measurement, and culturally specific references. A phrase like "break a leg" translated literally confuses a non-English reader; localization replaces it with the equivalent well-wish in the target language. For business content, localization is what makes a brand feel local and trustworthy rather than foreign and impersonal.' },
      { heading: 'Using AI translation tools', body: 'AI translation tools (Google Translate, DeepL, and AI writing assistants) handle the heavy lifting of converting text between languages, and they are remarkably accurate for straightforward content. For best results, feed them clean, simple source text — avoid idioms, slang, and ambiguous phrasing in the original that the AI might mistranslate. Translate in smaller chunks and review each. For high-stakes content (marketing, legal, medical), always have a native speaker review the AI output, because nuance and cultural fit are where AI still stumbles.' },
      { heading: 'Preserving tone and brand voice', body: 'A brand’s voice must stay consistent across languages. If your English copy is warm and playful, the translated version should be too — not suddenly formal. Give the translator (human or AI with instructions) a brief on the desired tone, the target audience, and any brand-specific terms to keep consistent. Create a glossary of terms (product names, taglines, key phrases) with their approved translations so every piece of localized content uses them consistently. This consistency is what makes a global brand feel coherent.' },
      { heading: 'Quality verification', body: 'Verification is essential because translation errors can embarrass a brand or cause real harm. For important content, use a three-step process: AI translation for the draft, a native speaker review for accuracy and tone, and a final proofread. Back-translation (translating the target text back to the original language) can reveal subtle errors. Pay special attention to numbers, dates, currencies, and names — these are easy to get wrong and highly visible. The Premium translation approach treats every language with the same care as the original.' },
      { heading: 'Pro tips', body: 'Write the original content in clear, simple language — it translates better than complex, idiom-heavy prose. Avoid humor and wordplay, which rarely survive translation. Localize images too — a photo that feels natural in one culture may feel off in another. Test localized content with native speakers before publishing. And maintain a translation memory (a database of previously translated phrases) so repeated terms stay consistent and future translations are faster.' },
      { heading: 'Exercise', body: 'Take a 300-word marketing text and translate it into two other languages using an AI tool. Then manually review and localize one of them — adjust any literal translations, convert currencies or cultural references, and ensure the tone matches the original. This replicates the translation and localization workflow.' }
    ]
  },
  {
    id: 'lesson-wr-05',
    trackId: 'track-writing-seo',
    serviceId: 'seo-copywriting',
    order: 5,
    level: 'Advanced',
    title: 'Running a Content Operation at Scale',
    duration: '30 min',
    summary: 'Build systems for producing, optimizing and managing content consistently across many topics.',
    sections: [
      { heading: 'What you will learn', body: 'Producing one great article is a project; producing a steady stream of optimized content across many topics is an operation. This lesson covers how to build a content production system — editorial workflows, AI-assisted drafting, quality control, and performance tracking — that scales without sacrificing quality. This is the professional layer behind delivering content packs and retainer content services.' },
      { heading: 'The editorial workflow', body: 'A repeatable workflow keeps content consistent. Define stages: ideation (what to write, based on keyword research and strategy), outlining (the article structure), drafting (the writing), editing (clarity and persuasion), SEO review (keywords, meta, links), and publishing. Assign clear ownership for each stage, even if you do them all yourself — treating them as distinct steps prevents skipped work. Maintain an editorial calendar tracking each piece’s topic, keyword, stage, owner, and publish date. This structure turns ad-hoc writing into a reliable production line.' },
      { heading: 'AI-assisted drafting', body: 'AI writing tools accelerate content production by generating first drafts, outlines, and variations from a brief. Use AI for the heavy lifting — expanding an outline into a draft, generating multiple headline options, summarizing research — then apply human editing for voice, accuracy, and originality. Never publish AI output unedited; readers and search engines increasingly detect and devalue generic AI text. The most effective workflow uses AI as a fast assistant and a human editor as the final quality gate. This hybrid approach produces more content at higher quality than either alone.' },
      { heading: 'Quality control', body: 'At scale, quality slips if unchecked. Build a checklist every article must pass: does it directly answer the target query? Is it accurate and well-sourced? Is it free of grammar and spelling errors? Does it include the primary keyword naturally? Are the meta title and description optimized? Are there internal and external links? Is it formatted with clear headings and short paragraphs? Does it end with a call to action? A checklist ensures every piece meets the same standard, regardless of who wrote it or how fast the deadline was.' },
      { heading: 'Performance tracking & iteration', body: 'Track each article’s performance in Google Search Console and analytics: rankings, impressions, clicks, and conversions. Identify which topics and formats perform best and double down on them. Update underperforming articles — refresh the content, improve the title, add new sections — and watch rankings climb. Build a feedback loop where performance data informs the next month’s content plan. This data-driven iteration is what separates a content operation that grows from one that stalls.' },
      { heading: 'Pro tips', body: 'Batch similar tasks — outline five articles in one session, draft them in the next, edit them in a third — for efficiency. Build a swipe file of great headlines, intros, and CTAs to draw inspiration from. Document your style guide so every piece sounds like one brand. And for client work, deliver a content calendar and a strategy document alongside the articles, so the client can continue the momentum — this is what makes a content pack a strategic asset, not just a batch of text.' },
      { heading: 'Exercise', body: 'Design a one-month content operation: an editorial calendar with eight article topics mapped to keywords, a production workflow with defined stages, a quality checklist, and a performance tracking plan. Produce two of the articles end to end through the workflow. This replicates the Premium content pack and the operational layer of a content service.' }
    ]
  },

  // ============ TRACK: AI Photography & Imaging ============
  {
    id: 'lesson-ph-01',
    trackId: 'track-photography',
    serviceId: 'product-photography',
    order: 1,
    level: 'Beginner',
    title: 'AI Product Photography Fundamentals',
    duration: '25 min',
    summary: 'Learn how AI product photography works and how to prepare product photos for the best results.',
    sections: [
      { heading: 'What you will learn', body: 'AI product photography generates professional product scenes from a single photo — no studio, no lighting setup, no photographer. This lesson covers how the technology works, how to capture or select a source photo that produces great results, and the range of outputs possible. This is the foundation of CreatiHub’s AI Product Photography service, from five basic scenes to unlimited premium ad creatives.' },
      { heading: 'How AI product photography works', body: 'AI product photography tools take a photo of a product (ideally on a clean background) and generate new images of that product in different scenes, backgrounds, and lighting — on a marble countertop, in a lifestyle setting, floating in a clean studio, on a retail shelf. The AI preserves the product’s shape, color, and details while placing it in a new context. This replaces expensive studio shoots and lets a brand have dozens of professional product images from one source photo. The quality depends heavily on the quality of the source photo you provide.' },
      { heading: 'Capturing a great source photo', body: 'The source photo is the input that determines everything. Capture it in good, even lighting — natural window light or a softbox — avoiding harsh shadows and reflections. Photograph the product on a plain, contrasting background (white or light gray works best) so the AI can isolate it cleanly. Fill the frame with the product but leave a small margin. Shoot in sharp focus at the highest resolution your camera allows. Keep the product clean and well-presented. A poor source photo produces poor generated scenes, regardless of the AI tool.' },
      { heading: 'Types of product scenes', body: 'AI can generate several scene types that serve different marketing needs. Clean studio shots (product on a plain or gradient background) suit e-commerce listings and catalogs. Lifestyle scenes (product in a realistic environment — a skincare bottle on a bathroom shelf, headphones on a desk) suit social media and ads. Creative and conceptual scenes (product in an unexpected or artistic setting) suit hero banners and brand campaigns. Infographic-style scenes (product with callout labels and feature highlights) suit ads that educate. Choosing the right scene type for each use case is the skill.' },
      { heading: 'Common pitfalls & fixes', body: 'AI product photography can distort the product — changing its proportions, adding artifacts, or altering colors. Minimize this by using a high-quality source photo and a tool known for product fidelity. Always review every generated image critically: does the product still look like the real product? Are colors accurate? Are there weird artifacts around edges? Regenerate any image that distorts the product, because an inaccurate product photo damages trust and can cause returns. For e-commerce, accuracy is non-negotiable; for conceptual ad creative, more artistic liberty is acceptable.' },
      { heading: 'Pro tips', body: 'Generate multiple variations of each scene and pick the best — the first result is rarely the strongest. Keep the product the hero: scenes should complement it, not overwhelm it. Maintain a consistent visual style across a product line so the brand looks cohesive. And always deliver a mix of clean shots (for listings) and lifestyle shots (for marketing) so the client has images for every use case. This range is what makes the Standard and Premium packages complete.' },
      { heading: 'Exercise', body: 'Photograph a product (a bottle, a box, a device) on a clean background in good lighting. Use an AI product photography tool to generate five different scenes: a clean studio shot, a lifestyle scene, and three others of your choice. Review each for product accuracy. This replicates the Basic product photography package.' }
    ]
  },
  {
    id: 'lesson-ph-02',
    trackId: 'track-photography',
    serviceId: 'pro-headshots',
    order: 2,
    level: 'Beginner',
    title: 'AI Professional Headshots',
    duration: '20 min',
    summary: 'Generate studio-quality professional headshots from casual selfies using AI.',
    sections: [
      { heading: 'What you will learn', body: 'AI headshot tools turn a few casual selfies into professional studio-quality headshots — in business attire, with proper lighting and backgrounds, at a fraction of a studio session’s cost. This lesson covers how to prepare source selfies, how to choose styles, and how to select the best results. This is the craft behind CreatiHub’s AI Professional Headshots service.' },
      { heading: 'Preparing source selfies', body: 'The AI needs several source photos to learn your face and generate accurate headshots. Provide eight to twelve selfies with variety: different angles, expressions, and lighting, but all clearly showing your face. Avoid sunglasses, hats, and heavy filters that obscure your features. Use good lighting — natural light facing a window is ideal. Keep a neutral or slight smile in most photos. The more varied and clear the source photos, the more accurate and natural the generated headshots will be.' },
      { heading: 'Choosing headshot styles', body: 'AI headshot platforms offer style presets: business formal (suit and tie, neutral studio background), business casual (smart shirt, softer background), creative professional (more relaxed, modern setting), and industry-specific (healthcare in scrubs, tech in smart-casual). Choose a style that matches the professional context — a corporate executive needs formal; a startup founder suits casual; a creative professional can go modern. Generate several styles so the client has options for different uses: a LinkedIn photo, a company website team page, a speaker bio, a press kit.' },
      { heading: 'Selecting and refining results', body: 'AI generates multiple headshots per style; not all will look like the real person. Review every result critically: does it actually look like the subject? Is the face natural or slightly off? Are the eyes and skin realistic? Discard any that look distorted or unlike the person — a headshot that does not look like you is worse than none. From the good ones, select a primary headshot (the most natural and professional) plus two or three alternates. Slight artifacts in hair, teeth, or hands are common; choose images where these are minimal.' },
      { heading: 'Backgrounds & formats', body: 'A professional headshot typically has a clean, uncluttered background — solid color, a soft gradient, or a subtly blurred office or studio. AI tools let you choose or change backgrounds. For team pages, a consistent background across all team members looks cohesive. Deliver the final headshots in high resolution (at least 1000 × 1000 pixels) as JPG, and include a version with a transparent background if the client may place the photo on different backgrounds. Square and portrait crops cover most use cases.' },
      { heading: 'Pro tips', body: 'Honesty matters: a headshot should look like the person on their best day, not like a different person. Avoid over-stylizing to the point of unrecognizability. For team headshots, use the same style and background for every member for a unified company page. Keep the source photos on file so you can regenerate quickly if the client needs a new style later. And always deliver more options than needed so the client can choose their favorite — selection is part of the value.' },
      { heading: 'Exercise', body: 'Take eight varied selfies and use an AI headshot tool to generate professional headshots in two styles (formal and casual). Critically review all results, discard any that do not look like you, and select a primary headshot plus two alternates. Export at high resolution. This replicates the AI Professional Headshots service.' }
    ]
  },
  {
    id: 'lesson-ph-03',
    trackId: 'track-photography',
    serviceId: 'product-photography',
    order: 3,
    level: 'Intermediate',
    title: 'Advanced Product Scenes & Ad Creatives',
    duration: '30 min',
    summary: 'Create lifestyle, conceptual and ad-ready product imagery that drives clicks and sales.',
    sections: [
      { heading: 'What you will learn', body: 'Beyond clean product shots, AI product photography can create lifestyle scenes, conceptual compositions, and ad-ready creatives that drive engagement. This lesson covers designing scenes that sell, creating variations for ad testing, and producing a complete set of marketing imagery. This is the craft behind CreatiHub’s Standard and Premium product photography packages — more scenes, more products, and ad-ready creatives.' },
      { heading: 'Lifestyle scenes that sell', body: 'Lifestyle scenes place a product in a realistic, aspirational context that helps the customer imagine owning it. A skincare bottle on a sunlit vanity, headphones on a desk beside a coffee, sneakers on an urban street — these scenes connect the product to a desirable moment. Choose settings that match the target customer’s life and aspirations. Keep the product prominent and the scene supportive; the product must remain the hero. Use lighting that flatters both the product and the scene — warm and soft for lifestyle, bright and clean for freshness.' },
      { heading: 'Conceptual & hero campaign imagery', body: 'For brand campaigns and hero banners, conceptual scenes create visual impact that a literal scene cannot. A beverage can bursting with fruit, a perfume bottle emerging from clouds, a tech product floating with dynamic light trails — these scenes are about emotion and attention, not realism. Use them for the top of a homepage, a launch campaign, or a social ad that needs to stop the scroll. Conceptual scenes allow more artistic liberty with the product’s surroundings, but the product itself should still be recognizable and accurate.' },
      { heading: 'Ad-ready creatives', body: 'Ad creatives combine product imagery with marketing elements — headlines, offers, call-to-action buttons, brand logos. Design the product scene with space for text overlay (leave negative space in the composition). Ensure the product and the text have strong contrast so both read clearly. Create multiple variations for A/B testing: different scenes, different headlines, different offers. The ad platforms will show you which combination performs best, so producing variations upfront enables data-driven optimization. This testing capability is what makes the Premium package’s ad-ready creatives a marketing asset.' },
      { heading: 'Managing multiple products', body: 'When shooting a product line, maintain visual consistency across all items so the collection looks cohesive. Use the same scene style, lighting, and background treatment for related products. Create a set of scenes that works across the line — for example, every product in the collection gets a clean shot, a lifestyle shot, and a conceptual shot, all in a matching style. This consistency makes a product line feel like a considered brand rather than random items. Deliver organized by product and by scene type so the client can find what they need.' },
      { heading: 'Pro tips', body: 'Design every scene with the final use in mind — a social ad needs different composition than a website hero. Keep a consistent color treatment across a product line. Generate seasonal variations (the same product in summer and winter scenes) so the brand has fresh imagery year-round. And always deliver both high-resolution masters and platform-optimized exports (square for Instagram, portrait for stories, landscape for web) so the client can use the images everywhere without re-editing.' },
      { heading: 'Exercise', body: 'Take one product and create a complete set of marketing imagery: a clean studio shot, a lifestyle scene, a conceptual hero image, and an ad creative with space for text overlay. Generate the set in a consistent style. Export in square, portrait, and landscape crops. This replicates the Premium product photography package.' }
    ]
  },
  {
    id: 'lesson-ph-04',
    trackId: 'track-photography',
    serviceId: 'pro-headshots',
    order: 4,
    level: 'Advanced',
    title: 'Team Headshots & Brand Visual Consistency',
    duration: '25 min',
    summary: 'Produce cohesive headshots for an entire team and maintain visual consistency across a brand.',
    sections: [
      { heading: 'What you will learn', body: 'A company’s team page is one of its most visited and most trusted pages, and consistent, professional headshots across the team build credibility. This lesson covers producing cohesive headshots for multiple team members and maintaining visual consistency across all of a brand’s people imagery. This is the professional application of CreatiHub’s AI Professional Headshots service for teams and companies.' },
      { heading: 'Planning a team headshot project', body: 'Before generating, define the project parameters so every team member’s headshot matches. Choose one style (formal, casual, or creative) appropriate to the company culture. Choose one background treatment — a solid color, a soft gradient, or a consistent blurred office — and apply it to everyone. Define the crop (head and shoulders is standard for team pages) and the aspect ratio. Communicate these guidelines to every team member so their source selfies align (similar lighting, similar framing). Consistency in the inputs produces consistency in the outputs.' },
      { heading: 'Collecting consistent source photos', body: 'Ask each team member to submit source selfies following the same guidelines: eight to twelve photos, good lighting, clear face, no sunglasses or hats, variety of angles. Provide a simple instruction sheet with example photos so everyone understands what to submit. The more uniform the source photos, the more cohesive the final set. Review submissions and request retakes from anyone whose photos are too dark, too filtered, or unclear — poor inputs for one team member will make their headshot stand out as inconsistent.' },
      { heading: 'Generating and reviewing', body: 'Generate headshots for each team member using the same style and background settings. Review each person’s results individually for likeness and quality, discarding any distorted images. Then review the set as a whole: do they look like one cohesive team? Adjust any that deviate in lighting, background, or style until the set is uniform. It is common to regenerate one or two team members’ headshots a few times to match the group’s overall look. The goal is a team page where every headshot feels like it was shot in the same session.' },
      { heading: 'Delivery & maintenance', body: 'Deliver the team headshots in a consistent format: same dimensions, same file naming convention (for example, "firstname-lastname-headshot.jpg"), same background. Provide both individual files and a contact sheet showing the whole team at a glance. Write a brief guide for adding new team members in the future — the style settings and source photo guidelines — so the company can maintain consistency as the team grows. This documentation is what makes a team headshot project a lasting brand asset rather than a one-time shoot.' },
      { heading: 'Pro tips', body: 'Keep all the source photos and the generation settings on file so new hires can be added seamlessly. Consider creating two styles per person — one formal for the website team page and one casual for social media — so the brand has options. Match the headshot style to the brand’s overall visual identity: if the brand is modern and vibrant, choose a brighter, more contemporary style; if it is traditional and serious, choose formal. And update team headshots every year or two so the photos stay current as people change.' },
      { heading: 'Exercise', body: 'Plan a team headshot project for a fictional five-person company. Write the source photo guidelines, choose a style and background, and describe the review and delivery process. If you have willing friends or family, generate headshots for two or three of them in the same style and review them as a set. This replicates the team headshot application of the service.' }
    ]
  },

  // ============ TRACK: Business & Brand Design ============
  {
    id: 'lesson-bu-01',
    trackId: 'track-business-design',
    serviceId: 'pitch-deck',
    order: 1,
    level: 'Intermediate',
    title: 'Pitch Deck Design: Storytelling for Investors',
    duration: '35 min',
    summary: 'Design pitch decks that tell a compelling story and persuade investors to act.',
    sections: [
      { heading: 'What you will learn', body: 'A pitch deck is a presentation that persuades investors, partners, or clients to back your business. This lesson covers the narrative structure of a winning pitch deck, slide design principles, and how to present data compellingly. This is the craft behind CreatiHub’s Pitch Deck & Presentation Design service, from a template-based Basic deck to an investor-ready Premium deck with copywriting.' },
      { heading: 'The pitch deck narrative', body: 'A strong pitch deck tells a story with a clear arc. The classic ten to twelve slide structure: (1) Title — company name and one-line description. (2) Problem — the pain you solve. (3) Solution — what you do. (4) Market — the opportunity size. (5) Product — how it works. (6) Traction — what you have achieved. (7) Business model — how you make money. (8) Team — why you are the right people. (9) Competition — how you are different. (10) Financials — projections. (11) The ask — how much you are raising and what for. Each slide should convey one idea; cramming multiple ideas onto a slide overwhelms the audience.' },
      { heading: 'Slide design principles', body: 'Each slide should be visually clean and instantly understandable. Use one headline per slide that states the key takeaway. Support it with minimal text and strong visuals — a chart, a diagram, a screenshot, or a single bold image. Avoid bullet-point walls; if a slide has more than four short bullets, simplify it. Maintain a consistent visual template: same fonts, colors, logo placement, and slide layout throughout. Whitespace is your friend — a spacious slide feels confident; a crowded slide feels desperate.' },
      { heading: 'Presenting data visually', body: 'Investors want to see traction and market size, and charts communicate these faster than text. Use line charts for growth over time, bar charts for comparisons, and pie charts only for simple part-to-whole relationships. Label charts clearly with units and time periods. Highlight the key number — the growth rate, the market size, the revenue — with a large, bold callout. Avoid 3D charts and decorative effects that distort the data. Every chart should make one point obvious in two seconds.' },
      { heading: 'The ask & the close', body: 'The final slides are where the deck converts. State the funding amount clearly, explain exactly what it funds (hiring, marketing, product development), and describe the milestone it will achieve. Show a use-of-funds breakdown so investors see their money is well-planned. End with a clear contact slide and a memorable closing image or statement. The ask should feel specific and reasoned, not vague — "raising $500K to reach $2M ARR in 18 months" is far stronger than "looking for investment to grow."' },
      { heading: 'Pro tips', body: 'Design for the back of the room — every slide should be readable from a distance. Create two versions: a presentation version (minimal text, you narrate) and a send-version (slightly more text, readable standalone) for when investors read it after the meeting. Practice the pitch aloud; timing reveals which slides are confusing or unnecessary. And remember investors see hundreds of decks — clarity, credibility, and a compelling story are what make yours memorable.' },
      { heading: 'Exercise', body: 'Outline a ten-slide pitch deck for a fictional startup, writing the headline and key visual for each slide. Design three of the slides (problem, solution, and the ask) as fully laid-out slides in a consistent template. This replicates the Standard pitch deck package.' }
    ]
  },
  {
    id: 'lesson-bu-02',
    trackId: 'track-business-design',
    serviceId: 'email-campaign',
    order: 2,
    level: 'Intermediate',
    title: 'Email Campaign Design That Converts',
    duration: '30 min',
    summary: 'Design email campaigns — visuals, copy and structure — that get opened, read and clicked.',
    sections: [
      { heading: 'What you will learn', body: 'Email remains one of the highest-returning marketing channels, and its success depends on design as much as copy. This lesson covers the anatomy of a high-converting email, visual design for email, and campaign structure. This is the craft behind CreatiHub’s Email Campaign Design service.' },
      { heading: 'Email anatomy', body: 'A marketing email has components that each affect performance. The subject line (40 to 50 characters) determines whether the email is opened; make it specific, intriguing, and honest. The preheader text (the preview line after the subject) reinforces the open. The header carries the brand logo and sets visual identity. The hero section — the top of the email — carries the main message and image, seen before scrolling. The body supports the message. The call to action is a clear button. The footer includes unsubscribe and contact info (legally required). Every element should serve one goal: getting the click.' },
      { heading: 'Visual design for email', body: 'Email design has technical constraints: many email clients do not support modern CSS, and images may be blocked by default. Design with a single-column layout (most reliable across clients), use web-safe fonts or system fonts, and keep the design readable even if images do not load — meaning critical text should be real text, not embedded in images. Use brand colors consistently. Make the primary call-to-action button large, high-contrast, and obvious. Keep the width under 600 pixels so the email reads well on mobile, where most emails are opened.' },
      { heading: 'Copy & structure', body: 'Email copy should be concise and skimmable. Lead with the value — what is in it for the reader — in the first line. Use short paragraphs and clear headings. Write a call to action that is specific ("Shop the sale," "Read the guide," "Book your call") rather than generic ("Click here"). Create a sense of urgency or exclusivity when genuine ("24 hours only," "for our subscribers first"). Match the tone to the audience and the brand. And keep the email focused on one primary action; multiple competing calls to action dilute clicks.' },
      { heading: 'Campaign structure', body: 'A campaign is a series of emails, not just one. A welcome series introduces a new subscriber to the brand over three to five emails. A promotional campaign builds to a launch or sale. A re-engagement campaign wins back inactive subscribers. Each email in a series should build on the previous, moving the reader toward a goal. Map the series before writing individual emails so the arc is coherent. Time the emails thoughtfully — not too frequent (which causes unsubscribes) and not too sparse (which loses momentum).' },
      { heading: 'Pro tips', body: 'Test subject lines with A/B splits to learn what your audience opens. Personalize with the recipient’s name and relevant content when possible. Segment your list so emails are relevant to each group rather than blasting everyone. Always include a clear, working unsubscribe link — honoring unsubscribes protects your sender reputation. Preview every email on both desktop and mobile before sending. And track open rates, click rates, and conversions to learn what works and improve future campaigns.' },
      { heading: 'Exercise', body: 'Design a three-email welcome campaign for a fictional brand. Write the subject line, preheader, and body copy for each, and design one of the emails as a visual mockup in a single-column, mobile-friendly layout. This replicates the email campaign design service.' }
    ]
  },
  {
    id: 'lesson-bu-03',
    trackId: 'track-business-design',
    serviceId: 'book-cover',
    order: 3,
    level: 'Intermediate',
    title: 'Book Cover & E-Book Design',
    duration: '30 min',
    summary: 'Design book covers that capture a book’s essence and sell in thumbnail size.',
    sections: [
      { heading: 'What you will learn', body: 'A book cover is the book’s primary marketing tool — it must capture the book’s essence and compel a reader to pick it up (or click it) in a fraction of a second. This lesson covers book cover design principles, typography for covers, and e-book formatting. This is the craft behind CreatiHub’s Book Cover & E-book Design service.' },
      { heading: 'Cover design principles', body: 'A book cover communicates genre, tone, and quality instantly. Readers recognize genres by visual conventions — a thriller has bold, dark, high-contrast typography; a romance has warm, elegant typography; a business book has clean, confident design. Working within genre conventions helps the right readers find the book; breaking them risks confusing the audience. The cover must work at thumbnail size, since most books are discovered online at 100 pixels wide. Test your design at that size — if the title and the key image are illegible, simplify.' },
      { heading: 'Typography on covers', body: 'The title is the most important element and must be instantly readable. Use a bold, distinctive display font for the title and a simpler font for the author name. The title should be the largest text element, typically occupying significant space. High contrast between the text and the background is essential — light text on dark, or dark on light, with no busy imagery behind the text. Limit the cover to one or two fonts. The author name grows in size with the author’s fame; a first-time author’s name is smaller, a bestseller’s name may be as large as the title.' },
      { heading: 'Imagery & composition', body: 'Whether using a photograph, an illustration, or a purely typographic cover, the composition should have a clear focal point and a hierarchy that guides the eye to the title. Leave breathing room — a cluttered cover feels amateur. A strong cover often has one striking visual idea rather than many elements competing. Consider the spine and back cover for print: the spine carries the title and author (readable when shelved), and the back cover carries a compelling blurb, the author photo, and a barcode. For e-books, only the front cover matters, but design it to look good on both color and grayscale screens.' },
      { heading: 'E-book formatting', body: 'Beyond the cover, an e-book needs a clean, readable interior. Format the manuscript with a title page, copyright page, table of contents, and chapters with consistent heading styles. Use a readable font (serif for long-form reading, sans-serif for shorter or technical books), comfortable line spacing, and chapter breaks. Export in EPUB (the standard e-book format) and, for Amazon, a Kindle-compatible format. A well-formatted e-book reads as professionally as a traditionally published book; a poorly formatted one frustrates readers and draws negative reviews.' },
      { heading: 'Pro tips', body: 'Research the top-selling books in your genre before designing — your cover should feel at home in that company while standing out. Avoid using too many fonts, overly busy imagery, or illegible decorative fonts. If you use stock imagery, ensure you have the rights for book cover use. Test the cover in grayscale and at thumbnail size. And remember the cover is a promise of the book’s content and quality — make sure the interior delivers on what the cover suggests.' },
      { heading: 'Exercise', body: 'Design a book cover for a fictional book in a genre of your choice. Research genre conventions, choose typography and imagery that fit, and ensure the title is legible at thumbnail size. Design the front cover, and outline the spine and back cover for a print version. This replicates the book cover design service.' }
    ]
  },
  {
    id: 'lesson-bu-04',
    trackId: 'track-business-design',
    serviceId: 'virtual-staging',
    order: 4,
    level: 'Advanced',
    title: 'Virtual Staging & Interior Concepts',
    duration: '30 min',
    summary: 'Use AI to stage empty rooms and present interior design concepts for real estate.',
    sections: [
      { heading: 'What you will learn', body: 'Virtual staging digitally furnishes empty rooms so buyers can imagine a property as a home, dramatically increasing interest and sales speed. This lesson covers how virtual staging works, preparing property photos, and creating compelling interior concepts. This is the craft behind CreatiHub’s Virtual Staging & Interior Concepts service, from a single staged photo to a full property set.' },
      { heading: 'Why virtual staging works', body: 'Empty rooms photograph coldly and make it hard for buyers to gauge scale and purpose — a bedroom looks like just a box. Staged rooms feel like a home, help buyers emotionally connect, and sell faster and for higher prices. Physical staging — renting and delivering furniture — is expensive and slow. Virtual staging adds realistic furniture to a photo of an empty room digitally, at a fraction of the cost, with unlimited style options. For real estate agents and developers, virtual staging is a high-return marketing investment.' },
      { heading: 'Preparing the room photo', body: 'The source photo determines the staging quality. Photograph the empty room with a wide-angle lens from a natural viewing position (about doorway height). Use good lighting — turn on all lights and shoot during daylight if possible. Keep the camera level to avoid distorted walls and furniture later. Avoid capturing the photographer or reflective surfaces. A clean, well-lit, straight-on photo of the empty room is the ideal input. The AI or designer needs to see the room’s proportions, flooring, wall color, and windows clearly to place furniture realistically.' },
      { heading: 'Choosing furniture styles', body: 'Match the staging style to the property and target buyer. A luxury apartment suits modern, high-end furniture. A family home suits warm, inviting traditional styling. A downtown loft suits industrial or minimalist design. A vacation rental suits casual, relaxed furniture. Using the right style helps the target buyer imagine living there. Keep the style consistent across all rooms in a property so the staging feels like one coherent home. Avoid overcrowding — leave walking space so the room feels spacious, not cramped. The furniture should fit the room’s scale proportionally.' },
      { heading: 'Realism & quality control', body: 'The cardinal rule of virtual staging is that it must look real. Common flaws that betray digital staging: furniture with unnatural shadows, reflections that do not match the room’s lighting, furniture floating or at wrong scale, edges that look cut out. Review every staged image critically. Ensure shadows fall in the correct direction given the room’s light sources. Match the furniture’s color temperature to the room. Make sure furniture sits naturally on the floor, not floating. For premium work, a human designer retouches the AI output to fix these details, because discerning buyers and agents notice unrealistic staging.' },
      { heading: 'Pro tips', body: 'Offer multiple style options per room so the agent or seller can choose — a buyer unsure of a property’s potential sees possibilities across styles. Stage the key rooms first (living room, primary bedroom, kitchen) as they most influence buying decisions. Provide both staged and empty versions so agents can show the true room when needed (some markets require disclosing virtual staging). For renovation projects, offer "renovation preview" concepts showing potential upgrades. And deliver MLS-ready images at the resolution real estate platforms require.' },
      { heading: 'Exercise', body: 'Find or photograph an empty room. Use a virtual staging tool to furnish it in two different styles (modern and traditional). Review both images critically for realism — shadows, scale, lighting — and note any flaws. Export at high resolution suitable for a property listing. This replicates the virtual staging service.' }
    ]
  },
  {
    id: 'lesson-bu-05',
    trackId: 'track-business-design',
    serviceId: 'pitch-deck',
    order: 5,
    level: 'Advanced',
    title: 'Presentation Systems & Client Delivery',
    duration: '25 min',
    summary: 'Build reusable presentation systems and deliver client work that scales across projects.',
    sections: [
      { heading: 'What you will learn', body: 'Designing one presentation is a project; delivering presentations reliably for many clients is a system. This final lesson in the business design track covers building reusable presentation templates, streamlining client workflows, and delivering work professionally. This is the operational layer behind CreatiHub’s presentation and business design services.' },
      { heading: 'Template systems', body: 'Create reusable presentation templates with predefined slide layouts — a title slide, a section divider, a text-and-image slide, a chart slide, a quote slide, a team slide, and a closing slide. Each layout has locked brand elements (logo position, color palette, fonts) and flexible content zones. With a template, every new deck starts structurally complete, and you only fill in content. Maintain a library of templates for different industries (startup, corporate, creative) so you can match the client’s context instantly. A strong template system lets you produce a polished deck in hours rather than days.' },
      { heading: 'Chart & data design library', body: 'Build a library of pre-styled charts — line, bar, pie, and comparison layouts — that match your templates. Consistent chart styling makes data slides look designed rather than dumped from a spreadsheet. Create reusable data-visualization components (KPI cards, progress bars, timeline graphics) so common data presentations are drag-and-drop. This library speeds up every financial or traction slide and keeps them visually consistent across decks. For Premium work, custom financial chart design is a differentiator that makes complex numbers clear and persuasive.' },
      { heading: 'The client workflow', body: 'A smooth client workflow builds trust and prevents revision spirals. Start with a kickoff to understand the audience, the goal, and the key messages. Request the content — the data, the points, the story — in a structured brief. Design a first draft and present it for feedback at defined milestones (outline, then full draft, then final). Limit the number of revision rounds in the scope to keep projects on time and profitable. Deliver the final deck in editable format (PPTX) plus a PDF for easy sharing, and include speaker notes if the client will present live.' },
      { heading: 'Delivery & handoff', body: 'Professional delivery distinguishes a premium service. Deliver in an organized folder: the final editable file, a PDF version, a read-me note summarizing the deck structure and how to edit it, and any fonts or assets used. For ongoing clients, maintain a master template so future decks stay consistent. Offer a quick training session on using the template so the client can build their own simple decks. This handoff turns a one-time project into a long-term relationship and generates referrals — the most valuable marketing for a design service.' },
      { heading: 'Pro tips', body: 'Build templates in the tools your clients use (PowerPoint and Google Slides for broad compatibility, Figma for design-savvy clients). Keep a portfolio of your best deck work, showing before-and-after transformations. Track how long each project stage takes to quote future work accurately. And always present the final deck to the client live if possible — walking them through the story helps them present it confidently to their own audience, which reflects well on your work.' },
      { heading: 'Exercise', body: 'Design a reusable presentation template with six slide layouts in a consistent style. Document the template in a short guide explaining when to use each layout and how to edit it. Use the template to build a five-slide sample deck for a fictional client. This replicates the template system and delivery behind a professional presentation service.' }
    ]
  }
];

module.exports = { seedTracks, seedLessons };
