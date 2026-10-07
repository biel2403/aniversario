let loading;
export function loadSpotifySdk() {
  if (window.Spotify?.Player) return Promise.resolve(window.Spotify);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    let script = document.getElementById('spotify-sdk');
    const timer = setTimeout(() => { loading = null; script?.remove(); reject(new Error('O player do Spotify demorou para responder. Tente conectar novamente.')); }, 15000);
    window.onSpotifyWebPlaybackSDKReady = () => { clearTimeout(timer); resolve(window.Spotify); };
    if (!script) {
      script = document.createElement('script'); script.id = 'spotify-sdk'; script.src = 'https://sdk.scdn.co/spotify-player.js'; script.async = true;
      script.onerror = () => { clearTimeout(timer); loading = null; script.remove(); reject(new Error('Não foi possível carregar o player do Spotify neste navegador.')); };
      document.head.appendChild(script);
    }
  });
  return loading;
}
