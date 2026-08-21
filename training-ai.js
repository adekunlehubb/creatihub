// ============================================================
// CreatiHub AI Training Engine + Email Assistant
// ============================================================
// Uses the same dual-provider AI engine (Gemini / OpenAI) that powers
// the service marketplace to:
//
//   1. Generate full lesson content for each training module
//   2. Act as an interactive AI tutor (students ask questions)
//   3. Draft marketing/motivational emails for the admin broadcast system
//
// If no AI key is configured, falls back to rich pre-built lesson
// templates so the training academy still works in demo mode.
// ============================================================

const { generateTextRaw, aiProviderLabel, IS_LIVE } = require('./generator');

// ---------------- Lesson content generation ----------------
// Produces a structured, comprehensive lesson for a training module.
// Returns markdown-formatted content with sections, examples, and exercises.

async function generateLesson(program, module, tierName) {
  const prompt = `You are an expert instructor creating a comprehensive, engaging lesson for an online training program.

PROGRAM: ${program.title}
CATEGORY: ${program.category}
LEVEL: ${program.level}
TIER: ${tierName}
DURATION: ${program.durationWeeks} weeks total (this is Week ${module.week})

LESSON TOPIC: ${module.title}
LESSON DESCRIPTION: ${module.desc}

Create a complete, well-structured lesson in Markdown format. Include:

## Learning Objectives
(3-5 bullet points of what the student will learn)

## Lesson Content
(Write a thorough, engaging explanation of the topic. Use clear language, real-world examples, and practical insights. This should be substantial — at least 800 words. Break it into logical subsections with ### headings. Make it feel like a real lecture from a passionate expert.)

## Practical Example
(Walk through a concrete real-world example or case study that illustrates the concepts)

## Hands-On Exercise
(A specific, actionable exercise the student can do right now to practice)

## Key Takeaways
(5 bullet points summarizing the most important points)

## Next Steps
(What the student should do before the next module)

Make the tone encouraging, practical, and accessible. Avoid jargon when possible, or explain it when used. The student may be a beginner, so build from fundamentals.`;

  if (!IS_LIVE) {
    return demoLesson(program, module, tierName);
  }

  try {
    const content = await generateTextRaw(prompt, { temperature: 0.7, maxTokens: 8192 });
    return content;
  } catch (e) {
    // Fallback to demo content if the AI call fails
    return demoLesson(program, module, tierName) + '\n\n---\n*Note: AI generation was unavailable. Showing pre-built lesson content. ' + e.message + '*';
  }
}

