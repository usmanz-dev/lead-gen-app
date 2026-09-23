-- Seed content so the blog is demonstrable end to end, and so pagination
-- and category filtering have something real to work against. These are
-- genuine posts, not lorem ipsum — delete or edit them freely via the
-- dashboard once real content exists.

insert into public.posts (slug, title, excerpt, content, category, published_at, status)
values
(
  'how-the-opportunity-score-actually-works',
  'How the Opportunity Score Actually Works',
  'A 0-100 number is only useful if you trust what''s behind it. Here''s exactly how LocalLeads AI decides which businesses need you most.',
  $md$Every lead LocalLeads AI finds gets scored from 0 to 100 the moment it's discovered. The number itself isn't the point — the breakdown behind it is. This post walks through exactly how that score is built, so you know precisely why a lead landed where it did.

## Why a single score at all

Before the Opportunity Score existed, evaluating a lead meant opening five browser tabs: the Google Maps listing, the business's website (if it had one), a manual mobile-friendliness check, an SSL check, and a guess about how active the business looked on social media. That's fine for one lead. It falls apart at fifty.

The score compresses all of that into one weighted number, with the reasoning still fully visible underneath it. You're never trusting a black box — you're trusting arithmetic you can read.

## The signals that make up the score

### No website

The single heaviest signal. A local business with zero web presence is almost always losing customers to competitors who show up in search. This contributes the largest share of the score.

### Review count and rating

Businesses with very few reviews, or a rating that's dragging (generally under 4.0), are visibly under-marketed. Both low review count and low rating are scored independently, because they mean different things — a 4.8 rating with six reviews is a different problem than a 3.2 rating with two hundred.

### Missing business hours

Sounds minor. It isn't. A Google Maps listing without hours is a common sign of a profile nobody has touched since it was created, which usually means nobody's actively managing the business's online presence at all.

### No social presence

If a search for the business turns up no active Facebook, Instagram, or LinkedIn, that's one more data point toward "nobody here is thinking about marketing right now" — which is exactly the kind of business that responds well to an outside pitch.

### Website quality, when a website exists

If the business does have a website, two more checks kick in: whether it's reasonably mobile-friendly, and whether it has a valid SSL certificate. A business with an outdated, non-secure website is a different (and often easier) sell than a business with no website at all — different pitch, same underlying opportunity.

## Reading the score bands

- **70-100 (High):** Multiple strong signals stacked together. These are usually the fastest closes.
- **40-69 (Medium):** A mix of gaps and strengths. Worth pursuing, but the pitch needs to be more targeted.
- **0-39 (Low):** The business already has most of the fundamentals in place. Not necessarily a bad lead — sometimes it means a different kind of pitch (rank tracking, ongoing management) rather than "you need a website."

## Using the breakdown, not just the number

Every lead's score page shows the full list of contributing factors, not just the total. That breakdown is what actually goes into your outreach — an email that says "I noticed your business doesn't show up with a working website" is a very different email than a generic "we do SEO" pitch, and it converts differently too.

The score exists to save you time deciding *who* to contact. The breakdown exists to help you decide *what to say* once you do.
$md$,
  'Local SEO',
  now() - interval '2 days',
  'published'
),
(
  '5-signs-a-local-business-is-ready-to-buy-seo',
  '5 Signs a Local Business Is Ready to Buy SEO Services',
  'Not every low-scoring lead is worth the same pitch. These are the patterns worth paying attention to before you write the first email.',
  $md$The Opportunity Score gets you most of the way to "who's worth contacting." These five patterns help you go further — they're less about whether a business needs help, and more about whether they're likely to actually say yes when you offer it.

## 1. They've clearly tried something, once

A business with an abandoned Facebook page from three years ago, or a website that hasn't been updated since it was built, has already decided marketing matters — they just didn't follow through. That's a much warmer starting point than a business that's never tried anything at all, because you're not convincing them marketing works. You're convincing them it's worth trying again, with someone who'll actually follow through.

## 2. A competitor nearby is visibly winning

If you pull up the map pack for their exact keyword and a direct competitor sits in position one while they're nowhere to be found, that's not an abstract pitch — it's a screenshot. Nothing sells local SEO faster than showing someone exactly who's eating their lunch.

## 3. They're clearly busy, but not visible

Good review volume, decent rating, obviously a real, functioning business — just invisible online. This is often the easiest yes of all, because you're not pitching them on "is my business good enough to market." You're pitching a business that already knows it's good and just hasn't gotten around to being found.

## 4. Recent negative reviews with no response

A business that isn't responding to reviews — good or bad — is a business nobody is managing online. That's an opening for more than SEO: reputation management is an easy add-on once you're already in the door.

## 5. They're a newer business (under 2 years)

Newer businesses are still forming their habits around where money goes. They haven't settled into "we don't do that" the way an established business with fifteen years of doing things the old way sometimes has.

None of these replace the Opportunity Score — they layer on top of it. The score tells you who needs help. These patterns help you guess who's actually going to pick up the phone.
$md$,
  'Local SEO',
  now() - interval '9 days',
  'published'
),
(
  'why-generic-cold-emails-dont-work',
  'Why Generic Cold Emails Don''t Work (And What Does)',
  'The reply rate difference between a templated pitch and a specific one isn''t small. Here''s what actually changes when an email references something real.',
  $md$If you've ever sent a batch of cold emails that all say some version of "we help businesses grow with SEO," you already know the reply rate. It's close to zero, and it should be — that email could have been sent to literally any business on earth.

## The problem isn't cold email. It's generic email.

Cold outreach works. Fifteen years of SaaS and agency growth is built on it. What doesn't work is outreach that could apply to anyone, because the moment a reader senses a template, the message becomes background noise — the same category as a phishing attempt or a spam offer, mentally filed and deleted in under two seconds.

## What "specific" actually means

Specific doesn't mean "uses their first name." Mail-merge solved that problem decades ago and it didn't move the needle, because a name swap is still obviously automated once you read the second sentence.

Specific means the email demonstrates you looked at *this* business, not just found it in a list:

- "I noticed your Google Maps listing doesn't have a website linked" — references something true and checkable.
- "Your competitor two blocks over is ranking above you for [keyword]" — shows research, not a template.
- "Your last few reviews mention slow response times" — shows you actually looked, not just scraped.

This is exactly why LocalLeads AI's AI Outreach Generator writes from the lead's actual Opportunity Score breakdown instead of a fill-in-the-blank template — the email is different for every lead because the reasons are different for every lead.

## Length matters more than people think

Long cold emails ask for more attention than a stranger owes you. Every draft should be short enough to read in the time it takes to open it — under 150 words is a good ceiling. If your pitch needs three paragraphs to make its case, the first message isn't the place to make the full case. It's the place to earn a reply.

## The CTA should ask for almost nothing

"Let's hop on a 30-minute call" is a big ask from someone who doesn't know you yet. "Worth a quick reply if this is relevant?" costs the reader ten seconds. Lower the bar on the first message; you can ask for more once they've responded once.

## Compliance isn't optional, and it isn't just legal cover

Every outreach email should include a working unsubscribe link and clear sender identification, full stop — not just because CAN-SPAM and similar laws require it, but because a business that can't tell who's emailing them, or can't opt out, reports the email instead of ignoring it. That's worse for deliverability than a low reply rate ever will be.

Personalized, short, low-friction, compliant. That combination is the entire difference between a cold email that gets deleted and one that gets a reply.
$md$,
  'Cold Outreach',
  now() - interval '16 days',
  'published'
),
(
  'announcing-localleads-ai',
  'Announcing LocalLeads AI: Find, Qualify, and Close Local Clients in One Platform',
  'Why we built one platform instead of another point solution, and what it replaces.',
  $md$Today we're opening up LocalLeads AI: a single platform that finds local businesses that need SEO help, tells you exactly why they need it, verifies how to reach them, and drafts the outreach — automatically.

## The problem we kept running into

Running local SEO for clients meant juggling three or four separate tools just to find the *next* client: a scraper or manual Google Maps search for leads, a separate email-finding tool, a separate validator so campaigns didn't bounce, and a separate AI writing tool (or no AI at all) for the actual outreach. None of those tools talked to each other, and switching between them was where most of the actual time went — not the strategy, the plumbing.

## What's live today

- **Lead Extraction** — search any niche and location, get every matching business from Google Maps in seconds.
- **Opportunity Score** — every lead scored 0-100 with a full, visible breakdown of why.
- **Email Finder & Validator** — every email classified Valid, Risky, Invalid, or Unknown before you ever send to it.
- **AI Outreach Generator** — a short, specific email per lead, written from that lead's actual score breakdown.
- **Rank Tracker** — grid-based Google Maps rank tracking to prove results, or scope a competitor.
- **White-Label Reports** — a branded PDF audit, one click away, for any lead.

## What's next

Team collaboration, a full CRM pipeline, and deeper campaign analytics are all in progress. If there's something specific slowing down your prospecting that isn't listed here, [tell us](/about) — that's exactly the kind of feedback that shapes what gets built next.

Thanks for reading this far. Go run your first search.
$md$,
  'Product Updates',
  now() - interval '23 days',
  'published'
);
