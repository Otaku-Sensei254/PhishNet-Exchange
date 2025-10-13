// community.js

import face1 from "../../assets/mui.jpeg";
import face2 from "../../assets/sasuke.jpeg";
import face3 from "../../assets/minato.jpeg";
export const posts = [
  {
    id: 1,
    username: "CyberWarrior",
    avatar: { face1 },
    timestamp: "2025-05-24T08:32:00Z",
    content:
      "Just received a phishing email pretending to be from PayPal. Be careful!",
    tags: ["#phishing", "#paypal", "#email"],
    image: "/images/phishing_example1.png",
    comments: [],
    likes: 12,
    commentCount: 1,
  },
  {
    id: 2,
    username: "SecOpsQueen",
    avatar: { face2 },
    timestamp: "2025-05-24T09:15:00Z",
    content: "New spear-phishing tactic spotted targeting finance teams.",
    tags: ["#spearphishing", "#finance", "#payload"],
    file: "/files/report.pdf",
    comments: [],
    likes: 25,
    commentCount: 0,
  },
  {
    id: 3,
    username: "ByteKnight",
    avatar: { face3 },
    timestamp: "2025-05-24T10:02:00Z",
    content: "Amazon scam alert. Users receiving fake order confirmations.",
    tags: ["#amazon", "#fakeorder", "#scam"],
    comments: [],
    likes: 7,
    commentCount: 0,
  },
];

export const suggestedDiscussions = [
  "How to identify spear-phishing?",
  "What tools detect payload-based phishing?",
  "Best email gateways for filtering phishing threats",
];

export const topContributors = [
  { username: "CyberWarrior", avatar: { face1 } },
  { username: "SecOpsQueen", avatar: "/avatars/user2.png" },
  { username: "ByteKnight", avatar: "/avatars/user3.png" },
];