// Pre-built lesson template for demo mode (no AI key configured)
function demoLesson(program, module, tierName) {
  return `## Learning Objectives

By the end of this lesson, you will be able to:
- Understand the core concepts of **${module.title}**
- Apply these concepts in real-world scenarios within ${program.category}
- Recognize common pitfalls and how to avoid them
- Build confidence to move to the next module

## Lesson Content

### Introduction to ${module.title}

Welcome to Week ${module.week} of the **${program.title}** program! In this module, we'll dive deep into **${module.title}** — one of the most important topics in ${program.category}.

${module.desc}

This is a foundational topic that everything else in your ${program.category} journey builds upon. Whether you're looking to freelance, start your own business, or level up your current skills, mastering ${module.title} will give you a significant advantage.

### Core Concepts

Let's break down the key concepts you need to understand:

**1. Understanding the Fundamentals**

Every great practitioner started with the basics. ${module.title} is no different. The fundamental principle here is that success comes from consistent practice and a clear understanding of why things work the way they do. Don't just memorize — understand the "why" behind each concept.

**2. Real-World Application**

Theory is important, but application is where the magic happens. In ${program.category}, the difference between amateurs and professionals is often just the amount of real-world practice. Throughout this lesson, think about how each concept applies to a project you're currently working on or want to work on.

**3. Common Mistakes to Avoid**

Many beginners in ${program.category} make the same avoidable mistakes. The most common one is rushing through the fundamentals. Take your time with this module — re-read sections, do the exercises, and make sure you truly understand before moving on.

### Deep Dive

Now let's go deeper. ${module.title} involves several interconnected skills:

- **Planning**: Before you start any work, you need a clear plan. What's the goal? Who's the audience? What does success look like?
- **Execution**: This is where you put your plan into action. Quality matters here — take pride in your work.
- **Review**: Always review your work with fresh eyes. Better yet, get feedback from others.
- **Iteration**: Rarely is the first version the best version. Be willing to revise and improve.

### Pro Tips

Here are some insights that experienced professionals in ${program.category} wish they'd known from the start:

- Start with simple projects and gradually take on more complex ones
- Build a portfolio as you learn — every exercise can be a portfolio piece
- Connect with others in the community — learning together is faster than learning alone
- Don't be afraid to make mistakes — they're your best teachers

## Practical Example

Let's walk through a real scenario:

**Scenario**: A client approaches you needing help with ${module.title.toLowerCase()} for their business.

**Step 1**: Listen carefully to understand their needs. Ask clarifying questions. What problem are they trying to solve?

**Step 2**: Propose a clear approach. Break the work into manageable steps and explain your process to the client.

**Step 3**: Execute with quality. Pay attention to details that matter to the client.

**Step 4**: Deliver and ask for feedback. Use it to improve both this project and your future work.

This is exactly the process you'll use throughout your career in ${program.category}.

## Hands-On Exercise

**Your exercise for this module:**

Apply what you've learned about ${module.title} to a mini-project:

1. Choose a small, real-world scenario (it can be hypothetical)
2. Plan your approach using the framework above
3. Execute the first step
4. Write down what went well and what you'd improve

This exercise should take 30-60 minutes. Don't skip it — practice is where real learning happens!

## Key Takeaways

- ${module.title} is a foundational skill in ${program.category} that requires both understanding and practice
- Always start with planning, execute with quality, and iterate based on feedback
- Real-world application is more important than theory alone
- Building a portfolio as you learn accelerates your growth
- Mistakes are valuable learning opportunities — don't fear them

## Next Steps

Before moving to the next module:
- ✅ Complete the hands-on exercise above
- ✅ Review the key takeaways and make sure you understand each one
- ✅ If you have questions, ask your tutor (use the chat box below)
- ✅ Start thinking about how this module connects to the next topic

Great work completing Week ${module.week}! You're building real skills that will serve you throughout your career. Keep going — you've got this! 🚀`;
}

// ---------------- AI Tutor chat ----------------
// Students ask questions about a lesson and the AI answers as their tutor.

async function tutorChat(program, module, lessonContent, question, conversationHistory) {
  const historyText = (conversationHistory || [])
    .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');

  const prompt = `You are a friendly, knowledgeable tutor for an online training program. Your job is to help the student understand the lesson material, answer their questions, and keep them motivated.

PROGRAM: ${program.title}
CURRENT MODULE: Week ${module.week} — ${module.title}
MODULE DESCRIPTION: ${module.desc}

LESSON CONTENT (for reference):
${(lessonContent || '').slice(0, 3000)}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}\n\n` : ''}STUDENT QUESTION: ${question}

Respond as a supportive tutor. Be clear, encouraging, and practical. Use examples. If the student seems discouraged, motivate them. Keep your response focused and not too long (200-400 words). Use Markdown formatting for readability.`;

  if (!IS_LIVE) {
    return `That's a great question about **${module.title}**! 

Here's what I'd highlight: ${module.desc}

Let me share some key insights for this topic:

1. **Break it down**: Don't try to understand everything at once. Focus on one concept at a time.
2. **Practice**: The best way to learn is by doing — try the hands-on exercise in the lesson.
3. **Be patient**: Learning ${program.category} takes time. You're making progress just by asking good questions!

