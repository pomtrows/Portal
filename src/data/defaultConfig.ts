import type { DashboardConfig } from '../types';

export const defaultConfig: DashboardConfig = {
  title: "Portal",
  sections: [
    {
      id: "sec-1",
      title: "Développement",
      items: [
        {
          id: "link-1",
          title: "GitHub",
          url: "https://github.com",
          description: "Dépôts de code",
          icon: "Github"
        },
        {
          id: "link-2",
          title: "StackOverflow",
          url: "https://stackoverflow.com",
          description: "Q&A pour les développeurs",
          icon: "Terminal"
        }
      ]
    },
    {
      id: "sec-2",
      title: "Loisirs & Streaming",
      items: [
        {
          id: "link-3",
          title: "YouTube",
          url: "https://youtube.com",
          description: "Vidéos",
          icon: "Youtube"
        },
        {
          id: "link-4",
          title: "Netflix",
          url: "https://netflix.com",
          description: "Films et séries",
          icon: "Tv"
        },
        {
          id: "link-5",
          title: "Twitch",
          url: "https://twitch.tv",
          description: "Livestreams",
          icon: "Twitch"
        }
      ]
    },
    {
      id: "sec-3",
      title: "Outils",
      items: [
        {
          id: "link-6",
          title: "ChatGPT",
          url: "https://chat.openai.com",
          description: "Assistant IA",
          icon: "Bot"
        },
        {
          id: "link-7",
          title: "Figma",
          url: "https://figma.com",
          description: "Design UI/UX",
          icon: "Figma"
        }
      ]
    }
  ]
};
