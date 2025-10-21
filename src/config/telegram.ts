export const TG_BOT_USERNAME = import.meta.env.VITE_TG_BOT_USERNAME || 'kubiv3421bot';
export const TG_APP_SHORTNAME = import.meta.env.VITE_TG_APP_SHORTNAME || 'Kubic';

export const buildStartAppJoinUrl = (lobbyId: string) => {
  const bot = TG_BOT_USERNAME;
  const app = TG_APP_SHORTNAME;
  return `https://t.me/${bot}/${app}?startapp=join_${lobbyId}`;
};

export const buildShareUrl = (deepLinkUrl: string, text: string) => {
  return `https://t.me/share/url?url=${encodeURIComponent(deepLinkUrl)}&text=${encodeURIComponent(text)}`;
};