Keep going — you're doing great! 🚀`;
  }

  try {
    return await generateTextRaw(prompt, { temperature: 0.6, maxTokens: 2048 });
  } catch (e) {
    return `I'd love to help with that, but I'm having trouble connecting right now. Please try again in a moment!`;
  }
}

// ---------------- Email template generation ----------------
// The admin describes what kind of email they want, and the AI drafts it.
// Types: motivational, payment_reminder, promotional, completion, reengagement, custom

const EMAIL_TYPES = {
  motivational: {
    label: 'Motivational / Encouraging',
    icon: '🔥',
    description: 'Encourage students (especially those on installment plans) to keep going and not give up',
    defaultPrompt: 'Write a motivational email encouraging students who are on installment payment plans to keep going. Remind them of the value they\'re getting, how far they\'ve come, and that completing the program will transform their skills and income. Be warm, personal, and inspiring.'
  },
  payment_reminder: {
    label: 'Payment Reminder',
    icon: '💳',
    description: 'Gentle reminder about an upcoming or overdue installment payment',
    defaultPrompt: 'Write a friendly payment reminder email for students who have an installment payment due. Be gentle and encouraging — not demanding. Remind them of the benefits of continuing, include a link to their training dashboard to pay, and let them know you\'re here to help if they have any issues.'
  },
  promotional: {
    label: 'Promotional / New Offer',
    icon: '📢',
    description: 'Announce a new program, discount, or special offer',
    defaultPrompt: 'Write a promotional email announcing a special discount on our training programs. Create urgency and excitement. Highlight the transformation students will experience and the limited-time nature of the offer.'
  },
  completion: {
    label: 'Course Completion',
    icon: '🎉',
    description: 'Congratulate students who completed a training program',
    defaultPrompt: 'Write a congratulatory email for a student who has completed a training program. Celebrate their achievement, remind them of the skills they\'ve gained, encourage them to download their certificate, and suggest next steps (advanced programs, freelancing, applying their skills).'
  },
  reengagement: {
    label: 'We Miss You / Re-engagement',
    icon: '👋',
    description: 'Reach out to inactive students to bring them back',
    defaultPrompt: 'Write a warm "we miss you" email for students who haven\'t been active in their training program. Be understanding and non-judgmental. Remind them of what they\'re missing, offer help, and make it easy to come back. Include a link to their dashboard.'
  },
  custom: {
    label: 'Custom (AI writes from your description)',
    icon: '✏️',
    description: 'Describe what you want and the AI will draft it',
    defaultPrompt: ''
  }
};

async function generateEmail(type, customPrompt, context) {
  const emailType = EMAIL_TYPES[type] || EMAIL_TYPES.custom;
  const userInstruction = customPrompt || emailType.defaultPrompt;

  const contextInfo = context ? `
CONTEXT ABOUT THE RECIPIENT(S):
${context}
` : '';

  const prompt = `You are an expert email copywriter for CreatiHub, a creative services and training platform. Write a professional, engaging email that the admin will send to users.

EMAIL TYPE: ${emailType.label}
${contextInfo}
ADMIN'S INSTRUCTION: ${userInstruction}

Write the email with:
- A compelling subject line (prefix with "Subject: ")
- A warm, personal greeting
- Engaging body content (use short paragraphs, be conversational, not corporate)
- A clear call-to-action
- A friendly sign-off from "The CreatiHub Team"

Format the output as:
Subject: [subject line here]

[email body here]

Make it feel authentic and human — not like a template. Keep it concise but impactful (150-300 words for the body). Use Markdown formatting where helpful.`;

  if (!IS_LIVE) {
    return demoEmail(type, userInstruction, context);
  }

  try {
    return await generateTextRaw(prompt, { temperature: 0.8, maxTokens: 2048 });
  } catch (e) {
    return demoEmail(type, userInstruction, context) + '\n\n---\n*Note: AI generation was unavailable. Showing template draft. ' + e.message + '*';
  }
}

