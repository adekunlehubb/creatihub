// ============================================================
// CreatiHub Training Programs — Seed Data
// ------------------------------------------------------------
// Paid, instructor-led training programs teaching the creative and
// technical skills behind CreatiHub's services. Each program has:
//   - Multiple tiers (Basic / Pro / Master) with different scope
//   - Duration in weeks
//   - Installment plan options (pay in 1, 2, or 3 instalments)
//   - Curriculum outline (modules + what students learn)
//   - Linked learning-center tracks for self-study complement
//
// Installment logic:
//   - "full"     → 1 payment (entire price upfront, 10% discount)
//   - "two"      → 2 instalments (50% enrollment + 50% at midpoint)
//   - "three"    → 3 instalments (~34% / 33% / 33%)
//   - "monthly"  → equal monthly payments across the program duration
// Each instalment is a separate Paystack transaction. The student
// gets access to modules as each instalment is paid (gated release).
// ============================================================

const seedTrainingPrograms = [
  {
    id: 'training-web-design',
    title: 'Web Design & Development Bootcamp',
    icon: '💻',
    category: 'Web & Tech',
    tagline: 'Design and build modern, responsive websites from scratch — no code required',
    description: 'A comprehensive, project-based bootcamp that takes you from zero to launching professional websites. You will learn modern web design principles, visual design in Figma, responsive layouts, user experience (UX) fundamentals, and how to deploy live sites. By the end, you will have built 3 real portfolio websites and gained the skills to take on freelance web design clients or land a junior developer role.',
    level: 'Beginner to Intermediate',
    durationWeeks: 8,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 4.9,
    enrolled: 340,
    maxStudents: 50,
    highlights: [
      '8 weeks of live + recorded sessions',
      'Build 3 real portfolio websites',
      'Learn Figma, HTML/CSS basics, and responsive design',
      'Deploy your first live website',
      'Certificate of completion',
      'Freelance client acquisition guide included'
    ],
    tracks: ['track-web-tech'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 120,
        desc: 'Self-paced with community support',
        features: [
          'All 8 weekly modules (recorded)',
          'Community Discord access',
          'Module exercises & projects',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 108, perPayment: 108, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 120, perPayment: 60, discountPct: 0, note: '50% now, 50% in week 4' },
          { id: 'three', label: '3 instalments', count: 3, total: 120, perPayment: 40, discountPct: 0, note: 'Pay in 3 equal parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 280,
        desc: 'Live cohort + mentor review + 1-on-1 sessions',
        features: [
          'Everything in Basic',
          'Weekly live group sessions',
          'Personal mentor code reviews',
          '2 × 1-on-1 coaching calls',
          'Live deployment workshop',
          'Freelance starter kit (contracts, pricing guide)',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 252, perPayment: 252, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 280, perPayment: 140, discountPct: 0, note: '50% now, 50% in week 4' },
          { id: 'three', label: '3 instalments', count: 3, total: 280, perPayment: 94, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Monthly', count: 8, total: 280, perPayment: 35, discountPct: 0, note: '$35/week × 8 weeks' }
        ]
      },
      {
        id: 'master',
        name: 'Master',
        price: 580,
        desc: 'Full mentorship + freelance launch + lifetime access',
        features: [
          'Everything in Pro',
          'Weekly 1-on-1 mentor sessions',
          'Lifetime access to all future updates',
          'Freelance launch accelerator (get first 3 clients)',
          'Personal portfolio review & optimization',
          'Custom domain + hosting setup assistance',
          'Direct WhatsApp mentor access'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 522, perPayment: 522, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 580, perPayment: 290, discountPct: 0, note: '50% now, 50% in week 4' },
          { id: 'three', label: '3 instalments', count: 3, total: 580, perPayment: 194, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Monthly', count: 8, total: 580, perPayment: 73, discountPct: 0, note: '$73/week × 8 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'Web Design Fundamentals', desc: 'How the web works, design principles, color theory, typography for screens, and setting up your workspace.' },
      { week: 2, title: 'Designing in Figma', desc: 'Creating wireframes, mockups, and prototypes. Auto-layout, components, and design systems.' },
      { week: 3, title: 'HTML & CSS Essentials', desc: 'Structure with HTML5, styling with CSS3, the box model, flexbox, and responsive design with media queries.' },
      { week: 4, title: 'Responsive & Mobile-First', desc: 'Mobile-first design, CSS grid, breakpoints, and testing across devices. Build your first responsive page.' },
      { week: 5, title: 'UX & User-Centered Design', desc: 'User research, personas, user flows, wireframing, and usability testing principles.' },
      { week: 6, title: 'Building a Landing Page', desc: 'Complete a conversion-focused landing page project — hero, features, testimonials, CTA, and footer.' },
      { week: 7, title: 'Deployment & Hosting', desc: 'Domain names, hosting options, deploying with Netlify/Vercel, SSL, and going live with your project.' },
      { week: 8, title: 'Freelancing & Client Work', desc: 'Pricing your services, writing proposals, client communication, contracts, and getting paid.' }
    ]
  },

  {
    id: 'training-graphic-design',
    title: 'Graphic Design Mastery Academy',
    icon: '🎨',
    category: 'Design & Creative',
    tagline: 'Master flyers, logos, social media graphics, and brand identity from beginner to pro',
    description: 'Learn the complete graphic design workflow used by CreatiHub professionals. This hands-on academy covers design fundamentals, Adobe-style tools (Canva Pro + Figma), logo creation, brand identity systems, social media content design, and print-ready production. You will complete 10+ real-world design projects and build a professional portfolio that attracts paying clients.',
    level: 'Beginner to Advanced',
    durationWeeks: 6,
    image: 'https://images.unsplash.com/photo-1626785774573-4b7787643988?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 4.8,
    enrolled: 520,
    maxStudents: 60,
    highlights: [
      '6 weeks of structured design training',
      'Complete 10+ portfolio projects',
      'Learn Canva Pro, Figma, and design fundamentals',
      'Logo design + brand identity systems',
      'Print-ready file preparation',
      'Certificate of completion'
    ],
    tracks: ['track-graphic-design'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 90,
        desc: 'Self-paced with community support',
        features: [
          'All 6 weekly modules (recorded)',
          'Community Discord access',
          '10+ design exercises',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 81, perPayment: 81, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 90, perPayment: 45, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 90, perPayment: 30, discountPct: 0, note: 'Pay in 3 equal parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 220,
        desc: 'Live cohort + portfolio review + design critiques',
        features: [
          'Everything in Basic',
          'Weekly live design critiques',
          'Personal mentor portfolio review',
          'Brand identity project walkthrough',
          'Freelance client acquisition guide',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 198, perPayment: 198, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 220, perPayment: 110, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 220, perPayment: 74, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 6, total: 220, perPayment: 37, discountPct: 0, note: '$37/week × 6 weeks' }
        ]
      },
      {
        id: 'master',
        name: 'Master',
        price: 450,
        desc: 'Full mentorship + freelance launch + lifetime access',
        features: [
          'Everything in Pro',
          'Weekly 1-on-1 mentor sessions',
          'Lifetime access to updates',
          'Freelance launch accelerator',
          'Complete brand identity portfolio build',
          'Direct WhatsApp mentor access'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 405, perPayment: 405, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 450, perPayment: 225, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 450, perPayment: 150, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 6, total: 450, perPayment: 75, discountPct: 0, note: '$75/week × 6 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'Design Fundamentals', desc: 'Principles of design, color theory, typography, composition, and visual hierarchy.' },
      { week: 2, title: 'Tools & Workflow', desc: 'Mastering Canva Pro and Figma. Templates, layers, effects, exports, and efficient workflows.' },
      { week: 3, title: 'Logo Design', desc: 'Logo types, the design process, sketching, vectorizing, presenting concepts, and revision cycles.' },
      { week: 4, title: 'Brand Identity Systems', desc: 'Color palettes, typography systems, brand guidelines, and creating cohesive visual identities.' },
      { week: 5, title: 'Social Media Design', desc: 'Instagram posts, stories, Facebook covers, YouTube thumbnails — templates and batch creation.' },
      { week: 6, title: 'Print & Freelancing', desc: 'Print-ready files, bleed, CMYK, resolution, plus pricing your services and finding clients.' }
    ]
  },

  {
    id: 'training-ai-automation',
    title: 'AI Automation & Chatbot Engineering',
    icon: '🤖',
    category: 'AI & Automation',
    tagline: 'Build AI chatbots, automate workflows, and monetize AI skills in the new economy',
    description: 'The most future-proof skill you can learn today. This program teaches you how to build AI-powered chatbots, automate business workflows, create AI content engines, and deploy AI tools that save time and generate revenue. You will work with cutting-edge AI APIs (Gemini, OpenAI), build a real chatbot from scratch, and learn how to sell AI automation services to businesses. No coding experience required — we teach everything from the ground up.',
    level: 'Beginner to Advanced',
    durationWeeks: 6,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 5.0,
    enrolled: 185,
    maxStudents: 40,
    highlights: [
      '6 weeks of cutting-edge AI training',
      'Build a real AI chatbot from scratch',
      'Learn Gemini & OpenAI API integration',
      'Automate business workflows with AI',
      'Monetize your AI skills as a service',
      'Certificate of completion'
    ],
    tracks: ['track-web-tech'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 150,
        desc: 'Self-paced with community support',
        features: [
          'All 6 weekly modules (recorded)',
          'Community Discord access',
          'Hands-on AI building exercises',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 135, perPayment: 135, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 150, perPayment: 75, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 150, perPayment: 50, discountPct: 0, note: 'Pay in 3 equal parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 350,
        desc: 'Live cohort + build your own chatbot + mentor support',
        features: [
          'Everything in Basic',
          'Weekly live build-along sessions',
          'Build & deploy your own AI chatbot',
          'Personal mentor code review',
          'AI automation sales playbook',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 315, perPayment: 315, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 350, perPayment: 175, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 350, perPayment: 117, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 6, total: 350, perPayment: 58, discountPct: 0, note: '$58/week × 6 weeks' }
        ]
      },
      {
        id: 'master',
        name: 'Master',
        price: 700,
        desc: 'Full mentorship + AI business launch + lifetime access',
        features: [
          'Everything in Pro',
          'Weekly 1-on-1 mentor sessions',
          'Lifetime access to updates',
          'AI automation business launch kit',
          'Deploy a production chatbot for a real client',
          'Direct WhatsApp mentor access',
          'API credits included ($50 value)'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 630, perPayment: 630, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 700, perPayment: 350, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 700, perPayment: 234, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 6, total: 700, perPayment: 117, discountPct: 0, note: '$117/week × 6 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'AI Fundamentals', desc: 'How LLMs work, prompt engineering basics, the AI landscape, and choosing the right model for each task.' },
      { week: 2, title: 'APIs & Integration', desc: 'Working with Gemini and OpenAI APIs, authentication, request/response cycles, and rate limits.' },
      { week: 3, title: 'Building Chatbots', desc: 'Designing conversation flows, context management, system prompts, and deploying a chatbot widget.' },
      { week: 4, title: 'AI Content Automation', desc: 'Automating content generation — blog posts, social media, email campaigns, and bulk processing.' },
      { week: 5, title: 'Workflow Automation', desc: 'Connecting AI to business tools, building automation pipelines, and no-code integration platforms.' },
      { week: 6, title: 'Selling AI Services', desc: 'Packaging AI automation as a service, pricing, finding business clients, and delivering projects.' }
    ]
  },

  {
    id: 'training-social-media',
    title: 'Social Media Content & Strategy',
    icon: '📱',
    category: 'Marketing',
    tagline: 'Create scroll-stopping content and grow brands across every platform',
    description: 'Learn how to plan, design, and execute social media strategies that grow audiences and drive engagement. This program covers content creation (posts, stories, reels), design for social platforms, content calendars, analytics, and how to manage social media for clients as a paid service. Perfect for aspiring social media managers and business owners.',
    level: 'Beginner to Intermediate',
    durationWeeks: 4,
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 4.7,
    enrolled: 280,
    maxStudents: 50,
    highlights: [
      '4 weeks of practical social media training',
      'Create a full month of content for a brand',
      'Learn content strategy + design + analytics',
      'Manage social media for paying clients',
      'Certificate of completion'
    ],
    tracks: ['track-graphic-design', 'track-writing-seo'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 70,
        desc: 'Self-paced with community support',
        features: [
          'All 4 weekly modules (recorded)',
          'Community Discord access',
          'Content calendar templates',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 63, perPayment: 63, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 70, perPayment: 35, discountPct: 0, note: '50% now, 50% in week 2' },
          { id: 'three', label: '3 instalments', count: 3, total: 70, perPayment: 24, discountPct: 0, note: 'Pay in 3 parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 160,
        desc: 'Live cohort + content review + client acquisition',
        features: [
          'Everything in Basic',
          'Weekly live strategy sessions',
          'Personal content review & feedback',
          'Social media management playbook',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 144, perPayment: 144, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 160, perPayment: 80, discountPct: 0, note: '50% now, 50% in week 2' },
          { id: 'three', label: '3 instalments', count: 3, total: 160, perPayment: 54, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 4, total: 160, perPayment: 40, discountPct: 0, note: '$40/week × 4 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'Social Media Strategy', desc: 'Platform differences, audience targeting, brand voice, content pillars, and posting strategy.' },
      { week: 2, title: 'Content Creation & Design', desc: 'Designing posts, stories, and reels. Using Canva, batching content, and visual consistency.' },
      { week: 3, title: 'Content Calendars & Scheduling', desc: 'Planning a month of content, scheduling tools, hashtag strategy, and cross-platform repurposing.' },
      { week: 4, title: 'Analytics & Client Management', desc: 'Reading insights, optimizing performance, reporting to clients, and pricing social media management.' }
    ]
  },

  {
    id: 'training-video-production',
    title: 'Video Production & AI Editing',
    icon: '🎬',
    category: 'Video & Media',
    tagline: 'Plan, shoot, edit, and deliver professional videos with AI-powered tools',
    description: 'Learn the complete video production pipeline from scripting to final delivery. This program covers video planning, storyboarding, shooting fundamentals, editing with modern tools, AI voiceover generation, adding music and captions, and exporting for different platforms. You will produce 3 complete video projects and learn how to sell video services to clients.',
    level: 'Beginner to Intermediate',
    durationWeeks: 5,
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 4.8,
    enrolled: 210,
    maxStudents: 40,
    highlights: [
      '5 weeks of video production training',
      'Produce 3 complete video projects',
      'Learn AI voiceover + automated editing',
      'Sell video services to paying clients',
      'Certificate of completion'
    ],
    tracks: ['track-video-motion', 'track-audio'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 100,
        desc: 'Self-paced with community support',
        features: [
          'All 5 weekly modules (recorded)',
          'Community Discord access',
          '3 video project assignments',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 90, perPayment: 90, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 100, perPayment: 50, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 100, perPayment: 34, discountPct: 0, note: 'Pay in 3 parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 240,
        desc: 'Live cohort + project reviews + mentor support',
        features: [
          'Everything in Basic',
          'Weekly live editing sessions',
          'Personal project reviews',
          'AI video automation toolkit',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 216, perPayment: 216, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 240, perPayment: 120, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 240, perPayment: 80, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 5, total: 240, perPayment: 48, discountPct: 0, note: '$48/week × 5 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'Video Planning & Scripting', desc: 'Concept development, scripting, storyboarding, shot lists, and pre-production planning.' },
      { week: 2, title: 'Shooting Fundamentals', desc: 'Camera basics, lighting, audio capture, framing, and shooting for different platforms.' },
      { week: 3, title: 'Editing Essentials', desc: 'Cutting, transitions, color correction, pacing, and editing software workflows.' },
      { week: 4, title: 'AI Voiceover & Audio', desc: 'Generating AI voiceovers, adding music, sound design, and audio mixing.' },
      { week: 5, title: 'Export, Captions & Delivery', desc: 'Export settings for each platform, adding captions, thumbnails, and client delivery.' }
    ]
  },

  {
    id: 'training-digital-marketing',
    title: 'Digital Marketing & SEO Mastery',
    icon: '📈',
    category: 'Marketing',
    tagline: 'Rank on Google, run profitable ad campaigns, and grow businesses online',
    description: 'A complete digital marketing program covering SEO, content marketing, Google Ads, social media advertising, email marketing, and analytics. Learn how to drive organic traffic, convert visitors into customers, and measure everything. By the end, you will be able to manage digital marketing for your own business or offer it as a high-demand freelance service.',
    level: 'Beginner to Advanced',
    durationWeeks: 6,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    instructor: 'CreatiHub Studio Team',
    rating: 4.9,
    enrolled: 410,
    maxStudents: 50,
    highlights: [
      '6 weeks of comprehensive marketing training',
      'Learn SEO, Google Ads, email & social ads',
      'Run a real campaign from start to finish',
      'Offer digital marketing as a freelance service',
      'Certificate of completion'
    ],
    tracks: ['track-writing-seo'],
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 110,
        desc: 'Self-paced with community support',
        features: [
          'All 6 weekly modules (recorded)',
          'Community Discord access',
          'Marketing templates & checklists',
          'Certificate of completion',
          'Email support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 99, perPayment: 99, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 110, perPayment: 55, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 110, perPayment: 37, discountPct: 0, note: 'Pay in 3 parts' }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 260,
        desc: 'Live cohort + campaign review + mentor support',
        features: [
          'Everything in Basic',
          'Weekly live strategy sessions',
          'Personal campaign reviews',
          'Real campaign build-along',
          'Priority support'
        ],
        installments: [
          { id: 'full', label: 'Pay in full', count: 1, total: 234, perPayment: 234, discountPct: 10, note: '10% early-bird discount' },
          { id: 'two', label: '2 instalments', count: 2, total: 260, perPayment: 130, discountPct: 0, note: '50% now, 50% in week 3' },
          { id: 'three', label: '3 instalments', count: 3, total: 260, perPayment: 87, discountPct: 0, note: '~33% each over 3 payments' },
          { id: 'monthly', label: 'Weekly', count: 6, total: 260, perPayment: 43, discountPct: 0, note: '$43/week × 6 weeks' }
        ]
      }
    ],
    modules: [
      { week: 1, title: 'Digital Marketing Foundations', desc: 'The digital marketing landscape, customer journey, marketing funnels, and goal setting.' },
      { week: 2, title: 'SEO Mastery', desc: 'Keyword research, on-page SEO, technical SEO, link building, and ranking on Google.' },
      { week: 3, title: 'Content Marketing', desc: 'Content strategy, blogging, lead magnets, and content that converts.' },
      { week: 4, title: 'Google Ads & PPC', desc: 'Setting up campaigns, keyword targeting, ad copy, bidding, and optimization.' },
      { week: 5, title: 'Social Media Advertising', desc: 'Facebook/Instagram ads, audience targeting, creative, and retargeting.' },
      { week: 6, title: 'Email & Analytics', desc: 'Email marketing sequences, Google Analytics, reporting, and proving ROI to clients.' }
    ]
  }
];

module.exports = { seedTrainingPrograms };
