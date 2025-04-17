// Organize the default questions by category
const defaultQuestions = [
  // Category 0: Basic Orientation & Preferences
  {
    text: "Which gender(s) are you attracted to?",
    options: [
      "Men",
      "Women",
      "Both men and women",
      "I'm open to all gender identities"
    ]
  },
  {
    text: "What kind of connection are you looking for?",
    options: [
      "Friendship only",
      "Casual dating or fling",
      "Long-term relationship",
      "Friends with benefits"
    ]
  },
  
  // Category 1: Personality & Compatibility
  {
    text: "How do you usually handle conflicts?",
    options: [
      "Talk it out immediately",
      "Take time to think before responding",
      "Avoid it and hope it resolves itself",
      "Joke about it to lighten the mood"
    ]
  },
  {
    text: "What's your love language?",
    options: [
      "Words of affirmation",
      "Physical touch",
      "Quality time",
      "Acts of service",
      "Gifts"
    ]
  },
  {
    text: "You have an entire day off with no plans. What do you do?",
    options: [
      "Go on a spontaneous adventure",
      "Stay in and relax",
      "Work on a personal project",
      "Meet up with friends"
    ]
  },
  {
    text: "How do you handle meeting new people?",
    options: [
      "Super social, I talk to everyone",
      "I warm up after a bit",
      "I stick with the people I know",
      "I let others approach me first"
    ]
  },
  
  // Category 2: Flirty & Romantic Preferences
  {
    text: "How do you like to flirt?",
    options: [
      "Playful teasing",
      "Deep, meaningful convos",
      "Straightforward and direct",
      "Flirting? I'm clueless."
    ]
  },
  {
    text: "What's your biggest turn-on in a person?",
    options: [
      "Sense of humor",
      "Confidence",
      "Intelligence",
      "Kindness"
    ]
  },
  {
    text: "If your vibe was a rom-com character, you'd be:",
    options: [
      "The charming heartbreaker",
      "The mysterious one people chase",
      "The funny best friend",
      "The hopeless romantic"
    ]
  },
  
  // Category 3: Party & Social Vibes
  {
    text: "What's your role at a party?",
    options: [
      "Dancing like no one's watching",
      "Making new friends everywhere",
      "Hosting or planning the fun",
      "Vibing in the background, watching the chaos unfold"
    ]
  },
  {
    text: "How do you feel about PDA (public displays of affection)?",
    options: [
      "Love it, why hide it?",
      "Small gestures are nice, but nothing too much",
      "Not really my thing",
      "Only if I really like the person"
    ]
  },
  {
    text: "You meet someone interesting—how do you start the convo?",
    options: [
      "Compliment their outfit",
      "Make a joke",
      "Ask a deep question",
      "Wait for them to talk first"
    ]
  },
  
  // Category 4: Icebreakers & Fun Personality Questions
  {
    text: "What's your ideal date night?",
    options: [
      "Fancy dinner and deep convos",
      "Movie and chill",
      "Something adventurous (hiking, escape room)",
      "A fun night out"
    ]
  },
  
  // Category 5: Deep Personality & Self-Reflection
  {
    text: "How do you usually make decisions?",
    options: [
      "I trust my gut instinct",
      "I analyze everything before deciding",
      "I ask others for advice first",
      "I just go with whatever feels easiest"
    ]
  },
  {
    text: "How do you handle stressful situations?",
    options: [
      "Stay calm and think logically",
      "Talk it out with someone I trust",
      "Distract myself with something fun",
      "Panic first, then figure it out"
    ]
  },
  {
    text: "What motivates you the most in life?",
    options: [
      "Personal growth and self-improvement",
      "Making deep connections with people",
      "Success, wealth, and achievement",
      "Living in the moment and enjoying life"
    ]
  },
  {
    text: "If you had to pick, which one defines you the most?",
    options: [
      "Dreamer – always thinking about the future",
      "Realist – practical and logical",
      "Free spirit – go with the flow, live in the moment",
      "Strategist – always planning the next move"
    ]
  },
  {
    text: "When faced with a big life change, you usually:",
    options: [
      "Embrace it fully, change is exciting!",
      "Take time to adjust but go with it",
      "Resist it at first but eventually adapt",
      "Overthink every possible outcome before acting"
    ]
  },
  {
    text: "Do you believe in love at first sight?",
    options: [
      "100%, instant connections are real",
      "Maybe, but love takes time to grow",
      "Not really, attraction is different from love",
      "No, love is built through experiences"
    ]
  }
];

module.exports = defaultQuestions;