function demoEmail(type, userInstruction, context) {
  const templates = {
    motivational: `Subject: You're closer than you think — keep going! 🔥

Hi there,

I was just looking at your progress in the training program, and I wanted to reach out personally.

I know paying in installments can feel like a long journey. But here's the thing — every payment you've made is an investment in skills that will pay you back many times over. The students who push through? They're the ones who land the clients, start the businesses, and transform their careers.

You've already come further than most people ever do. Most people *think* about learning new skills. You're actually doing it.

So here's my ask: don't stop now. Keep showing up. Keep practicing. Keep paying those installments. Because on the other side of this program is a version of you that can charge real money for real skills.

If there's anything I can do to help you keep moving forward — just reply to this email. I'm here.

You've got this. 💪

— The CreatiHub Team`,

    payment_reminder: `Subject: A friendly reminder about your next installment 💳

Hi there,

Just a quick note — your next installment payment for your training program is coming up.

No pressure at all — I just wanted to make sure it didn't slip through the cracks. Life gets busy, I know!

Here's why it's worth staying on track: each payment unlocks the next set of modules, bringing you closer to completion and your certificate. The skills you're building are real, marketable skills that can open doors for you.

👉 You can make your payment anytime here: [Training Dashboard Link]

If you're facing any challenges — financial, technical, or anything else — just reply to this email. We're a small team and we actually care. We can work something out.

Keep going! You're doing great.

— The CreatiHub Team`,

    promotional: `Subject: Something exciting just launched 🎉 (special offer inside)

Hi there,

Big news! We've just expanded our training programs — and for the next 72 hours, you can enroll at a special discount.

Whether you've been thinking about leveling up your web design skills, mastering AI automation, or learning graphic design, now is the perfect time. These are the exact skills that businesses are desperate for right now.

Here's what's special about this offer:
✅ Up to 10% off when you pay in full
✅ Flexible installment plans available
✅ AI-powered lessons that adapt to your pace
✅ Certificate of completion
✅ Lifetime access to course materials

But this discount won't last. In 72 hours, prices go back to normal.

👉 Explore programs and claim your discount: [Training Programs Link]

Don't wait — your future self will thank you.

— The CreatiHub Team`,

    completion: `Subject: Congratulations — you did it! 🎉🎓

Hi there,

I'm thrilled to tell you that you've officially completed your training program!

This is a big deal. You showed up, put in the work, and pushed through to the finish line. That takes real dedication — and it's exactly the kind of commitment that separates successful people from the rest.

Here's what you can do now:
🎓 Download your certificate of completion from your dashboard
💼 Start applying your skills — freelance, start a business, or level up at work
📚 Consider an advanced program to go even deeper
🤝 Join our community of graduates to network and share opportunities

Your certificate is ready and waiting for you:
👉 [Training Dashboard Link]

We're so proud of you. Go out there and show the world what you can do!

— The CreatiHub Team`,

    reengagement: `Subject: We miss you — and your training is waiting 👋

Hi there,

I noticed it's been a little while since you last logged into your training program, and I wanted to check in.

No judgment at all — life happens. Work gets busy, family needs attention, motivation dips. We've all been there.

But here's what I want you to know: your progress isn't lost. Your modules are still there, waiting for you. Your training is ready whenever you are.

Sometimes all it takes is logging back in, doing one lesson, and the momentum comes back.

👉 Here's your link to jump back in: [Training Dashboard Link]

If something's holding you back — anything at all — just reply to this email. Whether it's a payment question, a technical issue, or just needing some motivation, I'm here to help.

We believe in you. Come back when you're ready.

— The CreatiHub Team`,

    custom: `Subject: A message from CreatiHub

Hi there,

${userInstruction || 'We wanted to reach out and share something important with you.'}

If you have any questions, just reply to this email — we're always happy to help.

— The CreatiHub Team`
  };

  return templates[type] || templates.custom;
}

module.exports = {
  generateLesson,
  tutorChat,
  generateEmail,
  EMAIL_TYPES,
  aiProviderLabel
};
